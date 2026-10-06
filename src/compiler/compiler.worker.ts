import { createDefaultPipeline } from "@compiler-img/compiler/browser";

interface CompileRequestMessage {
  readonly type: "compile";
  readonly id: number;
  readonly source: string;
}

/**
 * Runs the full Lexer→Parser→SemanticAnalyzer→CodeGenerator pipeline off
 * the main thread. Every message builds a fresh pipeline instance — cheap,
 * and avoids any shared mutable state between overlapping compiles.
 */
self.addEventListener("message", (event: MessageEvent<CompileRequestMessage>) => {
  const { id, source } = event.data;
  const result = createDefaultPipeline().compile(source);
  (self as unknown as Worker).postMessage({ id, result });
});
