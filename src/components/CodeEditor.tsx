import { lazy, Suspense, useEffect, useState } from "react";
import { useEditorStore } from "../state/useEditorStore.js";
import { useTheme } from "../theme/ThemeProvider.js";
import { DSL_LANGUAGE_ID } from "../editor/dslLanguage.js";
import { MONACO_DARK_THEME, MONACO_LIGHT_THEME } from "../editor/monacoThemes.js";
import { registerEditor, setDiagnosticMarkers } from "../editor/editorBridge.js";

// Monaco is ~3.5MB — code-split into its own chunk instead of the initial
// bundle. Both imports below must stay dynamic: `monaco-editor` itself is
// what's heavy, and monacoSetup.ts imports it at the top level, so even a
// static `import { configureMonaco }` here would pull the whole package
// back into the main chunk regardless of `MonacoEditor` being lazy.
//
// configureMonaco() must run *before* the editor component exists: it
// points @monaco-editor/react's loader at the bundled monaco. If the editor
// mounts first, the loader fetches its own copy from a CDN, and the DSL
// language (highlighting, autocomplete) ends up registered on a different
// monaco instance than the one the editor uses.
const MonacoEditor = lazy(async () => {
  const [setup, react] = await Promise.all([import("../editor/monacoSetup.js"), import("@monaco-editor/react")]);
  setup.configureMonaco();
  return { default: react.Editor };
});

export function CodeEditor(): JSX.Element {
  const source = useEditorStore((s) => s.source);
  const setSource = useEditorStore((s) => s.setSource);
  const diagnostics = useEditorStore((s) => s.result?.diagnostics);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mounted) setDiagnosticMarkers(diagnostics ?? []);
  }, [mounted, diagnostics]);

  return (
    <Suspense fallback={<div className="editor-loading">Cargando editor…</div>}>
      <MonacoEditor
        language={DSL_LANGUAGE_ID}
        theme={theme === "dark" ? MONACO_DARK_THEME : MONACO_LIGHT_THEME}
        value={source}
        onChange={(value) => setSource(value ?? "")}
        onMount={(editor, monaco) => {
          registerEditor(editor, monaco);
          setMounted(true);
        }}
        options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true, padding: { top: 12 } }}
      />
    </Suspense>
  );
}
