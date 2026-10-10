import { AppLayout } from "./components/AppLayout.js";
import { CodeEditor } from "./components/CodeEditor.js";
import { PreviewPanel } from "./components/PreviewPanel.js";
import { DiagnosticsList } from "./components/DiagnosticsList.js";
import { Toolbar } from "./components/Toolbar.js";
import { AiGenerateBar } from "./components/AiGenerateBar.js";
import { useCompilerSync } from "./compiler/useCompilerSync.js";

export function App(): JSX.Element {
  useCompilerSync();

  return (
    <AppLayout
      toolbar={<Toolbar />}
      aiBar={<AiGenerateBar />}
      editor={<CodeEditor />}
      preview={<PreviewPanel />}
      diagnostics={<DiagnosticsList />}
    />
  );
}
