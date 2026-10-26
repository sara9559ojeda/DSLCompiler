import { AppLayout } from "./components/AppLayout.js";
import { CodeEditor } from "./components/CodeEditor.js";
import { PreviewPanel } from "./components/PreviewPanel.js";
import { DiagnosticsList } from "./components/DiagnosticsList.js";
import { Header } from "./components/Header.js";
import { Hero } from "./components/Hero.js";
import { AiGenerateBar } from "./components/AiGenerateBar.js";
import { ExportPanel } from "./components/ExportPanel.js";
import { ExportHistoryPanel } from "./components/ExportHistoryPanel.js";
import { PresetGallery } from "./components/PresetGallery.js";
import { Footer } from "./components/Footer.js";
import { useCompilerSync } from "./compiler/useCompilerSync.js";

export function App(): JSX.Element {
  useCompilerSync();

  return (
    <AppLayout
      header={<Header />}
      hero={<Hero />}
      aiBar={<AiGenerateBar />}
      presets={<PresetGallery />}
      editor={<CodeEditor />}
      preview={<PreviewPanel />}
      diagnostics={<DiagnosticsList />}
      exportPanel={<ExportPanel />}
      exportHistory={<ExportHistoryPanel />}
      footer={<Footer />}
    />
  );
}
