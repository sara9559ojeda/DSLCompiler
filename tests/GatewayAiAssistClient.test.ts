import { afterEach, describe, expect, it, vi } from "vitest";
import { GatewayAiAssistClient } from "../src/api/GatewayAiAssistClient.js";
import { AssistError } from "../src/api/IAiAssistClient.js";

describe("GatewayAiAssistClient", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  const respond = (status: number, body: unknown): void => {
    global.fetch = vi.fn().mockResolvedValue({ ok: status < 400, status, json: () => Promise.resolve(body) }) as unknown as typeof fetch;
  };

  it("posts the request to the gateway and returns the proposal", async () => {
    respond(200, { mode: "generate", dslSource: "x", valid: true, diagnostics: [], svg: null, attempts: [] });
    const result = await new GatewayAiAssistClient().assist({ mode: "generate", prompt: "una casa" });
    expect(result).toMatchObject({ dslSource: "x" });
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(String(url)).toMatch(/\/api\/ai\/assist$/);
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ mode: "generate", prompt: "una casa" });
  });

  it("never sends credentials or keys, only the documented fields", async () => {
    respond(200, { mode: "explain", explanation: "", diagnostics: [], attempts: [] });
    await new GatewayAiAssistClient().assist({ mode: "explain", prompt: "", source: "c" });
    const init = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1] as RequestInit;
    expect(Object.keys(JSON.parse(init.body as string))).toEqual(["mode", "prompt", "source"]);
    expect(init.headers).toEqual({ "content-type": "application/json" });
  });

  it("checks the size limits before calling the network", async () => {
    global.fetch = vi.fn() as unknown as typeof fetch;
    await expect(new GatewayAiAssistClient().assist({ mode: "generate", prompt: "x".repeat(1001) })).rejects.toMatchObject({ kind: "invalid" });
    await expect(new GatewayAiAssistClient().assist({ mode: "modify", prompt: "x", source: "y".repeat(20_001) })).rejects.toMatchObject({ kind: "invalid" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("maps 429 to a rate-limit message, 400 to the server message, 5xx to a generic one", async () => {
    respond(429, {});
    await expect(new GatewayAiAssistClient().assist({ mode: "generate", prompt: "x" })).rejects.toMatchObject({ kind: "rate-limit" });
    respond(400, { error: { message: "Falta el código." } });
    await expect(new GatewayAiAssistClient().assist({ mode: "generate", prompt: "x" })).rejects.toMatchObject({ kind: "invalid", message: "Falta el código." });
    respond(500, { error: { message: "internal stack trace" } });
    const error = await new GatewayAiAssistClient().assist({ mode: "generate", prompt: "x" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AssistError);
    expect((error as AssistError).message).not.toContain("stack trace");
  });

  it("turns an aborted fetch into a cancelled error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new DOMException("aborted", "AbortError")) as unknown as typeof fetch;
    await expect(new GatewayAiAssistClient().assist({ mode: "generate", prompt: "x" })).rejects.toMatchObject({ kind: "cancelled" });
  });
});
