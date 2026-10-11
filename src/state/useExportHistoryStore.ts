import { create } from "zustand";
import { EXPORT_HISTORY_STORAGE_KEY, EXPORT_HISTORY_MAX_ENTRIES } from "../config/app.config.js";

export interface ExportHistoryEntry {
  readonly id: string;
  readonly format: "svg" | "png";
  readonly filename: string;
  readonly createdAt: number;
  /** Always a `data:` URL so a later re-download needs nothing but this string — no Blob/object URL kept alive. */
  readonly dataUrl: string;
}

interface ExportHistoryState {
  readonly entries: readonly ExportHistoryEntry[];
  readonly addEntry: (entry: Omit<ExportHistoryEntry, "id" | "createdAt">) => void;
}

/** localStorage can be unavailable (private browsing, test environments) — never let that crash the app. */
function loadPersisted(): readonly ExportHistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(EXPORT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ExportHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function persist(entries: readonly ExportHistoryEntry[]): void {
  try {
    window.localStorage.setItem(EXPORT_HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // best-effort persistence only — e.g. quota exceeded from a large PNG data URL
  }
}

/** Records every real SVG/PNG export the user actually triggered — never seeded with placeholder data. */
export const useExportHistoryStore = create<ExportHistoryState>((set, get) => ({
  entries: loadPersisted(),
  addEntry: (entry) => {
    const next = [
      { ...entry, id: crypto.randomUUID(), createdAt: Date.now() },
      ...get().entries,
    ].slice(0, EXPORT_HISTORY_MAX_ENTRIES);
    persist(next);
    set({ entries: next });
  },
}));
