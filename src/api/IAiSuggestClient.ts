import type { Diagnostic } from "@saramariaojeda9559/compiler-core";

export interface SuggestResult {
  readonly dslSource: string;
  readonly valid: boolean;
  readonly diagnostics: readonly Diagnostic[];
}

export interface IAiSuggestClient {
  suggest(prompt: string): Promise<SuggestResult>;
}
