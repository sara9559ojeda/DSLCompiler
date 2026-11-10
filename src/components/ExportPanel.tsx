import { useEffect, useState } from "react";
import { Check, Download, Image as ImageIcon, Loader2 } from "lucide-react";
import { useEditorStore } from "../state/useEditorStore.js";
import { useExportHistoryStore } from "../state/useExportHistoryStore.js";
import { downloadBlob } from "../api/downloadBlob.js";
import { blobToDataUrl } from "../api/blobToDataUrl.js";
import { GatewayExportClient } from "../api/GatewayExportClient.js";
import type { IExportClient } from "../api/IExportClient.js";
import { SVG_EXPORT_FILENAME, PNG_EXPORT_FILENAME } from "../config/app.config.js";

const defaultExportClient: IExportClient = new GatewayExportClient();

/** How long an export button shows its check mark after a download. */
export const EXPORT_CONFIRMATION_MS = 1_800;

interface ExportPanelProps {
  /** Injected in tests; the app uses the gateway client (Dependency Inversion). */
  readonly exportClient?: IExportClient;
}

export function ExportPanel({ exportClient = defaultExportClient }: ExportPanelProps = {}): JSX.Element {
  const result = useEditorStore((s) => s.result);
  const source = useEditorStore((s) => s.source);
  const addHistoryEntry = useExportHistoryStore((s) => s.addEntry);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [done, setDone] = useState<"svg" | "png" | null>(null);

  // Transient confirmation: the button swaps its icon for a check for a moment.
  useEffect(() => {
    if (!done) return;
    const timer = window.setTimeout(() => setDone(null), EXPORT_CONFIRMATION_MS);
    return () => window.clearTimeout(timer);
  }, [done]);

  const canExport = Boolean(result?.success && result.svg);

  const handleExportSvg = async (): Promise<void> => {
    if (!result?.svg) return;
    // Pure client-side: the last compiled SVG is already in memory, no round trip needed.
    const blob = new Blob([result.svg], { type: "image/svg+xml" });
    setExportError(null);
    downloadBlob(blob, SVG_EXPORT_FILENAME);
    setDone("svg");
    try {
      addHistoryEntry({ format: "svg", filename: SVG_EXPORT_FILENAME, dataUrl: await blobToDataUrl(blob) });
    } catch {
      // The file was already downloaded; only the history entry is lost.
    }
  };

  const handleExportPng = async (): Promise<void> => {
    setExportError(null);
    setIsExportingPng(true); // immediate feedback; the network work below never blocks this click's own paint
    try {
      const blob = await exportClient.exportPng(source);
      downloadBlob(blob, PNG_EXPORT_FILENAME);
      setDone("png");
      await blobToDataUrl(blob)
        .then((dataUrl) => addHistoryEntry({ format: "png", filename: PNG_EXPORT_FILENAME, dataUrl }))
        .catch(() => undefined); // downloaded already; only the history entry is lost
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "No se pudo exportar a PNG.");
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div className="export-panel">
      <span className="visually-hidden" role="status">
        {done ? `${done.toUpperCase()} descargado` : ""}
      </span>
      {exportError ? <span className="export-panel__error">{exportError}</span> : null}
      <div className="export-panel__actions">
        <button type="button" className="button" data-export="svg" onClick={() => void handleExportSvg()} disabled={!canExport}>
          {done === "svg" ? <Check size={16} /> : <Download size={16} />} SVG
        </button>
        <button
          type="button"
          className="button button--primary"
          data-export="png"
          onClick={() => void handleExportPng()}
          disabled={!canExport || isExportingPng}
        >
          {isExportingPng ? <Loader2 size={16} className="spin" /> : done === "png" ? <Check size={16} /> : <ImageIcon size={16} />} PNG
        </button>
      </div>
    </div>
  );
}
