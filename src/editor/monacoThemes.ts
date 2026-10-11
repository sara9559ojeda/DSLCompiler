import type * as Monaco from "monaco-editor";

export const MONACO_LIGHT_THEME = "compiler-img-light";
export const MONACO_DARK_THEME = "compiler-img-dark";

/**
 * Monaco renders through its own engine, outside the DOM's CSS cascade, so
 * its theme API only accepts literal colors — CSS custom properties can't
 * reach it. These hex values are kept in sync with src/index.css by hand,
 * centralized in this one file instead of scattered across components.
 */
export function defineMonacoThemes(monaco: typeof Monaco): void {
  monaco.editor.defineTheme(MONACO_LIGHT_THEME, {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#f8f7f2",
      "editor.foreground": "#06232d",
    },
  });

  monaco.editor.defineTheme(MONACO_DARK_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0a2e3b",
      "editor.foreground": "#f8f7f2",
    },
  });
}
