import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Code2, Eye, FolderOpen, Sparkles } from "lucide-react";
import { AssistantPanel } from "../components/AssistantPanel.js";
import { CodeEditor } from "../components/CodeEditor.js";
import { ExportHistoryPanel } from "../components/ExportHistoryPanel.js";
import { PreviewPanel } from "../components/PreviewPanel.js";
import { useCompilerSync } from "../compiler/useCompilerSync.js";
import { useEditorStore } from "../state/useEditorStore.js";
import { ExplorerPanel } from "./ExplorerPanel.js";
import { ProblemsPanel } from "./ProblemsPanel.js";
import { Splitter } from "./Splitter.js";
import { StudioHeader } from "./StudioHeader.js";
import { useLocalProject } from "./useLocalProject.js";
import { useMediaQuery } from "./useMediaQuery.js";
import { useShortcuts } from "./useShortcuts.js";
import "../styles/studio.css";

type RightTab = "resultado" | "asistente" | "exportar";
type MobileView = "codigo" | "resultado" | "explorar" | "ia";

const LEFT = { initial: 288, min: 208, max: 440 } as const;
const RIGHT = { initial: 460, min: 320, max: 760 } as const;
const BOTTOM = { initial: 168, min: 96, max: 420 } as const;
const BAR_HEIGHT = 36;
const LAYOUT_KEY = "dsl-studio:layout";

interface Layout {
  readonly left: number;
  readonly right: number;
  readonly bottom: number;
  readonly leftOpen: boolean;
  readonly bottomOpen: boolean;
}

const DEFAULT_LAYOUT: Layout = { left: LEFT.initial, right: RIGHT.initial, bottom: BOTTOM.initial, leftOpen: true, bottomOpen: true };

