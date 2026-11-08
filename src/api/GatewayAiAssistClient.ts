import { GATEWAY_URL } from "../config/app.config.js";
import {
  AssistError,
  MAX_ASSIST_PROMPT_LENGTH,
  MAX_ASSIST_SOURCE_LENGTH,
  type AssistRequest,
  type AssistResponse,
  type IAiAssistClient,
} from "./IAiAssistClient.js";

interface GatewayErrorBody {
  readonly error?: { readonly message?: string };
}

/**
 * Talks to ai-assist through the gateway (`/api/ai/assist`). The API key never
 * exists in the browser: the gateway forwards to a service that holds it.
 */
export class GatewayAiAssistClient implements IAiAssistClient {
  async assist(request: AssistRequest, signal?: AbortSignal): Promise<AssistResponse> {
    if (request.prompt.length > MAX_ASSIST_PROMPT_LENGTH) {
      throw new AssistError(`La instrucción es demasiado larga (máximo ${MAX_ASSIST_PROMPT_LENGTH} caracteres).`, "invalid");
    }
    if ((request.source?.length ?? 0) > MAX_ASSIST_SOURCE_LENGTH) {
      throw new AssistError(`El código es demasiado largo para el asistente (máximo ${MAX_ASSIST_SOURCE_LENGTH} caracteres).`, "invalid");
    }

    let response: Response;
    try {
      response = await fetch(`${GATEWAY_URL}/api/ai/assist`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
        ...(signal ? { signal } : {}),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw new AssistError("Solicitud cancelada.", "cancelled");
      throw new AssistError("No se pudo conectar con el asistente. Revisa tu conexión.", "network");
    }

    if (!response.ok) throw await this.toError(response);
    return (await response.json()) as AssistResponse;
  }

  private async toError(response: Response): Promise<AssistError> {
    if (response.status === 429) {
      return new AssistError("Has usado el asistente demasiadas veces seguidas. Espera un minuto e inténtalo de nuevo.", "rate-limit");
    }
    let message: string | undefined;
    try {
      message = ((await response.json()) as GatewayErrorBody).error?.message;
    } catch {
      message = undefined;
    }
    if (response.status === 400) return new AssistError(message ?? "La solicitud no es válida.", "invalid");
    return new AssistError("El asistente no está disponible en este momento. Inténtalo más tarde.", "unavailable");
  }
}
