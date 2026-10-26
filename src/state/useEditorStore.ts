import { create } from "zustand";
import type { CompileResult } from "@saramariaojeda9559/compiler-core";
import { DEFAULT_DSL_SOURCE } from "../config/app.config.js";
import type { Inspection } from "../compiler/inspection.js";

interface EditorState {
  readonly source: string;
  readonly result: CompileResult | null;
  /** Intermediate stages of the same compile as `result` (Inspector tab). */
  readonly inspection: Inspection | null;
  readonly isCompiling: boolean;
  readonly setSource: (source: string) => void;
  readonly setResult: (result: CompileResult, inspection?: Inspection | null) => void;
  readonly setIsCompiling: (isCompiling: boolean) => void;
}

/**
 * The one piece of app-wide state (source + last compile result). Kept in
 * Zustand instead of lifted useState so Toolbar/Preview/Diagnostics can each
 * read only the slice they need without prop-drilling through App.
 */
export const useEditorStore = create<EditorState>((set) => ({
  source: DEFAULT_DSL_SOURCE,
  result: null,
  inspection: null,
  isCompiling: false,
  setSource: (source) => set({ source }),
  setResult: (result, inspection = null) => set({ result, inspection }),
  setIsCompiling: (isCompiling) => set({ isCompiling }),
}));
