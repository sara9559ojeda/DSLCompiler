import { GATEWAY_URL } from "../config/app.config.js";
import type { IExportClient } from "./IExportClient.js";

const DEFAULT_ERROR_MESSAGE = "No se pudo exportar el diagrama a PNG.";

interface GatewayErrorBody {
  readonly error?: { readonly message?: string };
  readonly diagnostics?: readonly { readonly message: string }[];
}

/**
 * PNG rasterization needs `sharp` (native, server-only), so this always
 * goes through the gateway/compiler service — unlike SVG export, which the
 * Toolbar does entirely client-side from the last compiled SVG string.
 */
export class GatewayExportClient implements IExportClient {
  async exportPng(source: string): Promise<Blob> {
    const response = await fetch(`${GATEWAY_URL}/api/export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source, format: "png" }),
    });

    if (!response.ok) {
      throw new Error(await this.extractErrorMessage(response));
    }

    return response.blob();
  }

  private async extractErrorMessage(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as GatewayErrorBody;
      return body.error?.message ?? body.diagnostics?.[0]?.message ?? DEFAULT_ERROR_MESSAGE;
    } catch {
      return DEFAULT_ERROR_MESSAGE;
    }
  }
}
