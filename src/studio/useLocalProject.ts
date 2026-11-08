import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "../state/useEditorStore.js";

const STORAGE_KEY = "dsl-studio:project";
const AUTOSAVE_DELAY_MS = 700;

interface StoredProject {
  readonly name: string;
  readonly source: string;
  readonly savedAt: number;
}

function read(): StoredProject | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<StoredProject>;
    return typeof value.source === "string" && typeof value.name === "string"
      ? { name: value.name, source: value.source, savedAt: Number(value.savedAt) || Date.now() }
      : null;
  } catch {
    return null;
  }
}

function write(project: StoredProject): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    return true;
  } catch {
    return false; // private mode / quota: the studio keeps working, the header says it isn't saved
  }
}

/** Restores the last project into the shared store. Called once at boot, before the first view renders. */
export function restoreLocalProject(): void {
  const stored = read();
  if (!stored) return;
  const state = useEditorStore.getState();
  state.setSource(stored.source);
  state.setProjectName(stored.name);
}

export type SaveState = "saved" | "dirty" | "unavailable";

export interface LocalProject {
  readonly saveState: SaveState;
  readonly savedAt: number | null;
  readonly saveNow: () => void;
}

/**
 * Autosave to this browser's localStorage (the backend's project service needs
 * accounts, which the studio doesn't have yet — so "saved" always means
 * "saved in this browser", and the header says so).
 */
export function useLocalProject(): LocalProject {
  const source = useEditorStore((s) => s.source);
  const name = useEditorStore((s) => s.projectName);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<number | null>(() => read()?.savedAt ?? null);
  const first = useRef(true);

  const saveNow = useCallback(() => {
    const { source: currentSource, projectName } = useEditorStore.getState();
    const now = Date.now();
    const ok = write({ name: projectName, source: currentSource, savedAt: now });
    setSaveState(ok ? "saved" : "unavailable");
    if (ok) setSavedAt(now);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaveState("dirty");
    const timer = window.setTimeout(saveNow, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [source, name, saveNow]);

  return { saveState, savedAt, saveNow };
}
