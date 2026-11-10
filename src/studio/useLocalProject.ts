import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "../state/useEditorStore.js";
import { LOCAL_PROJECT_AUTOSAVE_DELAY_MS } from "../config/app.config.js";
import { readLocalProject, writeLocalProject } from "./localProjectStorage.js";

/** Restores the last project into the shared store. Called once at boot, before the first view renders. */
export function restoreLocalProject(): void {
  const stored = readLocalProject();
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
  const [savedAt, setSavedAt] = useState<number | null>(() => readLocalProject()?.savedAt ?? null);
  const first = useRef(true);

  const saveNow = useCallback(() => {
    const { source: currentSource, projectName } = useEditorStore.getState();
    const now = Date.now();
    const ok = writeLocalProject({ name: projectName, source: currentSource, savedAt: now });
    setSaveState(ok ? "saved" : "unavailable");
    if (ok) setSavedAt(now);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaveState("dirty");
    const timer = window.setTimeout(saveNow, LOCAL_PROJECT_AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [source, name, saveNow]);

  return { saveState, savedAt, saveNow };
}
