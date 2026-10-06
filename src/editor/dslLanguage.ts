import type * as Monaco from "monaco-editor";

export const DSL_LANGUAGE_ID = "compiler-img-dsl";

/** Basic Monarch tokenizer for the DSL. Command names aren't a fixed keyword
 * list here on purpose — the grammar itself is generic (see docs/grammar.md)
 * — this only highlights structure: comments, literals and `name(` calls. */
export function registerDslLanguage(monaco: typeof Monaco): void {
  if (monaco.languages.getLanguages().some((lang) => lang.id === DSL_LANGUAGE_ID)) return;

  monaco.languages.register({ id: DSL_LANGUAGE_ID });

  monaco.languages.setMonarchTokensProvider(DSL_LANGUAGE_ID, {
    tokenizer: {
      root: [
        [/\/\/.*$/, "comment"],
        [/"([^"\\]|\\.)*"/, "string"],
        [/#[0-9a-fA-F]{3,6}\b/, "number.hex"],
        [/-?\d+(\.\d+)?/, "number"],
        [/[a-zA-Z_]\w*(?=\s*\()/, "keyword"],
        [/[a-zA-Z_]\w*/, "identifier"],
        [/[=(),;]/, "delimiter"],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration(DSL_LANGUAGE_ID, {
    comments: { lineComment: "//" },
    brackets: [["(", ")"]],
    autoClosingPairs: [
      { open: "(", close: ")" },
      { open: '"', close: '"' },
    ],
  });
}
