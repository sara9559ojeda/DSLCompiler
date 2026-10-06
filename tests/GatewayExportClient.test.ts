import { afterEach, describe, expect, it, vi } from "vitest";
import { GatewayExportClient } from "../src/api/GatewayExportClient.js";

describe("GatewayExportClient", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("POSTs the source with format=png and returns the response blob", async () => {
    const blob = new Blob(["fake-png"], { type: "image/png" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) });
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new GatewayExportClient();
    const result = await client.exportPng("c1 = crear_circulo(radio=1, x=0, y=0);");

    expect(result).toBe(blob);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/api/export");
    expect(JSON.parse(init.body as string)).toMatchObject({ format: "png" });
  });

  it("throws with the server-provided message when the request fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ error: { message: "Programa inválido." } }),
    }) as unknown as typeof fetch;

    const client = new GatewayExportClient();
    await expect(client.exportPng("bad")).rejects.toThrow("Programa inválido.");
  });

  it("falls back to a generic message when the error body is unreadable", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    }) as unknown as typeof fetch;

    const client = new GatewayExportClient();
    await expect(client.exportPng("bad")).rejects.toThrow(/no se pudo exportar/i);
  });
});
