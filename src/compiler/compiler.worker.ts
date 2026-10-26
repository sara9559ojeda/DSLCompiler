import { createDefaultPipeline } from "@saramariaojeda9559/compiler-core";
import type { Inspection } from "./inspection.js";

interface CompileRequestMessage {
  readonly type: "compile";
  readonly id: number;
  readonly source: string;
}

/**
 * Runs the full Lexer→Parser→SemanticAnalyzer→Optimizer→CodeGenerator
 * pipeline off the main thread. Every message builds a fresh pipeline
 * instance — cheap, and avoids any shared mutable state between
 * overlapping compiles. The optimizer is visually equivalent, so the
 * preview looks the same; its report feeds the Inspector tab.
 */
self.addEventListener("message", (event: MessageEvent<CompileRequestMessage>) => {
  const { id, source } = event.data;
  const stages = createDefaultPipeline({ optimize: true }).compileWithStages(source);

  const inspection: Inspection = {
    tokens: stages.tokens.map(({ type, lexeme, position }) => ({ type, lexeme, position })),
    // Round-trip through JSON: AST nodes are class instances with methods,
    // which structured clone can't send — their data (incl. `kind`) is all we need.
    ast: JSON.parse(JSON.stringify(stages.program)) as unknown,
    scene: stages.scene,
    ...(stages.optimizedScene ? { optimizedScene: stages.optimizedScene } : {}),
    optimization: stages.optimization ?? [],
    timings: stages.timings,
  };

  (self as unknown as Worker).postMessage({ id, result: stages.result, inspection });
});
