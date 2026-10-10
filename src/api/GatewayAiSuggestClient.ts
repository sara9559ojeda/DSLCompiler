import { GATEWAY_URL } from "../config/app.config.js";
import type { IAiSuggestClient, SuggestResult } from "./IAiSuggestClient.js";

const DEFAULT_ERROR_MESSAGE = "No se pudo generar el diagrama con IA en este momento.";

interface GatewayErrorBody {
  readonly error?: { readonly message?: string };
}

/**
 * Calls the ai-assist service (via the gateway) to turn a natural-language
 * description into DSL source. The response is already validated against
 * the real compiler server-side (see SuggestionService.ts) — `valid` tells
 * the caller whether the generated code compiled cleanly or still has
 * diagnostics, so the UI can show it either way.
 */
export class GatewayAiSuggestClient implements IAiSuggestClient {
  async suggest(prompt: string): Promise<SuggestResult> {
    const response = await fetch(`${GATEWAY_URL}/api/ai/suggest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(await this.extractErrorMessage(response));
    }

    return response.json() as Promise<SuggestResult>;
  }

  private async extractErrorMessage(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as GatewayErrorBody;
      return body.error?.message ?? DEFAULT_ERROR_MESSAGE;
    } catch {
      return DEFAULT_ERROR_MESSAGE;
    }
  }
}
