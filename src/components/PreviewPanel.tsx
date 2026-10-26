import { useState } from "react";
import { useEditorStore } from "../state/useEditorStore.js";
import { InspectorPanel } from "./InspectorPanel.js";

type PreviewTab = "vista" | "inspector";

export function PreviewPanel(): JSX.Element {
  const result = useEditorStore((s) => s.result);
  const svg = result?.success ? result.svg : null;
  const [tab, setTab] = useState<PreviewTab>("vista");

  return (
    <>
      <div className="preview-tabs" role="tablist" aria-label="Previsualización">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "vista"}
          className={`preview-tabs__tab${tab === "vista" ? " preview-tabs__tab--active" : ""}`}
          onClick={() => setTab("vista")}
        >
          Vista
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "inspector"}
          className={`preview-tabs__tab${tab === "inspector" ? " preview-tabs__tab--active" : ""}`}
          onClick={() => setTab("inspector")}
        >
          Inspector
        </button>
      </div>
      {tab === "vista" ? (
        <div className="preview-panel" aria-live="polite" role="tabpanel">
          {svg ? (
            <div className="preview-panel__canvas" dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <p className="preview-panel__empty">
              {result
                ? "Corrige los errores para ver la previsualización."
                : "Escribe un programa para ver la previsualización."}
            </p>
          )}
        </div>
      ) : (
        <div className="preview-panel preview-panel--inspector" role="tabpanel">
          <InspectorPanel />
        </div>
      )}
    </>
  );
}
