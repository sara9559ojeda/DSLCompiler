import {
  BUILTIN_FUNCTIONS,
  GROUP_DEFINITION,
  KEYWORDS,
  NAMED_COLORS,
  SHAPE_DEFINITIONS,
  type ParamDefinition,
  type ShapeDefinition,
} from "@saramariaojeda9559/compiler-core";

export type CompletionKind = "command" | "param" | "value" | "shape" | "keyword" | "variable" | "function";

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

const DEFINITIONS = new Map<string, ShapeDefinition>(
  [...SHAPE_DEFINITIONS, GROUP_DEFINITION].map((definition) => [definition.name, definition]),
);
const BUILTINS = new Map(BUILTIN_FUNCTIONS.map((fn) => [fn.name, fn]));

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

export function paramSignature(param: ParamDefinition): string {
  return `${param.name}: ${TYPE_LABELS[param.type] ?? param.type}${param.required ? "" : " (opcional)"}`;
}

export function commandSignature(definition: ShapeDefinition): string {
  return `${definition.name}(${definition.params.map(paramSignature).join(", ")})`;
}

// ---------------------------------------------------------------------------
// Reading the program text (no parser: the text before the cursor is usually
// incomplete, so completion uses a tolerant scan instead of the real Parser).
// ---------------------------------------------------------------------------

/** The text with comments and the *contents* of strings blanked out (same length, same offsets). */
function maskCommentsAndStrings(text: string): string {
  let out = "";
  let index = 0;
  while (index < text.length) {
    const char = text[index]!;
    if (char === "/" && text[index + 1] === "/") {
      while (index < text.length && text[index] !== "\n") {
        out += " ";
        index += 1;
      }
    } else if (char === '"') {
      out += '"';
      index += 1;
      while (index < text.length && text[index] !== '"' && text[index] !== "\n") {
        out += " ";
        index += 1;
      }
      if (text[index] === '"') {
        out += '"';
        index += 1;
      }
    } else {
      out += char;
      index += 1;
    }
  }
  return out;
}

export interface UserFunction {
  readonly name: string;
  readonly params: readonly string[];
  /** Offset of the function's name in the source, for "go to definition". */
  readonly offset: number;
}

export interface Declarations {
  readonly shapes: readonly string[];
  readonly variables: readonly { readonly name: string; readonly offset: number; readonly constant: boolean }[];
  readonly functions: readonly UserFunction[];
}

/** Everything the program declares, found by pattern (good enough for suggestions, hover and go-to-definition). */
export function declarationsIn(text: string): Declarations {
  const code = maskCommentsAndStrings(text);
  const shapes = [...new Set([...code.matchAll(/(?:^|[;{}])\s*([A-Za-z_]\w*)\s*=\s*crear_\w+\s*\(/g)].map((m) => m[1]!))];
  const variables = [...code.matchAll(/\b(const|let)\s+([A-Za-z_]\w*)/g)].map((m) => ({
    name: m[2]!,
    constant: m[1] === "const",
    offset: m.index! + m[0].length - m[2]!.length,
  }));
  const functions = [...code.matchAll(/\bfuncion\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/g)].map((m) => ({
    name: m[1]!,
    params: m[2]!
      .split(",")
      .map((param) => param.trim())
      .filter(Boolean),
    offset: m.index! + m[0].indexOf(m[1]!),
  }));
  // Parameters of user functions are variables inside them.
  const parameters = functions.flatMap((fn) => fn.params.map((name) => ({ name, offset: fn.offset, constant: false })));
  return { shapes, variables: [...variables, ...parameters], functions };
}

interface OpenCall {
  readonly callee: string;
  /** Text inside the parentheses so far. */
  readonly inner: string;
}

/** The innermost call whose `(` is still open at the end of `code`. */
function innermostOpenCall(code: string): OpenCall | null {
  const stack: { callee: string; start: number }[] = [];
  for (let index = 0; index < code.length; index += 1) {
    const char = code[index]!;
    if (char === "(") {
      const before = /([A-Za-z_]\w*)\s*$/.exec(code.slice(0, index));
      stack.push({ callee: before?.[1] ?? "", start: index + 1 });
    } else if (char === ")") {
      stack.pop();
    }
  }
  const top = stack.at(-1);
  return top ? { callee: top.callee, inner: code.slice(top.start) } : null;
}

/** Splits at top-level commas only (commas inside nested parentheses belong to the nested call). */
function lastArgument(inner: string): { current: string; used: Set<string> } {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < inner.length; index += 1) {
    const char = inner[index];
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else if (char === "," && depth === 0) {
      parts.push(inner.slice(start, index));
      start = index + 1;
    }
  }
  const current = inner.slice(start);
  const used = new Set(parts.map((part) => /^\s*([A-Za-z_]\w*)\s*=(?!=)/.exec(part)?.[1]).filter((n): n is string => !!n));
  return { current, used };
}

