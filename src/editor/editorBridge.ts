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
