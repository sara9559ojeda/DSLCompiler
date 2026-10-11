import { useState } from "react";
import { Download, Image as ImageIcon, Loader2 } from "lucide-react";
import { useEditorStore } from "../state/useEditorStore.js";
import { useExportHistoryStore } from "../state/useExportHistoryStore.js";
import { downloadBlob } from "../api/downloadBlob.js";
import { blobToDataUrl } from "../api/blobToDataUrl.js";
import { GatewayExportClient } from "../api/GatewayExportClient.js";
import type { IExportClient } from "../api/IExportClient.js";
import { SVG_EXPORT_FILENAME, PNG_EXPORT_FILENAME } from "../config/app.config.js";

const exportClient: IExportClient = new GatewayExportClient();

export function ExportPanel(): JSX.Element {
  const result = useEditorStore((s) => s.result);
  const source = useEditorStore((s) => s.source);
  const addHistoryEntry = useExportHistoryStore((s) => s.addEntry);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const canExport = Boolean(result?.success && result.svg);

  const handleExportSvg = async (): Promise<void> => {
    if (!result?.svg) return;
    // Pure client-side: the last compiled SVG is already in memory, no round trip needed.
    const blob = new Blob([result.svg], { type: "image/svg+xml" });
    downloadBlob(blob, SVG_EXPORT_FILENAME);
    addHistoryEntry({ format: "svg", filename: SVG_EXPORT_FILENAME, dataUrl: await blobToDataUrl(blob) });
  };

  const handleExportPng = async (): Promise<void> => {
    setExportError(null);
    setIsExportingPng(true); // immediate feedback; the network work below never blocks this click's own paint
    try {
      const blob = await exportClient.exportPng(source);
      downloadBlob(blob, PNG_EXPORT_FILENAME);
      addHistoryEntry({ format: "png", filename: PNG_EXPORT_FILENAME, dataUrl: await blobToDataUrl(blob) });
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "No se pudo exportar a PNG.");
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div className="export-panel">
      {exportError ? <span className="export-panel__error">{exportError}</span> : null}
      <div className="export-panel__actions">
        <button type="button" className="button" onClick={() => void handleExportSvg()} disabled={!canExport}>
          <Download size={16} /> SVG
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={() => void handleExportPng()}
          disabled={!canExport || isExportingPng}
        >
          {isExportingPng ? <Loader2 size={16} className="spin" /> : <ImageIcon size={16} />} PNG
        </button>
      </div>
    </div>
  );
}
