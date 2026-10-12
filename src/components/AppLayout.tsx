import type { ReactNode } from "react";
import { PageBackdrop } from "./PageBackdrop.js";

interface AppLayoutProps {
  readonly header: ReactNode;
  readonly hero: ReactNode;
  readonly aiBar: ReactNode;
  readonly editor: ReactNode;
  readonly preview: ReactNode;
  readonly diagnostics: ReactNode;
  readonly exportPanel: ReactNode;
  readonly exportHistory: ReactNode;
}

export function AppLayout({
  header,
  hero,
  aiBar,
  editor,
  preview,
  diagnostics,
  exportPanel,
  exportHistory,
}: AppLayoutProps): JSX.Element {
  return (
    <div className="app-shell">
      <PageBackdrop />
      {header}
      <div className="brand-stripe" aria-hidden="true" />
      <div className="app-shell__scroll">
        {hero}
        <main className="workspace">
          <section className="workspace__main">
            <div className="panel panel--flush" id="proyecto">
              <header className="panel__head">
                <span className="panel__eyebrow">Proyecto</span>
                <h2 className="panel__title">Escribe o genera tu diagrama</h2>
              </header>
              {aiBar}
            </div>
            <div className="workspace__editors" id="compilar">
              <div className="panel panel--flush">
                <header className="panel__head">
                  <span className="panel__eyebrow">Editor</span>
                  <h2 className="panel__title">Código DSL</h2>
                </header>
                <div className="panel__editor">{editor}</div>
              </div>
              <div className="panel panel--flush">
                <header className="panel__head">
                  <span className="panel__eyebrow">Compilar</span>
                  <h2 className="panel__title">Previsualización en vivo</h2>
                </header>
                <div className="panel__preview-wrap">
                  {preview}
                  {diagnostics}
                </div>
              </div>
            </div>
          </section>
          <aside className="workspace__sidebar" id="exportaciones">
            <div className="panel">
              <header className="panel__head">
                <span className="panel__eyebrow">Exportaciones</span>
                <h2 className="panel__title">Descargar resultado</h2>
              </header>
              <div className="panel__body">{exportPanel}</div>
            </div>
            <div className="panel">
              <header className="panel__head">
                <span className="panel__eyebrow">Historial</span>
                <h2 className="panel__title">Exportaciones recientes</h2>
              </header>
              <div className="panel__body">{exportHistory}</div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
