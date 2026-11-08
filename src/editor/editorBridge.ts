import type * as Monaco from "monaco-editor";
import type { Diagnostic } from "@saramariaojeda9559/compiler-core";

/**
 * The one live Monaco editor instance, registered by CodeEditor on mount.
 * Lets components outside the editor (the diagnostics list) move the cursor
 * without prop-drilling an editor ref through the layout. Type-only
 * imports, so nothing here pulls monaco into the main bundle.
 */
let instance: { editor: Monaco.editor.IStandaloneCodeEditor; monaco: typeof Monaco } | null = null;

const MARKER_OWNER = "compiler-img";

export function registerEditor(editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco): () => void {
  instance = { editor, monaco };
  return () => {
    if (instance?.editor === editor) instance = null;
  };
}

/** Moves the cursor to a diagnostic's position, scrolls it into view and focuses the editor. */
export function revealPosition(position: Diagnostic["position"]): void {
  if (!instance) return;
  const target = { lineNumber: position.line, column: position.column };
  instance.editor.setPosition(target);
  instance.editor.revealPositionInCenterIfOutsideViewport(target);
  instance.editor.focus();
}

/** Squiggles under every diagnostic, with its code and suggestion in the hover. */
export function setDiagnosticMarkers(diagnostics: readonly Diagnostic[]): void {
  if (!instance) return;
  const { editor, monaco } = instance;
  const model = editor.getModel();
  if (!model) return;

  const markers = diagnostics.map((diagnostic): Monaco.editor.IMarkerData => {
    const lineNumber = Math.min(Math.max(1, diagnostic.position.line), model.getLineCount());
    const column = Math.max(1, diagnostic.position.column);
    // Underline the whole word at the position (e.g. a misspelled command), or a single character.
    const word = model.getWordAtPosition({ lineNumber, column });
    return {
      severity: diagnostic.severity === "error" ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
      message: diagnostic.suggestion ? `${diagnostic.message}\nSugerencia: ${diagnostic.suggestion}` : diagnostic.message,
      code: diagnostic.code,
      source: "compilador",
      startLineNumber: lineNumber,
      endLineNumber: lineNumber,
      startColumn: word?.startColumn ?? column,
      endColumn: word?.endColumn ?? column + 1,
    };
  });

  monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
}

// ── Visual editing ──────────────────────────────────────────────────────────

const VISUAL_EDIT_SOURCE = "visual-editor";

/** True while the bridge itself moves the selection/cursor, so its own events aren't mistaken for the user's. */
let programmatic = false;

/**
 * Applies the visual editor's minimal text changes (offsets into the model's
 * current text) as ONE undoable edit: Ctrl+Z in Monaco reverts the whole
 * drag. Returns false when there is no editor to apply them to.
 */
export function applyTextChanges(changes: readonly { start: number; end: number; text: string }[]): boolean {
  if (!instance) return false;
  const { editor, monaco } = instance;
  const model = editor.getModel();
  if (!model) return false;
  const edits = changes.map(({ start, end, text }) => {
    const from = model.getPositionAt(start);
    const to = model.getPositionAt(end);
    return {
      range: new monaco.Range(from.lineNumber, from.column, to.lineNumber, to.column),
      text,
      forceMoveMarkers: true,
    };
  });
  programmatic = true;
  try {
    editor.pushUndoStop();
    editor.executeEdits(VISUAL_EDIT_SOURCE, edits);
    editor.pushUndoStop();
  } finally {
    programmatic = false;
  }
  return true;
}

/** Highlights `[start, end)` in the editor and scrolls to it, without stealing focus from the canvas. */
export function selectSpan(span: { start: number; end: number }, focus = false): void {
  if (!instance) return;
  const { editor, monaco } = instance;
  const model = editor.getModel();
  if (!model) return;
  const from = model.getPositionAt(span.start);
  const to = model.getPositionAt(span.end);
  programmatic = true;
  try {
    const range = new monaco.Range(from.lineNumber, from.column, to.lineNumber, to.column);
    editor.setSelection(range);
    editor.revealRangeInCenterIfOutsideViewport(range);
  } finally {
    programmatic = false;
  }
  if (focus) editor.focus();
}

/** Calls `listener` with the cursor's offset whenever the USER moves it (not when the bridge does). */
export function onUserCursor(listener: (offset: number) => void): () => void {
  if (!instance) return () => undefined;
  const { editor } = instance;
  const subscription = editor.onDidChangeCursorPosition((event) => {
    if (programmatic) return;
    const model = editor.getModel();
    if (!model) return;
    if (event.source === VISUAL_EDIT_SOURCE) return;
    listener(model.getOffsetAt(event.position));
  });
  return () => subscription.dispose();
}

/**
 * Replaces the whole program as ONE undoable edit (accepting an AI proposal):
 * Ctrl+Z brings the previous code back. Returns false when there is no editor.
 */
export function replaceAllText(text: string): boolean {
  if (!instance) return false;
  const { editor } = instance;
  const model = editor.getModel();
  if (!model) return false;
  programmatic = true;
  try {
    editor.pushUndoStop();
    editor.executeEdits("assistant", [{ range: model.getFullModelRange(), text, forceMoveMarkers: true }]);
    editor.pushUndoStop();
  } finally {
    programmatic = false;
  }
  return true;
}

export function undoEdit(): void {
  instance?.editor.trigger(VISUAL_EDIT_SOURCE, "undo", null);
}

export function redoEdit(): void {
  instance?.editor.trigger(VISUAL_EDIT_SOURCE, "redo", null);
}
