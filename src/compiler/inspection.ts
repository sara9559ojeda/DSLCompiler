import type { PassReport, Scene, StageTiming } from "@saramariaojeda9559/compiler-core";

export interface InspectedToken {
  readonly type: string;
  readonly lexeme: string;
  readonly position: { readonly line: number; readonly column: number };
}

/**
 * Everything the Inspector tab shows for one compile — produced in the
 * worker alongside the CompileResult. Plain data only (it crosses the
 * worker boundary via structured clone).
 */
export interface Inspection {
  readonly tokens: readonly InspectedToken[];
  /** The AST as plain data; every node has a `kind`. */
  readonly ast: unknown;
  readonly scene: Scene;
  /** Absent when the program has errors (the optimizer only runs on valid input). */
  readonly optimizedScene?: Scene;
  readonly optimization: readonly PassReport[];
  readonly timings: readonly StageTiming[];
}
