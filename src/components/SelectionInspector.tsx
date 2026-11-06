import { useEffect, useState } from "react";
import {
  GROUP_DEFINITION,
  NAMED_COLORS,
  SHAPE_DEFINITIONS,
  type ParamDefinition,
  type ParamValue,
} from "@saramariaojeda9559/compiler-core";
import { applyVisualEdit } from "../editing/applyVisualEdit.js";
import { findTarget } from "../editing/visualEdit.js";
import { selectSpan } from "../editor/editorBridge.js";
import { useEditorStore } from "../state/useEditorStore.js";

const DEFINITIONS = new Map([...SHAPE_DEFINITIONS, GROUP_DEFINITION].map((definition) => [definition.name, definition]));
const COLOR_DEBOUNCE_MS = 450;

/**
 * Properties of the selected shape/group. Every field writes through the same
 * minimal-edit path as the canvas: a value computed by an expression is shown
 * read-only (with where it comes from), and a shape produced by a loop or
 * function is locked until the user says "change all instances".
 */
export function SelectionInspector(): JSX.Element | null {
  const selectedId = useEditorStore((s) => s.selectedId);
  const scene = useEditorStore((s) => s.inspection?.scene ?? null);
  const [allowShared, setAllowShared] = useState(false);

  useEffect(() => setAllowShared(false), [selectedId]);

  const target = scene ? findTarget(scene, selectedId) : null;
  if (!target || !scene) {
    // Always occupies its space: the canvas above must not resize (and shift under the pointer) when a selection appears.
    return (
      <section className="selection selection--empty" aria-label="Propiedades de la selección">
        <p>Selecciona una figura en el lienzo o coloca el cursor sobre su línea de código para editar sus propiedades.</p>
      </section>
    );
  }

  const id = target.kind === "shape" ? target.shape.id : target.group.id;
  const kind = target.kind === "shape" ? target.shape.kind : "grupo";
  const values: Readonly<Record<string, ParamValue>> = target.kind === "shape" ? target.shape.params : target.group.params;
  const definition = DEFINITIONS.get(kind);
  const origin = target.origin;
  const locked = Boolean(origin?.dynamic) && !allowShared;
  const fields = (definition?.params ?? []).filter((param) => param.type !== "shapeRef");

  const write = (name: string, value: ParamValue): void => {
    applyVisualEdit({ kind: "setParams", targetId: id, params: { [name]: value }, allowShared });
  };

  return (
    <section className="selection" aria-label="Propiedades de la selección">
      <header className="selection__head">
        <strong>{kind}</strong>
        <code className="selection__id">{id}</code>
        <button
          type="button"
          className="selection__danger"
          onClick={() => applyVisualEdit({ kind: "delete", targetId: id, allowShared })}
          disabled={locked}
          title={locked ? "Generada por un bucle o función: confirma «cambiar todas» para eliminarla" : "Eliminar (Supr)"}
        >
          Eliminar
        </button>
      </header>

      {origin?.dynamic && (
        <p className="selection__shared" role="note">
          Se genera {origin.instances} {origin.instances === 1 ? "vez" : "veces"} desde un bucle o función.
          <label>
            <input type="checkbox" checked={allowShared} onChange={(event) => setAllowShared(event.target.checked)} /> Cambiar
            todas
          </label>
          <button type="button" onClick={() => selectSpan(origin.statementSpan, true)}>
            Ir al código
          </button>
        </p>
      )}

      <div className="selection__fields">
        {fields.map((param) => {
          const paramOrigin = origin?.params[param.name];
          const computed = paramOrigin?.editability === "expression";
          return (
            <Field
              key={`${id}:${param.name}`}
              param={param}
              value={values[param.name]}
              disabled={locked || computed}
              note={
                computed
                  ? `Se calcula con una expresión${paramOrigin?.dependsOn?.length ? ` (usa ${paramOrigin.dependsOn.join(", ")})` : ""}`
                  : undefined
              }
              onGoToCode={computed && paramOrigin?.span ? () => selectSpan(paramOrigin.span!, true) : undefined}
              onCommit={(value) => write(param.name, value)}
            />
          );
        })}
      </div>
    </section>
  );
}

interface FieldProps {
  readonly param: ParamDefinition;
  readonly value: ParamValue | undefined;
  readonly disabled: boolean;
  readonly note: string | undefined;
  readonly onGoToCode: (() => void) | undefined;
  readonly onCommit: (value: ParamValue) => void;
}

function Field({ param, value, disabled, note, onGoToCode, onCommit }: FieldProps): JSX.Element {
  const shown = value === undefined ? "" : String(value);
  const [draft, setDraft] = useState(shown);
  useEffect(() => setDraft(shown), [shown]);

  const commit = (next: string): void => {
    if (next === shown || next.trim() === "") return setDraft(shown);
    if (param.type === "number") {
      const parsed = Number(next);
      if (!Number.isFinite(parsed)) return setDraft(shown);
      onCommit(parsed);
    } else {
      onCommit(next);
    }
  };

  const id = `field-${param.name}`;
  return (
    <div className={`selection__field${disabled ? " selection__field--disabled" : ""}`}>
      <label htmlFor={id}>{param.name}</label>
      {param.type === "color" ? (
        <ColorField id={id} value={shown} disabled={disabled} onCommit={onCommit} />
      ) : (
        <input
          id={id}
          type={param.type === "number" ? "number" : "text"}
          step={param.name === "opacidad" ? 0.05 : 1}
          value={draft}
          disabled={disabled}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit((event.target as HTMLInputElement).value);
            if (event.key === "Escape") setDraft(shown);
          }}
        />
      )}
      {note && (
        <span className="selection__note" title={note}>
          ƒ {onGoToCode && <button type="button" onClick={onGoToCode}>ver código</button>}
        </span>
      )}
    </div>
  );
}

function ColorField({
  id,
  value,
  disabled,
  onCommit,
}: {
  readonly id: string;
  readonly value: string;
  readonly disabled: boolean;
  readonly onCommit: (value: ParamValue) => void;
}): JSX.Element {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  // The picker fires continuously while dragging: only the settled value becomes an edit (one undo step).
  useEffect(() => {
    if (draft === value) return undefined;
    const timer = window.setTimeout(() => onCommit(draft), COLOR_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [draft, value, onCommit]);

  const named = Object.entries(NAMED_COLORS).find(([, hex]) => hex.toLowerCase() === draft.toLowerCase())?.[0] ?? "";
  return (
    <span className="selection__color">
      <input id={id} type="color" value={/^#[0-9a-f]{6}$/i.test(draft) ? draft : "#000000"} disabled={disabled} onChange={(event) => setDraft(event.target.value)} />
      <select
        aria-label="Color con nombre"
        value={named}
        disabled={disabled}
        onChange={(event) => {
          if (event.target.value) onCommit(event.target.value);
        }}
      >
        <option value="">{named ? "" : draft}</option>
        {Object.keys(NAMED_COLORS).map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </span>
  );
}
