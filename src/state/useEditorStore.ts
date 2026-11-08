import { create } from "zustand";
import type { CompileResult, EditPlan } from "@saramariaojeda9559/compiler-core";
import { DEFAULT_DSL_SOURCE } from "../config/app.config.js";
import type { Inspection } from "../compiler/inspection.js";

interface EditorState {
  readonly source: string;
  /** Name shown in the studio header; saved together with the source in the browser (see studio/useLocalProject.ts). */
  readonly projectName: string;
  readonly result: CompileResult | null;
  /** Intermediate stages of the same compile as `result` (Inspector tab). */
  readonly inspection: Inspection | null;
  /** The exact text `result`/`inspection` were compiled from. Visual edits are only valid while it equals `source`. */
  readonly compiledSource: string | null;
  readonly isCompiling: boolean;
  /** The selected shape or group id (stable across recompiles), shared by canvas, inspector and editor. */
  readonly selectedId: string | null;
  /** Who made the selection: lets the editor and canvas ignore the echo of their own change. */
  readonly selectionOrigin: "canvas" | "editor" | "inspector" | null;
  /** Why the last visual edit was refused (expression, shared…), shown by the inspector. */
  readonly editRefusal: Extract<EditPlan, { ok: false }> | null;
  /** A request another component hands to the AI panel (the quick "Generar" bar); the panel runs it and clears it. */
  readonly assistantRequest: { readonly mode: "generate" | "modify" | "explain"; readonly prompt: string } | null;
  readonly requestAssistant: (request: { mode: "generate" | "modify" | "explain"; prompt: string }) => void;
  readonly consumeAssistantRequest: () => void;
  readonly setSource: (source: string) => void;
  readonly setProjectName: (name: string) => void;
  readonly setResult: (result: CompileResult, inspection?: Inspection | null, compiledSource?: string | null) => void;
  readonly select: (id: string | null, origin?: "canvas" | "editor" | "inspector") => void;
  readonly setEditRefusal: (refusal: Extract<EditPlan, { ok: false }> | null) => void;
  readonly setIsCompiling: (isCompiling: boolean) => void;
}

/**
 * The one piece of app-wide state (source + last compile result). Kept in
 * Zustand instead of lifted useState so Toolbar/Preview/Diagnostics can each
 * read only the slice they need without prop-drilling through App.
 */
export const useEditorStore = create<EditorState>((set) => ({
  source: DEFAULT_DSL_SOURCE,
  projectName: "Sin título",
  result: null,
  inspection: null,
  compiledSource: null,
  isCompiling: false,
  selectedId: null,
  selectionOrigin: null,
  editRefusal: null,
  assistantRequest: null,
  requestAssistant: (assistantRequest) => set({ assistantRequest }),
  consumeAssistantRequest: () => set({ assistantRequest: null }),
  setSource: (source) => set({ source }),
  setProjectName: (projectName) => set({ projectName }),
  setResult: (result, inspection = null, compiledSource = null) => set({ result, inspection, compiledSource }),
  select: (id, origin = "canvas") => set({ selectedId: id, selectionOrigin: id === null ? null : origin, editRefusal: null }),
  setEditRefusal: (editRefusal) => set({ editRefusal }),
  setIsCompiling: (isCompiling) => set({ isCompiling }),
}));
