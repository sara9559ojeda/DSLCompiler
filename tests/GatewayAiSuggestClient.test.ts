import { afterEach, describe, expect, it, vi } from "vitest";
import { GatewayAiSuggestClient } from "../src/api/GatewayAiSuggestClient.js";

describe("GatewayAiSuggestClient", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("POSTs the prompt and returns the generated DSL with its validity", async () => {
    const payload = {
      dslSource: "c1 = crear_circulo(radio=50, color=negro, x=100, y=100);",
      valid: true,
      diagnostics: [],
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) });
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new GatewayAiSuggestClient();
    const result = await client.suggest("un gato");

    expect(result).toEqual(payload);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/ai/suggest");
    expect(JSON.parse(init.body as string)).toEqual({ prompt: "un gato" });
  });

  it("throws with the server-provided message when the request fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: "No se pudo completar la solicitud de IA." } }),
    }) as unknown as typeof fetch;

    const client = new GatewayAiSuggestClient();
    await expect(client.suggest("algo")).rejects.toThrow("No se pudo completar la solicitud de IA.");
  });

  it("falls back to a generic message when the error body is unreadable", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    }) as unknown as typeof fetch;

    const client = new GatewayAiSuggestClient();
    await expect(client.suggest("algo")).rejects.toThrow(/no se pudo generar/i);
  });
});
