import { AlertTriangle, CircleAlert, CircleCheck, Lightbulb } from "lucide-react";
import type { Diagnostic } from "@saramariaojeda9559/compiler-core";
import { useEditorStore } from "../state/useEditorStore.js";
import { revealPosition } from "../editor/editorBridge.js";

/** How many characters of context to keep before the caret on long lines. */
const SNIPPET_CONTEXT = 24;

/**
 * The offending line with a caret under the reported column. Long lines
 * are cut to a window around the column ("…" marks the cut), so the caret
 * is always visible without scrolling.
 */
function Snippet({ diagnostic }: { readonly diagnostic: Diagnostic }): JSX.Element | null {
  if (diagnostic.snippet === undefined) return null;
  const column = Math.max(0, diagnostic.position.column - 1);
  const start = column > SNIPPET_CONTEXT ? column - SNIPPET_CONTEXT : 0;
  const prefix = start > 0 ? "…" : "";
  const line = `${prefix}${diagnostic.snippet.slice(start)}`;
  const caret = `${" ".repeat(prefix.length + column - start)}^`;
  return (
    <pre className="diagnostics__snippet" aria-hidden="true">
      {line}
      {"\n"}
      {caret}
    </pre>
  );
}

export function DiagnosticsList(): JSX.Element {
  const result = useEditorStore((s) => s.result);
  const diagnostics = result?.diagnostics ?? [];

  if (diagnostics.length === 0) {
    return (
      <div className="diagnostics diagnostics--empty">
        <CircleCheck size={16} aria-hidden />
        <span>{result ? "Sin errores." : "Compilando…"}</span>
      </div>
    );
  }

  return (
    <ul className="diagnostics" aria-label={`${diagnostics.length} diagnóstico(s)`}>
      {diagnostics.map((diagnostic, index) => (
        <li key={index} className={`diagnostics__item diagnostics__item--${diagnostic.severity}`}>
          {diagnostic.severity === "error" ? (
            <CircleAlert size={16} aria-hidden />
          ) : (
            <AlertTriangle size={16} aria-hidden />
          )}
          <div className="diagnostics__body">
            <button
              type="button"
              className="diagnostics__jump"
              onClick={() => revealPosition(diagnostic.position)}
              title="Ir a esta línea en el editor"
            >
              {diagnostic.code && <span className="diagnostics__code">{diagnostic.code}</span>}
              <span>
                {diagnostic.position.line}:{diagnostic.position.column} — {diagnostic.message}
              </span>
            </button>
            <Snippet diagnostic={diagnostic} />
            {diagnostic.suggestion && (
              <p className="diagnostics__suggestion">
                <Lightbulb size={14} aria-hidden />
                <span>{diagnostic.suggestion}</span>
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
