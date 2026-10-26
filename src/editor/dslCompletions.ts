import {
  NAMED_COLORS,
  SHAPE_DEFINITIONS,
  type ParamDefinition,
  type ShapeDefinition,
} from "@saramariaojeda9559/compiler-core";

export type CompletionKind = "command" | "param" | "value" | "shape";

export interface DslCompletion {
  readonly label: string;
  readonly kind: CompletionKind;
  /** Monaco snippet syntax (`${1:50}`) when `isSnippet`, plain text otherwise. */
  readonly insertText: string;
  readonly isSnippet: boolean;
  readonly detail: string;
}

const EXAMPLE_VALUES: Readonly<Record<string, string>> = {
  number: "50",
  color: "rojo",
  string: '"Texto"',
  shapeRef: "figura",
};

const TYPE_LABELS: Readonly<Record<string, string>> = {
  number: "número",
  color: "color",
  string: "texto",
  shapeRef: "figura",
};

const DEFINITIONS = new Map(SHAPE_DEFINITIONS.map((definition) => [definition.name, definition]));

/** `crear_circulo(radio=${1:50}, x=${2:50}, y=${3:50})` — required params only, as tab stops. */
function commandSnippet(definition: ShapeDefinition): string {
  const required = definition.params.filter((param) => param.required);
  const args = required.map((param, index) =>
    param.type === "shapeRef"
      ? `\${${index + 1}:${param.name}}`
      : `${param.name}=\${${index + 1}:${EXAMPLE_VALUES[param.type] ?? ""}}`,
  );
  return `${definition.name}(${args.join(", ")})`;
}

function paramSignature(param: ParamDefinition): string {
  return `${param.name}: ${TYPE_LABELS[param.type] ?? param.type}${param.required ? "" : " (opcional)"}`;
}

/** Identifiers already assigned a shape earlier in the program (`c1 = crear_...`). */
function declaredShapes(text: string): string[] {
  return [...new Set([...text.matchAll(/(?:^|;)\s*([A-Za-z_]\w*)\s*=\s*crear_\w+\s*\(/gm)].map((match) => match[1]!))];
}

function valueCompletions(param: ParamDefinition, fullText: string): DslCompletion[] {
  const plain = (label: string, kind: CompletionKind, detail: string): DslCompletion => ({
    label,
    kind,
    insertText: label,
    isSnippet: false,
    detail,
  });
  if (param.type === "color") {
    return Object.entries(NAMED_COLORS).map(([name, hex]) => plain(name, "value", hex));
  }
  if (param.type === "shapeRef") {
    return declaredShapes(fullText).map((name) => plain(name, "shape", "figura declarada"));
  }
  if (param.allowedValues) {
    return param.allowedValues.map((value) => plain(String(value), "value", param.name));
  }
  return [];
}

/**
 * What to suggest at the cursor, from the DSL's own registry
 * (SHAPE_DEFINITIONS / NAMED_COLORS) — so a new command or color shows up
 * here without touching the editor. Context is inferred from the text
 * before the cursor within the current statement:
 *   - outside a call        → commands (as snippets with required params)
 *   - inside `cmd(`         → that command's unused params (`name=`), plus
 *                             declared shapes for positional shape refs
 *   - right after `param=`  → valid values for that param
 */
export function completionsAt(textBeforeCursor: string, fullText: string): DslCompletion[] {
  const code = textBeforeCursor.replace(/\/\/[^\n]*/g, "");
  const statement = code.slice(code.lastIndexOf(";") + 1);
  const callMatch = /([A-Za-z_]\w*)\s*\(([^()]*)$/.exec(statement);

  if (!callMatch) {
    return SHAPE_DEFINITIONS.map((definition) => ({
      label: definition.name,
      kind: "command" as const,
      insertText: commandSnippet(definition),
      isSnippet: true,
      detail: definition.params.map(paramSignature).join(", "),
    }));
  }

  const definition = DEFINITIONS.get(callMatch[1]!);
  if (!definition) return [];

  const argsText = callMatch[2]!;
  const currentArg = argsText.slice(argsText.lastIndexOf(",") + 1);
  const assignment = /^\s*([A-Za-z_]\w*)\s*=\s*[^,]*$/.exec(currentArg);

  if (assignment) {
    const param = definition.params.find((candidate) => candidate.name === assignment[1]);
    return param ? valueCompletions(param, fullText) : [];
  }

  const used = new Set([...argsText.matchAll(/([A-Za-z_]\w*)\s*=/g)].map((match) => match[1]));
  const params: DslCompletion[] = definition.params
    .filter((param) => !used.has(param.name))
    .map((param) => ({
      label: `${param.name}=`,
      kind: "param" as const,
      insertText: `${param.name}=`,
      isSnippet: false,
      detail: paramSignature(param),
    }));

  // `conectar(c1, c2)` takes shape refs positionally — offer declared shapes too.
  const takesShapeRefs = definition.params.some((param) => param.type === "shapeRef");
  const shapes = takesShapeRefs
    ? declaredShapes(fullText).map((name) => ({
        label: name,
        kind: "shape" as const,
        insertText: name,
        isSnippet: false,
        detail: "figura declarada",
      }))
    : [];

  return [...shapes, ...params];
}
