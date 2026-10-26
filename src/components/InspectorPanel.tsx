import { useState } from "react";
import { useEditorStore } from "../state/useEditorStore.js";
import type { Inspection } from "../compiler/inspection.js";

type InspectorSection = "etapas" | "tokens" | "ast" | "ir" | "svg";

const SECTIONS: readonly { id: InspectorSection; label: string }[] = [
  { id: "etapas", label: "Etapas" },
  { id: "tokens", label: "Tokens" },
  { id: "ast", label: "AST" },
  { id: "ir", label: "IR" },
  { id: "svg", label: "SVG" },
];

const STAGE_LABELS: Readonly<Record<string, string>> = {
  lexer: "Léxico",
  parser: "Sintaxis",
  semantic: "Semántica",
  optimizer: "Optimizador",
  codegen: "Generación SVG",
};

const PASS_LABELS: Readonly<Record<string, string>> = {
  "remove-degenerate": "Figuras que no dibujan nada",
  "remove-off-canvas": "Figuras fuera del lienzo",
  "remove-occluded": "Figuras tapadas por un rectángulo",
};

const formatMs = (ms: number): string => (ms < 1 ? `${(ms * 1000).toFixed(0)} µs` : `${ms.toFixed(2)} ms`);

function Stages({ inspection }: { readonly inspection: Inspection }): JSX.Element {
  const total = inspection.timings.reduce((sum, timing) => sum + timing.durationMs, 0);
  const removed = inspection.optimization.reduce((sum, pass) => sum + pass.removedShapes, 0);
  return (
    <div className="inspector__stages">
      <ol className="inspector__timings">
        {inspection.timings.map((timing) => (
          <li key={timing.stage}>
            <span>{STAGE_LABELS[timing.stage] ?? timing.stage}</span>
            <span
              className="inspector__bar"
              style={{ inlineSize: `${total > 0 ? Math.max(2, (timing.durationMs / total) * 100) : 0}%` }}
              aria-hidden="true"
            />
            <span className="inspector__ms">{formatMs(timing.durationMs)}</span>
          </li>
        ))}
      </ol>
      <p className="inspector__note">
        {inspection.optimizedScene
          ? removed > 0
            ? `El optimizador quitó ${removed} figura(s) que no se veían; la imagen es idéntica.`
            : "El optimizador no encontró figuras invisibles."
          : "El optimizador solo corre cuando no hay errores."}
      </p>
      {inspection.optimization.length > 0 && (
        <ul className="inspector__passes">
          {inspection.optimization.map((pass) => (
            <li key={pass.pass}>
              <span>{PASS_LABELS[pass.pass] ?? pass.pass}</span>
              <span className="inspector__ms">{pass.removedShapes > 0 ? `−${pass.removedShapes}` : "0"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tokens({ inspection }: { readonly inspection: Inspection }): JSX.Element {
  return (
    <table className="inspector__table">
      <thead>
        <tr>
          <th scope="col">Pos.</th>
          <th scope="col">Tipo</th>
          <th scope="col">Lexema</th>
        </tr>
      </thead>
      <tbody>
        {inspection.tokens.map((token, index) => (
          <tr key={index}>
            <td>
              {token.position.line}:{token.position.column}
            </td>
            <td>{token.type}</td>
            <td>{token.lexeme}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const Json = ({ value }: { readonly value: unknown }): JSX.Element => (
  <pre className="inspector__code">{JSON.stringify(value, null, 2)}</pre>
);

/**
 * Shows what the compiler did with the current program, stage by stage:
 * timings, the token stream, the AST, the Scene IR (before/after the
 * optimizer) and the generated SVG. Data comes from the same worker compile
 * that drives the preview — nothing is recompiled here.
 */
export function InspectorPanel(): JSX.Element {
  const inspection = useEditorStore((s) => s.inspection);
  const svg = useEditorStore((s) => s.result?.svg ?? null);
  const [section, setSection] = useState<InspectorSection>("etapas");

  if (!inspection) {
    return <p className="preview-panel__empty">Compilando…</p>;
  }

  return (
    <div className="inspector">
      <div className="inspector__sections" role="tablist" aria-label="Secciones del inspector">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={section === id}
            className={`inspector__section${section === id ? " inspector__section--active" : ""}`}
            onClick={() => setSection(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="inspector__content" role="tabpanel">
        {section === "etapas" && <Stages inspection={inspection} />}
        {section === "tokens" && <Tokens inspection={inspection} />}
        {section === "ast" && <Json value={inspection.ast} />}
        {section === "ir" && (
          <>
            <h3 className="inspector__heading">Escena (salida del análisis semántico)</h3>
            <Json value={inspection.scene} />
            {inspection.optimizedScene && (
              <>
                <h3 className="inspector__heading">Escena optimizada</h3>
                <Json value={inspection.optimizedScene} />
              </>
            )}
          </>
        )}
        {section === "svg" &&
          (svg ? <pre className="inspector__code">{svg}</pre> : <p className="inspector__note">Sin SVG: hay errores.</p>)}
      </div>
    </div>
  );
}
