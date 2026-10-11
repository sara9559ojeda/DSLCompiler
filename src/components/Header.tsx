import { useEditorStore } from "../state/useEditorStore.js";
import { ThemeToggle } from "./ThemeToggle.js";
import { BrandMark } from "./BrandMotif.js";
import { BRAND_NAME } from "../config/app.config.js";

function useCompileStatus(): { label: string; variant: "idle" | "compiling" | "ok" | "error" } {
  const isCompiling = useEditorStore((s) => s.isCompiling);
  const result = useEditorStore((s) => s.result);

  if (isCompiling) return { label: "Compilando…", variant: "compiling" };
  if (!result) return { label: "Listo para compilar", variant: "idle" };
  if (!result.success || result.diagnostics.some((d) => d.severity === "error")) {
    return { label: "Con errores", variant: "error" };
  }
  return { label: "Compilado", variant: "ok" };
}

export function Header(): JSX.Element {
  const status = useCompileStatus();

  return (
    <header className="site-header">
      <div className="site-header__brand">
        <BrandMark />
        <span className="site-header__wordmark">{BRAND_NAME}</span>
      </div>
      <nav className="site-header__nav" aria-label="Secciones">
        <a className="site-header__nav-link" href="#proyecto">
          Proyecto
        </a>
        <a className="site-header__nav-link" href="#compilar">
          Compilar
        </a>
        <a className="site-header__nav-link" href="#exportaciones">
          Exportaciones
        </a>
      </nav>
      <div className="site-header__actions">
        <span className={`status-pill status-pill--${status.variant}`}>
          <span className="status-pill__dot" aria-hidden />
          {status.label}
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
