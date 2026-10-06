import { AlertTriangle, CircleAlert, CircleCheck } from "lucide-react";
import { useEditorStore } from "../state/useEditorStore.js";

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
    <ul className="diagnostics">
      {diagnostics.map((diagnostic, index) => (
        <li key={index} className={`diagnostics__item diagnostics__item--${diagnostic.severity}`}>
          {diagnostic.severity === "error" ? (
            <CircleAlert size={16} aria-hidden />
          ) : (
            <AlertTriangle size={16} aria-hidden />
          )}
          <span>
            {diagnostic.position.line}:{diagnostic.position.column} — {diagnostic.message}
          </span>
        </li>
      ))}
    </ul>
  );
}
