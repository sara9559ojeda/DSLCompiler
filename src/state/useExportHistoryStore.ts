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

/**
 * localStorage is outside the app's control (older versions, manual edits), so every
 * stored entry is checked before it is rendered. The link only ever points at a
 * `data:` URL, never at another scheme such as `javascript:`.
 */
export function isExportHistoryEntry(value: unknown): value is ExportHistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    (entry.format === "svg" || entry.format === "png") &&
    typeof entry.filename === "string" &&
    typeof entry.createdAt === "number" &&
    Number.isFinite(entry.createdAt) &&
    typeof entry.dataUrl === "string" &&
    entry.dataUrl.startsWith("data:")
  );
}

/** localStorage can be unavailable (private browsing, test environments) — never let that crash the app. */
export function loadPersistedExportHistory(): readonly ExportHistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(EXPORT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isExportHistoryEntry).slice(0, EXPORT_HISTORY_MAX_ENTRIES) : [];
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
  entries: loadPersistedExportHistory(),
  addEntry: (entry) => {
    const next = [
      { ...entry, id: crypto.randomUUID(), createdAt: Date.now() },
      ...get().entries,
    ].slice(0, EXPORT_HISTORY_MAX_ENTRIES);
    persist(next);
    set({ entries: next });
  },
}));
