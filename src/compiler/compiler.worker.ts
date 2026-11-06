import { createDefaultPipeline, DEFAULT_SCENE_PASSES, SceneOptimizer, type StageTiming } from "@saramariaojeda9559/compiler-core";
import type { Inspection } from "./inspection.js";
import { COMPILE_DEADLINE_MS } from "../config/compile.config.js";

interface CompileRequestMessage {
  readonly type: "compile";
  readonly id: number;
  readonly source: string;
}

/**
 * Runs the Lexer→Parser→SemanticAnalyzer→CodeGenerator pipeline off the main
 * thread. The language is executable (loops, functions), so the compile is
 * bounded twice: by the deterministic step budget inside the analyzer and by a
 * wall-clock deadline here. A request that still runs long is cancelled from
 * the outside by CompilerWorkerClient, which terminates this worker.
 *
 * The preview SVG is drawn from the *unoptimized* scene with `data-shape-id`
 * tags: the visual editor needs every shape to exist in the DOM to select it.
 * The optimizer still runs, on the side, for the Inspector's report; it is
 * visually equivalent, so the exports (which do use it) look identical.
 */
self.addEventListener("message", (event: MessageEvent<CompileRequestMessage>) => {
  const { id, source } = event.data;
  const stages = createDefaultPipeline({ embedIds: true }).compileWithStages(source, { deadlineMs: COMPILE_DEADLINE_MS });

  const timings: StageTiming[] = [...stages.timings];
  let optimizedScene = undefined;
  let optimization: ReturnType<SceneOptimizer["optimize"]>["report"] = [];
  if (stages.result.success) {
    const start = performance.now();
    const optimized = new SceneOptimizer(DEFAULT_SCENE_PASSES).optimize(stages.scene);
    timings.splice(3, 0, { stage: "optimizer", durationMs: performance.now() - start });
    optimizedScene = optimized.scene;
    optimization = optimized.report;
  }

  const inspection: Inspection = {
    tokens: stages.tokens.map(({ type, lexeme, position }) => ({ type, lexeme, position })),
    // Round-trip through JSON: AST nodes are class instances with methods,
    // which structured clone can't send — their data (incl. `kind`) is all we need.
    ast: JSON.parse(JSON.stringify(stages.program)) as unknown,
    scene: stages.scene,
    ...(optimizedScene ? { optimizedScene } : {}),
    optimization,
    timings,
  };

  (self as unknown as Worker).postMessage({ id, result: stages.result, inspection });
});
