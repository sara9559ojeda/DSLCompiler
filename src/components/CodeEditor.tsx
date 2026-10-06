import { lazy, Suspense, useEffect } from "react";
import { useEditorStore } from "../state/useEditorStore.js";
import { useTheme } from "../theme/ThemeProvider.js";
import { DSL_LANGUAGE_ID } from "../editor/dslLanguage.js";
import { MONACO_DARK_THEME, MONACO_LIGHT_THEME } from "../editor/monacoThemes.js";

// Monaco is ~3.5MB — code-split into its own chunk instead of the initial
// bundle. Both imports below must stay dynamic: `monaco-editor` itself is
// what's heavy, and monacoSetup.ts imports it at the top level, so even a
// static `import { configureMonaco }` here would pull the whole package
// back into the main chunk regardless of `MonacoEditor` being lazy.
const MonacoEditor = lazy(() => import("@monaco-editor/react").then((mod) => ({ default: mod.Editor })));

export function CodeEditor(): JSX.Element {
  const source = useEditorStore((s) => s.source);
  const setSource = useEditorStore((s) => s.setSource);
  const { theme } = useTheme();

  useEffect(() => {
    void import("../editor/monacoSetup.js").then((mod) => mod.configureMonaco());
  }, []);

  return (
    <Suspense fallback={<div className="editor-loading">Cargando editor…</div>}>
      <MonacoEditor
        language={DSL_LANGUAGE_ID}
        theme={theme === "dark" ? MONACO_DARK_THEME : MONACO_LIGHT_THEME}
        value={source}
        onChange={(value) => setSource(value ?? "")}
        options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true, padding: { top: 12 } }}
      />
    </Suspense>
  );
}
