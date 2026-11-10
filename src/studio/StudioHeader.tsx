import { AlertTriangle, ArrowLeft, Check, Keyboard, Loader2, Sparkles } from "lucide-react";
import { BrandMark } from "../components/BrandMotif.js";
import { ExportPanel } from "../components/ExportPanel.js";
import { ThemeToggle } from "../components/ThemeToggle.js";
import { navigate } from "../routing/useHashRoute.js";
import { useEditorStore } from "../state/useEditorStore.js";
import { SHORTCUT_HELP } from "./useShortcuts.js";
import type { SaveState } from "./useLocalProject.js";

export interface CompileStatus {
  readonly label: string;
  readonly variant: "idle" | "compiling" | "ok" | "error";
}

type CompileResultLike = {
  readonly success: boolean;
  readonly diagnostics: readonly { readonly severity: string }[];
} | null;

/** The header badge for a compile: pure, so it is tested without rendering the header. */
export function compileStatusOf(isCompiling: boolean, result: CompileResultLike): CompileStatus {
  if (isCompiling) return { label: "Compilando…", variant: "compiling" };
  if (!result) return { label: "Listo", variant: "idle" };
  if (!result.success || result.diagnostics.some((d) => d.severity === "error")) return { label: "Con errores", variant: "error" };
  return { label: "Compilado", variant: "ok" };
}

function useCompileStatus(): CompileStatus {
  const isCompiling = useEditorStore((s) => s.isCompiling);
  const result = useEditorStore((s) => s.result);
  return compileStatusOf(isCompiling, result);
}

const SAVE_LABEL: Record<SaveState, string> = {
  saved: "Guardado en este navegador",
  dirty: "Guardando…",
  unavailable: "No se pudo guardar",
};

interface StudioHeaderProps {
  readonly saveState: SaveState;
  readonly onOpenAssistant: () => void;
}

export function StudioHeader({ saveState, onOpenAssistant }: StudioHeaderProps): JSX.Element {
  const status = useCompileStatus();
  const projectName = useEditorStore((s) => s.projectName);
  const setProjectName = useEditorStore((s) => s.setProjectName);

  return (
    <header className="sh">
      <a
        className="sh__brand"
        href="#"
        onClick={(event) => {
          event.preventDefault();
          navigate("landing");
        }}
        title="Volver a la portada"
      >
        <ArrowLeft className="sh__back" size={16} aria-hidden="true" />
        <BrandMark />
        <span className="sh__wordmark">DSL STUDIO</span>
      </a>

      <div className="sh__project">
        <label className="visually-hidden" htmlFor="project-name">
          Nombre del proyecto
        </label>
        <input
          id="project-name"
          className="sh__name"
          value={projectName}
          maxLength={60}
          spellCheck={false}
          onChange={(event) => setProjectName(event.target.value)}
        />
        <span className={`sh__save sh__save--${saveState}`} role="status">
          {saveState === "saved" ? <Check size={13} aria-hidden="true" /> : null}
          {saveState === "dirty" ? <Loader2 size={13} className="spin" aria-hidden="true" /> : null}
          {saveState === "unavailable" ? <AlertTriangle size={13} aria-hidden="true" /> : null}
          <span className="sh__save-text">{SAVE_LABEL[saveState]}</span>
        </span>
      </div>

      <span className={`sh__status sh__status--${status.variant}`} role="status">
        <span className="sh__dot" aria-hidden="true" />
        {status.label}
      </span>

      <div className="sh__actions">
        <ExportPanel />
        <button type="button" className="sh__btn sh__btn--ai" onClick={onOpenAssistant}>
          <Sparkles size={15} aria-hidden="true" />
          <span>Asistente IA</span>
        </button>
        <details className="sh__help">
          <summary className="sh__icon" aria-label="Atajos de teclado" title="Atajos de teclado">
            <Keyboard size={17} aria-hidden="true" />
          </summary>
          <div className="sh__help-pop" role="dialog" aria-label="Atajos de teclado">
            <h2>Atajos</h2>
            <dl>
              {SHORTCUT_HELP.map((item) => (
                <div key={item.keys}>
                  <dt>{item.keys}</dt>
                  <dd>{item.action}</dd>
                </div>
              ))}
            </dl>
          </div>
        </details>
        <ThemeToggle />
      </div>
    </header>
  );
}
