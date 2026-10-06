import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import { registerDslLanguage } from "./dslLanguage.js";
import { defineMonacoThemes } from "./monacoThemes.js";

let configured = false;

/**
 * Points @monaco-editor/react at the locally bundled `monaco-editor` package
 * instead of its default CDN loader, so the app works fully offline and the
 * editor is code-split into its own chunk (see CodeEditor.tsx's dynamic
 * import) rather than inflating the initial bundle.
 */
export function configureMonaco(): typeof monaco {
  if (!configured) {
    self.MonacoEnvironment = {
      getWorker: () => new EditorWorker(),
    };
    registerDslLanguage(monaco);
    defineMonacoThemes(monaco);
    loader.config({ monaco });
    configured = true;
  }
  return monaco;
}