function readLayout(): Layout {
  try {
    const raw = window.localStorage.getItem(LAYOUT_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const value = JSON.parse(raw) as Partial<Layout>;
    const num = (n: unknown, fallback: number, min: number, max: number): number =>
      typeof n === "number" ? Math.min(max, Math.max(min, n)) : fallback;
    return {
      left: num(value.left, LEFT.initial, LEFT.min, LEFT.max),
      right: num(value.right, RIGHT.initial, RIGHT.min, RIGHT.max),
      bottom: num(value.bottom, BOTTOM.initial, BOTTOM.min, BOTTOM.max),
      leftOpen: value.leftOpen !== false,
      bottomOpen: value.bottomOpen !== false,
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

/**
 * The editing workspace. Layout: header · explorer | editor + problems | result.
 * Panels resize with pointer or keyboard; sizes persist. Under 900px it becomes
 * one pane at a time with a bottom tab bar. The preview/inspector, assistant and
 * export panels are the existing components — this file only arranges them.
 */
export default function StudioWorkspace(): JSX.Element {
  useCompilerSync();
  const project = useLocalProject();
  const narrow = useMediaQuery("(max-width: 900px)");
  const [layout, setLayout] = useState<Layout>(readLayout);
  const [rightTab, setRightTab] = useState<RightTab>("resultado");
  const [mobileView, setMobileView] = useState<MobileView>("codigo");
  const hasAssistantRequest = useEditorStore((s) => s.assistantRequest !== null);

  useEffect(() => {
    try {
      window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
    } catch {
      // layout persistence is best-effort
    }
  }, [layout]);

  useEffect(() => {
    document.body.classList.add("is-studio");
    document.title = "Estudio · DSL Studio";
    return () => {
      document.body.classList.remove("is-studio");
      document.title = "DSL Studio — El código también es arte";
    };
  }, []);

  const patch = useCallback((next: Partial<Layout>) => setLayout((current) => ({ ...current, ...next })), []);

  const openAssistant = useCallback(() => {
    setRightTab("asistente");
    setMobileView("ia");
  }, []);

  // A prompt handed over from the landing or the explorer bar: bring the assistant (which consumes it) into view.
  useEffect(() => {
    if (hasAssistantRequest) openAssistant();
  }, [hasAssistantRequest, openAssistant]);

  const chooseView = (view: MobileView): void => {
    setMobileView(view);
    if (view === "resultado") setRightTab("resultado");
    if (view === "ia") setRightTab("asistente");
  };

  const exportSvg = useCallback(() => {
    document.querySelector<HTMLButtonElement>('[data-export="svg"]')?.click();
  }, []);

  const shortcuts = useMemo(
    () => ({
      "mod+s": project.saveNow,
      "mod+b": () => setLayout((l) => ({ ...l, leftOpen: !l.leftOpen })),
      "mod+j": () => setLayout((l) => ({ ...l, bottomOpen: !l.bottomOpen })),
      "mod+shift+e": exportSvg,
      "mod+shift+a": openAssistant,
      "alt+1": () => setRightTab("resultado"),
      "alt+2": () => setRightTab("asistente"),
      "alt+3": () => setRightTab("exportar"),
    }),
    [project.saveNow, exportSvg, openAssistant],
  );
  useShortcuts(shortcuts);

  const style = {
    "--left-w": `${layout.leftOpen ? layout.left : 0}px`,
    "--right-w": `${layout.right}px`,
    "--bottom-h": `${layout.bottomOpen ? layout.bottom : BAR_HEIGHT}px`,
  } as CSSProperties;

  return (
    <div className={`studio${narrow ? " studio--narrow" : ""}`} data-view={mobileView} style={style}>
      <StudioHeader saveState={project.saveState} onOpenAssistant={openAssistant} />

      <div className="studio__body">
        <aside className="studio__pane studio__pane--left" aria-label="Explorador" hidden={!layout.leftOpen && !narrow}>
          <ExplorerPanel />
        </aside>
        {!narrow && layout.leftOpen ? (
          <Splitter
            orientation="vertical"
            label="Ancho del explorador"
            value={layout.left}
            min={LEFT.min}
            max={LEFT.max}
            sign={1}
            onChange={(left) => patch({ left })}
            onReset={() => patch({ left: LEFT.initial })}
          />
        ) : null}

        <main className="studio__pane studio__pane--center" aria-label="Editor">
          <div className="studio__editor">
            <div className="pane-title">
              <Code2 size={14} aria-hidden="true" />
              <span>Código DSL</span>
              <button
                type="button"
                className="pane-title__toggle"
                onClick={() => patch({ leftOpen: !layout.leftOpen })}
                aria-pressed={layout.leftOpen}
                title="Mostrar u ocultar el explorador (Ctrl+B)"
              >
                <FolderOpen size={14} aria-hidden="true" /> Explorador
              </button>
            </div>
            <div className="studio__monaco">
              <CodeEditor />
            </div>
          </div>
          {!narrow && layout.bottomOpen ? (
            <Splitter
              orientation="horizontal"
              label="Alto del panel de problemas"
              value={layout.bottom}
              min={BOTTOM.min}
              max={BOTTOM.max}
              sign={-1}
              onChange={(bottom) => patch({ bottom })}
              onReset={() => patch({ bottom: BOTTOM.initial })}
            />
          ) : null}
          <ProblemsPanel open={layout.bottomOpen} onToggle={() => patch({ bottomOpen: !layout.bottomOpen })} />
        </main>

        {!narrow ? (
          <Splitter
            orientation="vertical"
            label="Ancho del panel de resultado"
            value={layout.right}
            min={RIGHT.min}
            max={RIGHT.max}
            sign={-1}
            onChange={(right) => patch({ right })}
            onReset={() => patch({ right: RIGHT.initial })}
          />
        ) : null}
        <aside className="studio__pane studio__pane--right" aria-label="Resultado">
          <div className="rtabs" role="tablist" aria-label="Panel de resultado">
            {(
              [
                ["resultado", "Resultado"],
                ["asistente", "Asistente"],
                ["exportar", "Exportar"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`rtab-${id}`}
                aria-selected={rightTab === id}
                aria-controls={`rpane-${id}`}
                className={`rtabs__tab${rightTab === id ? " rtabs__tab--on" : ""}`}
                onClick={() => setRightTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {/* All three stay mounted (the assistant must be alive to receive hand-offs); inactive ones are just hidden. */}
          <div className="rpane" id="rpane-resultado" role="tabpanel" aria-labelledby="rtab-resultado" hidden={rightTab !== "resultado"}>
            <PreviewPanel />
          </div>
          <div className="rpane rpane--scroll" id="rpane-asistente" role="tabpanel" aria-labelledby="rtab-asistente" hidden={rightTab !== "asistente"}>
            <AssistantPanel />
          </div>
          <div className="rpane rpane--scroll" id="rpane-exportar" role="tabpanel" aria-labelledby="rtab-exportar" hidden={rightTab !== "exportar"}>
            <p className="rpane__hint">Usa los botones SVG y PNG de la cabecera. Las descargas recientes quedan aquí.</p>
            <ExportHistoryPanel />
          </div>
        </aside>
      </div>

      {narrow ? (
        <nav className="studio__tabbar" aria-label="Vistas del estudio">
          {(
            [
              ["codigo", "Código", Code2],
              ["resultado", "Resultado", Eye],
              ["explorar", "Explorar", FolderOpen],
              ["ia", "IA", Sparkles],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              className={`studio__tab${mobileView === id ? " studio__tab--on" : ""}`}
              aria-pressed={mobileView === id}
              onClick={() => chooseView(id)}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
