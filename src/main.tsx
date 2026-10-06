import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { onCLS, onINP, onLCP } from "web-vitals";
import { App } from "./App.js";
import { ThemeProvider } from "./theme/ThemeProvider.js";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("No se encontró el elemento #root.");
}

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
