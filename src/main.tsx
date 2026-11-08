import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { onCLS, onINP, onLCP } from "web-vitals";
import { App } from "./App.js";
import { ThemeProvider } from "./theme/ThemeProvider.js";
import { restoreLocalProject } from "./studio/useLocalProject.js";
import "./index.css";
import "./styles/tokens.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("No se encontró el elemento #root.");
}

restoreLocalProject();

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);

if (import.meta.env.DEV) {
  onINP(console.log);
  onLCP(console.log);
  onCLS(console.log);
}
