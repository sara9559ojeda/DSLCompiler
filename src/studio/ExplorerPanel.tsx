import { FilePlus2, Redo2, Undo2 } from "lucide-react";
import { AiGenerateBar } from "../components/AiGenerateBar.js";
import { PresetGallery, isUserWritten } from "../components/PresetGallery.js";
import { redoEdit, undoEdit } from "../editor/editorBridge.js";
import { useEditorStore } from "../state/useEditorStore.js";
import type { DslPreset } from "../config/presets.config.js";

const isDiagram = (preset: DslPreset): boolean => preset.id.startsWith("diagrama");
const isFigure = (preset: DslPreset): boolean => !isDiagram(preset);

const NEW_PROJECT_SOURCE = "// Proyecto nuevo\n// Prueba: crear_circulo(radio=60, x=200, y=150, color=naranja);\n";

/** Left rail: project tools, examples and quick access to the smart diagrams. */
export function ExplorerPanel(): JSX.Element {
  const source = useEditorStore((s) => s.source);
  const setSource = useEditorStore((s) => s.setSource);
  const setProjectName = useEditorStore((s) => s.setProjectName);

  const newProject = (): void => {
    if (isUserWritten(source) && !window.confirm("Esto reemplaza el código que escribiste. ¿Continuar?")) return;
    setSource(NEW_PROJECT_SOURCE);
    setProjectName("Sin título");
  };

  return (
    <div className="explorer">
      <section className="explorer__section" aria-labelledby="ex-tools">
        <h2 className="explorer__title" id="ex-tools">
          Herramientas
        </h2>
        <div className="explorer__tools">
          <button type="button" className="tool" onClick={newProject}>
            <FilePlus2 size={16} aria-hidden="true" /> Nuevo
          </button>
          <button type="button" className="tool" onClick={undoEdit} title="Deshacer (Ctrl+Z)">
            <Undo2 size={16} aria-hidden="true" /> Deshacer
          </button>
          <button type="button" className="tool" onClick={redoEdit} title="Rehacer (Ctrl+Shift+Z)">
            <Redo2 size={16} aria-hidden="true" /> Rehacer
          </button>
        </div>
      </section>

      <section className="explorer__section" aria-labelledby="ex-ai">
        <h2 className="explorer__title" id="ex-ai">
          Crear con IA
        </h2>
        <AiGenerateBar />
      </section>

      <section className="explorer__section" aria-labelledby="ex-diagrams">
        <h2 className="explorer__title" id="ex-diagrams">
          Diagramas automáticos
        </h2>
        <PresetGallery filter={isDiagram} label="Se ordenan solos" />
      </section>

      <section className="explorer__section" aria-labelledby="ex-examples">
        <h2 className="explorer__title" id="ex-examples">
          Ejemplos
        </h2>
        <PresetGallery filter={isFigure} label="Figuras y patrones" />
      </section>
    </div>
  );
}