const plain = (label: string, kind: CompletionKind, detail: string): DslCompletion => ({
  label,
  kind,
  insertText: label,
  isSnippet: false,
  detail,
});

function keywordSnippets(): DslCompletion[] {
  const snippet = (label: string, insertText: string, detail: string): DslCompletion => ({
    label,
    kind: "keyword",
    insertText,
    isSnippet: true,
    detail,
  });
  return [
    snippet("const", "const ${1:nombre} = ${2:10};", "Constante"),
    snippet("let", "let ${1:nombre} = ${2:10};", "Variable"),
    snippet(
      "para",
      "para (let ${1:i} = 0; ${1:i} < ${2:10}; ${1:i} = ${1:i} + 1) {\n\t$0\n}",
      "Bucle: repite el bloque",
    ),
    snippet("si", "si (${1:condicion}) {\n\t$0\n}", "Condicional"),
    snippet("funcion", "funcion ${1:nombre}(${2:a, b}) {\n\t$0\n}", "Define una función reutilizable"),
    snippet("diagrama", 'diagrama ${1|flujo,arquitectura,organigrama,proceso,red|} {\n\t${2:a} = nodo("${3:Inicio}");\n\t$0\n}', "Diagrama con layout automático"),
    snippet("grupo", "grupo(x=${1:0}, y=${2:0}) {\n\t$0\n}", "Agrupa figuras con una transformación"),
    snippet("retornar", "retornar ${1:valor};", "Devuelve un valor de la función"),
  ];
}

function builtinCompletions(): DslCompletion[] {
  return BUILTIN_FUNCTIONS.map((fn) => ({
    label: fn.name,
    kind: "function" as const,
    insertText: `${fn.name}(\${1})`,
    isSnippet: true,
    detail: fn.description,
  }));
}

function variableCompletions(declarations: Declarations): DslCompletion[] {
  const seen = new Set<string>();
  return declarations.variables
    .filter((variable) => !seen.has(variable.name) && seen.add(variable.name))
    .map((variable) => plain(variable.name, "variable", variable.constant ? "constante" : "variable"));
}

function functionCompletions(declarations: Declarations): DslCompletion[] {
  return declarations.functions.map((fn) => ({
    label: fn.name,
    kind: "function" as const,
    insertText: `${fn.name}(${fn.params.map((param, index) => `\${${index + 1}:${param}}`).join(", ")})`,
    isSnippet: true,
    detail: `funcion ${fn.name}(${fn.params.join(", ")})`,
  }));
}

function valueCompletions(param: ParamDefinition, declarations: Declarations): DslCompletion[] {
  const specific: DslCompletion[] =
    param.type === "color"
      ? Object.entries(NAMED_COLORS).map(([name, hex]) => plain(name, "value", hex))
      : param.type === "shapeRef"
        ? declarations.shapes.map((name) => plain(name, "shape", "figura declarada"))
        : param.allowedValues
          ? param.allowedValues.map((value) => plain(String(value), "value", param.name))
          : [];
  const computed = param.type === "number" ? builtinCompletions() : [];
  return [...specific, ...variableCompletions(declarations), ...computed];
}

/**
 * What to suggest at the cursor, from the DSL's own registry
 * (SHAPE_DEFINITIONS / NAMED_COLORS / BUILTIN_FUNCTIONS) — so a new command,
 * color or math function shows up here without touching the editor.
 *
 *   - start of a statement       → commands, your functions, keywords (as snippets)
 *   - inside `cmd(`              → that command's unused params (`name=`), plus
 *                                  declared shapes for positional shape refs
 *   - after `param=` (or an operator) → valid values, your variables, math functions
 *
 * The scan finds the innermost *open* call, so `x=cos(i * 30), ` still knows
 * it is inside `crear_circulo(`, not inside `cos(`.
 */
