import { AppLayout } from "./components/AppLayout.js";
import { CodeEditor } from "./components/CodeEditor.js";
import { PreviewPanel } from "./components/PreviewPanel.js";
import { DiagnosticsList } from "./components/DiagnosticsList.js";
import { Toolbar } from "./components/Toolbar.js";
import { useCompilerSync } from "./compiler/useCompilerSync.js";

export function App(): JSX.Element {
  useCompilerSync();

  return (
    <AppLayout
      toolbar={<Toolbar />}
      editor={<CodeEditor />}
      preview={<PreviewPanel />}
      diagnostics={<DiagnosticsList />}
    />
  );
}
