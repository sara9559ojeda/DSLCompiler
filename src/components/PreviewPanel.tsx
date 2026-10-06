import { useEditorStore } from "../state/useEditorStore.js";

export function PreviewPanel(): JSX.Element {
  const result = useEditorStore((s) => s.result);
  const svg = result?.success ? result.svg : null;

  return (
    <div className="preview-panel" aria-live="polite">
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
  );
}