export function completionsAt(textBeforeCursor: string, fullText: string): DslCompletion[] {
  const code = maskCommentsAndStrings(textBeforeCursor);
  const declarations = declarationsIn(fullText);
  const open = innermostOpenCall(code);

  if (!open) {
    const statement = code.slice(Math.max(code.lastIndexOf(";"), code.lastIndexOf("{"), code.lastIndexOf("}")) + 1);
    // Mid-expression at statement level (`let a = 1 + `): values, not commands.
    if (/=(?!=)[^;{}]*[-+*/%<>!&|(,]\s*[\w]*$/.test(statement) && !/^\s*[\w]*$/.test(statement)) {
      return [...variableCompletions(declarations), ...builtinCompletions()];
    }
    return [
      ...SHAPE_DEFINITIONS.map((definition) => ({
        label: definition.name,
        kind: "command" as const,
        insertText: commandSnippet(definition),
        isSnippet: true,
        detail: definition.params.map(paramSignature).join(", "),
      })),
      ...functionCompletions(declarations),
      ...keywordSnippets(),
    ];
  }

  const { current, used } = lastArgument(open.inner);
  const definition = DEFINITIONS.get(open.callee);

  // A math builtin or a user function: values only.
  if (!definition) {
    const userFunction = declarations.functions.find((fn) => fn.name === open.callee);
    if (userFunction) {
      const unused = userFunction.params.filter((param) => !used.has(param));
      if (/=(?!=)/.test(current)) return [...variableCompletions(declarations), ...builtinCompletions()];
      return [...unused.map((param) => plain(`${param}=`, "param", "parámetro")), ...variableCompletions(declarations), ...builtinCompletions()];
    }
    return BUILTINS.has(open.callee) ? [...variableCompletions(declarations), ...builtinCompletions()] : [];
  }

  const assignment = /^\s*([A-Za-z_]\w*)\s*=(?!=)\s*(.*)$/s.exec(current);
  if (assignment) {
    const param = definition.params.find((candidate) => candidate.name === assignment[1]);
    return param ? valueCompletions(param, declarations) : [];
  }

  // Mid-expression in a positional argument (`crear_circulo(10 + `).
  if (/[-+*/%<>!&|]\s*\w*$/.test(current)) return [...variableCompletions(declarations), ...builtinCompletions()];

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
  const shapes = takesShapeRefs ? declarations.shapes.map((name) => plain(name, "shape", "figura declarada")) : [];

  return [...shapes, ...params];
}

// ---------------------------------------------------------------------------
// Hover and go-to-definition
// ---------------------------------------------------------------------------

const KEYWORD_DOCS: Readonly<Record<string, string>> = {
  const: "`const nombre = valor;` — constante: no puede reasignarse.",
  let: "`let nombre = valor;` — variable: puede reasignarse con `nombre = otro;`.",
  funcion: "`funcion nombre(a, b) { ... }` — define una función reutilizable. Se declara en el nivel superior.",
  para: "`para (let i = 0; i < n; i = i + 1) { ... }` — repite el bloque. Máximo 10 000 iteraciones.",
  si: "`si (condicion) { ... } sino { ... }` — ejecuta según la condición (≠ 0 es verdadera).",
  sino: "Rama alternativa de `si`.",
  retornar: "`retornar valor;` — devuelve un valor desde una función.",
  diagrama:
    "`diagrama <tipo> { nodo(...); conectar(a, b); }` — dibuja nodos y conexiones con layout automático. Tipos: flujo, arquitectura, organigrama, proceso, red. Opciones: `direccion` (vertical/horizontal), `espaciado`, `x`, `y`.",
  grupo: "`grupo(x, y, escala, rotacion, opacidad) { ... }` — aplica una transformación a las figuras del bloque. Los ángulos van en grados.",
};

/** Markdown for the hover on `word`, or null when there is nothing to say about it. */
export function hoverDocFor(word: string, fullText: string): string | null {
  const definition = DEFINITIONS.get(word);
  if (definition) {
    const kind = definition.category === "connection" ? "Conexión" : definition.category === "group" ? "Grupo" : "Figura";
    return `**${kind}** \`${commandSignature(definition)}\``;
  }
  const builtin = BUILTINS.get(word);
  if (builtin) return `**Función matemática** \`${builtin.name}(...)\` — ${builtin.description}. Ángulos en grados.`;
  if (word in KEYWORD_DOCS && Object.hasOwn(KEYWORDS, word)) return KEYWORD_DOCS[word]!;
  const declarations = declarationsIn(fullText);
  const userFunction = declarations.functions.find((fn) => fn.name === word);
  if (userFunction) return `**Función** \`${userFunction.name}(${userFunction.params.join(", ")})\``;
  const variable = declarations.variables.find((candidate) => candidate.name === word);
  if (variable) return `**${variable.constant ? "Constante" : "Variable"}** \`${variable.name}\``;
  if (declarations.shapes.includes(word)) return `**Figura** \`${word}\``;
  // Own properties only: `constructor` or `toString` must not be found through Object.prototype.
  if (Object.hasOwn(NAMED_COLORS, word)) return `**Color** \`${word}\` — ${NAMED_COLORS[word]}`;
  return null;
}

/** Offset where `name` is declared (function, const/let, parameter or shape binding), if anywhere. */
export function findDeclarationOffset(fullText: string, name: string): number | null {
  const declarations = declarationsIn(fullText);
  const fn = declarations.functions.find((candidate) => candidate.name === name);
  if (fn) return fn.offset;
  const variable = declarations.variables.find((candidate) => candidate.name === name);
  if (variable) return variable.offset;
  if (declarations.shapes.includes(name)) {
    const match = new RegExp(`(?:^|[;{}])\\s*(${name})\\s*=\\s*crear_`, "m").exec(maskCommentsAndStrings(fullText));
    if (match) return match.index + match[0].indexOf(name);
  }
  return null;
}
