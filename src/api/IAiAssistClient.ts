import type { Diagnostic } from "@saramariaojeda9559/compiler-core";

export type AssistMode = "generate" | "modify" | "explain";

/** Same limits the backend enforces (packages/shared AiAssistContract): checked here too so the user gets an answer without a round trip. */
export const MAX_ASSIST_PROMPT_LENGTH = 1000;
export const MAX_ASSIST_SOURCE_LENGTH = 20_000;

export interface AssistRequest {
  readonly mode: AssistMode;
  readonly prompt: string;
  readonly source?: string;
}

export interface AssistAttempt {
  readonly attempt: number;
  readonly valid: boolean;
  readonly errors: number;
}

export type AssistResponse =
  | {
      readonly mode: "generate" | "modify";
      readonly dslSource: string;
      readonly valid: boolean;
      readonly diagnostics: readonly Diagnostic[];
      readonly svg: string | null;
      readonly attempts: readonly AssistAttempt[];
    }
  | {
      readonly mode: "explain";
      readonly explanation: string;
      readonly diagnostics: readonly Diagnostic[];
      readonly attempts: readonly AssistAttempt[];
    };

export interface IAiAssistClient {
  assist(request: AssistRequest, signal?: AbortSignal): Promise<AssistResponse>;
}

/** A failure with a message that is safe to show as-is. */
export class AssistError extends Error {
  constructor(
    message: string,
    readonly kind: "rate-limit" | "invalid" | "unavailable" | "cancelled" | "network",
  ) {
    super(message);
    this.name = "AssistError";
  }
}
