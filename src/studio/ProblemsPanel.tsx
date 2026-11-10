import { ChevronDown, ChevronUp } from "lucide-react";
import { DiagnosticsList } from "../components/DiagnosticsList.js";
import { useEditorStore } from "../state/useEditorStore.js";
import { countLabel } from "../text/pluralize.js";

interface ProblemsPanelProps {
  readonly open: boolean;
  readonly onToggle: () => void;
}

/** Bottom panel: errors, warnings and how long the last compile took. */
export function ProblemsPanel({ open, onToggle }: ProblemsPanelProps): JSX.Element {
  const result = useEditorStore((s) => s.result);
  const inspection = useEditorStore((s) => s.inspection);
  const diagnostics = result?.diagnostics ?? [];
  const errors = diagnostics.filter((d) => d.severity === "error").length;
  const warnings = diagnostics.length - errors;
  const ms = inspection ? inspection.timings.reduce((sum, t) => sum + t.durationMs, 0) : null;

  return (
    <section className="problems" aria-label="Problemas y resultado de compilación">
      <header className="problems__bar">
        <button type="button" className="problems__toggle" onClick={onToggle} aria-expanded={open}>
          {open ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronUp size={15} aria-hidden="true" />}
          Problemas
        </button>
        <span className={`problems__count${errors > 0 ? " problems__count--error" : ""}`}>{countLabel(errors, "error", "errores")}</span>
        <span className={`problems__count${warnings > 0 ? " problems__count--warn" : ""}`}>{countLabel(warnings, "aviso", "avisos")}</span>
        <span className="problems__time">{ms === null ? "—" : `${ms.toFixed(1)} ms`}</span>
      </header>
      {open ? (
        <div className="problems__body">
          <DiagnosticsList />
        </div>
      ) : null}
    </section>
  );
}
