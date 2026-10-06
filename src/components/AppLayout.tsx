import type { ReactNode } from "react";

interface AppLayoutProps {
  readonly toolbar: ReactNode;
  readonly editor: ReactNode;
  readonly preview: ReactNode;
  readonly diagnostics: ReactNode;
}

export function AppLayout({ toolbar, editor, preview, diagnostics }: AppLayoutProps): JSX.Element {
  return (
    <div className="app-layout">
      {toolbar}
      <main className="app-layout__main">
        <section className="app-layout__editor">{editor}</section>
        <section className="app-layout__preview">
          {preview}
          {diagnostics}
        </section>
      </main>
    </div>
  );
}
