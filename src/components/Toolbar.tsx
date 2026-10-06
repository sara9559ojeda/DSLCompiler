import { useState } from "react";
import { Download, Image as ImageIcon, Loader2 } from "lucide-react";
import { useEditorStore } from "../state/useEditorStore.js";
import { ThemeToggle } from "./ThemeToggle.js";
import { downloadBlob } from "../api/downloadBlob.js";
import { GatewayExportClient } from "../api/GatewayExportClient.js";
import type { IExportClient } from "../api/IExportClient.js";
import { SVG_EXPORT_FILENAME, PNG_EXPORT_FILENAME } from "../config/app.config.js";

const exportClient: IExportClient = new GatewayExportClient();

export function Toolbar(): JSX.Element {
  const result = useEditorStore((s) => s.result);
  const source = useEditorStore((s) => s.source);
  const isCompiling = useEditorStore((s) => s.isCompiling);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const canExport = Boolean(result?.success && result.svg);

  const handleExportSvg = (): void => {
    if (!result?.svg) return;
    // Pure client-side: the last compiled SVG is already in memory, no round trip needed.
    downloadBlob(new Blob([result.svg], { type: "image/svg+xml" }), SVG_EXPORT_FILENAME);
  };

  const handleExportPng = async (): Promise<void> => {
    setExportError(null);
    setIsExportingPng(true); // immediate feedback; the network work below never blocks this click's own paint
    try {
      const blob = await exportClient.exportPng(source);
      downloadBlob(blob, PNG_EXPORT_FILENAME);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "No se pudo exportar a PNG.");
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <header className="toolbar">
      <span className="toolbar__brand">Compilador de Imágenes</span>
      <span className="toolbar__status">{isCompiling ? "Compilando…" : null}</span>
      <div className="toolbar__actions">
        {exportError ? <span className="toolbar__error">{exportError}</span> : null}
        <button type="button" className="button" onClick={handleExportSvg} disabled={!canExport}>
          <Download size={16} /> SVG
        </button>
        <button type="button" className="button" onClick={handleExportPng} disabled={!canExport || isExportingPng}>
          {isExportingPng ? <Loader2 size={16} className="spin" /> : <ImageIcon size={16} />} PNG
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
