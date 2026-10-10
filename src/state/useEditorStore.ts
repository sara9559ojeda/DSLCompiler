import { create } from "zustand";
import type { CompileResult } from "@compiler-img/compiler-core";
import { DEFAULT_DSL_SOURCE } from "../config/app.config.js";

interface EditorState {
  readonly source: string;
  readonly result: CompileResult | null;
  readonly isCompiling: boolean;
  readonly setSource: (source: string) => void;
  readonly setResult: (result: CompileResult) => void;
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
  isCompiling: false,
  setSource: (source) => set({ source }),
  setResult: (result) => set({ result }),
  setIsCompiling: (isCompiling) => set({ isCompiling }),
}));
