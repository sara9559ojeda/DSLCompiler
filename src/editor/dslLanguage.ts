import type * as Monaco from "monaco-editor";
import { completionsAt, type CompletionKind } from "./dslCompletions.js";

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

  const kinds: Readonly<Record<CompletionKind, Monaco.languages.CompletionItemKind>> = {
    command: monaco.languages.CompletionItemKind.Function,
    param: monaco.languages.CompletionItemKind.Property,
    value: monaco.languages.CompletionItemKind.EnumMember,
    shape: monaco.languages.CompletionItemKind.Variable,
  };

  monaco.languages.registerCompletionItemProvider(DSL_LANGUAGE_ID, {
    triggerCharacters: ["(", ",", "=", " "],
    provideCompletionItems(model, position) {
      const textBeforeCursor = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      return {
        suggestions: completionsAt(textBeforeCursor, model.getValue()).map((item, index) => ({
          label: item.label,
          // Keep completionsAt's order (e.g. declared shapes before params) instead of alphabetical.
          sortText: String(index).padStart(4, "0"),
          kind: kinds[item.kind],
          detail: item.detail,
          insertText: item.insertText,
          insertTextRules: item.isSnippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
          range,
        })),
      };
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
