import type * as Monaco from "monaco-editor";
import { BUILTIN_FUNCTIONS, KEYWORDS } from "@saramariaojeda9559/compiler-core";
import { completionsAt, findDeclarationOffset, hoverDocFor, type CompletionKind } from "./dslCompletions.js";

export const DSL_LANGUAGE_ID = "compiler-img-dsl";

/**
 * Monarch tokenizer + completion, hover and go-to-definition for the DSL.
 * Reserved words and math functions come from compiler-core (KEYWORDS /
 * BUILTIN_FUNCTIONS), so the editor can't drift from the language. Command
 * names aren't listed on purpose — the grammar is generic (docs/grammar.md):
 * the completions read the registry, and any `name(` is just a call.
 */
export function registerDslLanguage(monaco: typeof Monaco): void {
  if (monaco.languages.getLanguages().some((lang) => lang.id === DSL_LANGUAGE_ID)) return;

  monaco.languages.register({ id: DSL_LANGUAGE_ID });

  monaco.languages.setMonarchTokensProvider(DSL_LANGUAGE_ID, {
    reserved: Object.keys(KEYWORDS),
    builtins: BUILTIN_FUNCTIONS.map((fn) => fn.name),
    tokenizer: {
      root: [
        [/\/\/.*$/, "comment"],
        [/"([^"\\]|\\.)*"/, "string"],
        [/#[0-9a-fA-F]{3,8}\b/, "number.hex"],
        [/\d+(\.\d+)?/, "number"],
        [
          /[a-zA-Z_]\w*/,
          {
            cases: {
              "@reserved": "keyword.control",
              "@builtins": "predefined",
              "@default": "identifier",
            },
          },
        ],
        [/[+\-*/%<>!=&|]+/, "operator"],
        [/[{}()]/, "@brackets"],
        [/[,;]/, "delimiter"],
      ],
    },
  });

  const kinds: Readonly<Record<CompletionKind, Monaco.languages.CompletionItemKind>> = {
    command: monaco.languages.CompletionItemKind.Function,
    param: monaco.languages.CompletionItemKind.Property,
    value: monaco.languages.CompletionItemKind.EnumMember,
    shape: monaco.languages.CompletionItemKind.Variable,
    keyword: monaco.languages.CompletionItemKind.Keyword,
    variable: monaco.languages.CompletionItemKind.Variable,
    function: monaco.languages.CompletionItemKind.Function,
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

  monaco.languages.registerHoverProvider(DSL_LANGUAGE_ID, {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const doc = hoverDocFor(word.word, model.getValue());
      if (!doc) return null;
      return {
        range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
        contents: [{ value: doc }],
      };
    },
  });

  monaco.languages.registerDefinitionProvider(DSL_LANGUAGE_ID, {
    provideDefinition(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const offset = findDeclarationOffset(model.getValue(), word.word);
      if (offset === null) return null;
      const start = model.getPositionAt(offset);
      return {
        uri: model.uri,
        range: new monaco.Range(start.lineNumber, start.column, start.lineNumber, start.column + word.word.length),
      };
    },
  });

  monaco.languages.setLanguageConfiguration(DSL_LANGUAGE_ID, {
    comments: { lineComment: "//" },
    brackets: [
      ["(", ")"],
      ["{", "}"],
    ],
    autoClosingPairs: [
      { open: "(", close: ")" },
      { open: "{", close: "}" },
      { open: '"', close: '"', notIn: ["string", "comment"] },
    ],
    surroundingPairs: [
      { open: "(", close: ")" },
      { open: "{", close: "}" },
      { open: '"', close: '"' },
    ],
    indentationRules: {
      increaseIndentPattern: /\{[^}]*$/,
      decreaseIndentPattern: /^\s*\}/,
    },
  });
}
