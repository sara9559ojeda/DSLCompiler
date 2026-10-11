import { Download } from "lucide-react";
import { useExportHistoryStore } from "../state/useExportHistoryStore.js";

function formatTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function ExportHistoryPanel(): JSX.Element {
  const entries = useExportHistoryStore((s) => s.entries);

  if (entries.length === 0) {
    return <p className="export-history__empty">Todavía no exportaste ningún archivo.</p>;
  }

  return (
    <ul className="export-history">
      {entries.map((entry) => (
        <li key={entry.id} className="export-history__item">
          <span className={`export-history__badge export-history__badge--${entry.format}`}>
            {entry.format.toUpperCase()}
          </span>
          <span className="export-history__meta">
            <span className="export-history__filename">{entry.filename}</span>
            <span className="export-history__time">{formatTime(entry.createdAt)}</span>
          </span>
          <a
            className="export-history__download"
            href={entry.dataUrl}
            download={entry.filename}
            aria-label={`Descargar ${entry.filename} de nuevo`}
            title="Descargar de nuevo"
          >
            <Download size={15} />
          </a>
        </li>
      ))}
    </ul>
  );
}
