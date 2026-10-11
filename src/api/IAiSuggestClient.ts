import type { Diagnostic } from "@compiler-img/compiler-core";

export interface SuggestResult {
  readonly dslSource: string;
  readonly valid: boolean;
  readonly diagnostics: readonly Diagnostic[];
}

export interface IAiSuggestClient {
  suggest(prompt: string): Promise<SuggestResult>;
}
