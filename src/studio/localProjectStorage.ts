import { LOCAL_PROJECT_STORAGE_KEY } from "../config/app.config.js";

export interface StoredProject {
  readonly name: string;
  readonly source: string;
  readonly savedAt: number;
}

/**
 * The project saved in this browser, or null when there is none, it is
 * corrupted, or storage is unavailable. A missing or invalid date falls back
 * to now, so an older save still restores.
 */
export function readLocalProject(now: () => number = Date.now): StoredProject | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_PROJECT_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<StoredProject> | null;
    if (typeof value?.source !== "string" || typeof value.name !== "string") return null;
    return { name: value.name, source: value.source, savedAt: Number(value.savedAt) || now() };
  } catch {
    return null;
  }
}

/** Saves the project; false when storage is unavailable (private mode, full quota) so the UI can say so. */
export function writeLocalProject(project: StoredProject): boolean {
  try {
    window.localStorage.setItem(LOCAL_PROJECT_STORAGE_KEY, JSON.stringify(project));
    return true;
  } catch {
    return false;
  }
}
