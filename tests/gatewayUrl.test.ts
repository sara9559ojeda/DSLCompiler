import { describe, expect, it } from "vitest";
import { DEFAULT_GATEWAY_URL, resolveGatewayUrl } from "../src/config/app.config.js";

const RUNTIME = "https://runtime.example.com";
const BUILD = "https://build.example.com";

describe("resolveGatewayUrl", () => {
  it("prefers the runtime value injected at container start", () => {
    expect(resolveGatewayUrl(RUNTIME, BUILD)).toBe(RUNTIME);
  });

  it("falls back to the build-time value", () => {
    expect(resolveGatewayUrl(undefined, BUILD)).toBe(BUILD);
  });

  it("ignores the template placeholder when the entrypoint never ran", () => {
    expect(resolveGatewayUrl("${GATEWAY_URL}", BUILD)).toBe(BUILD);
  });

  it("treats blank values as missing", () => {
    expect(resolveGatewayUrl("  ", "")).toBe(DEFAULT_GATEWAY_URL);
  });

  it("uses the local default when nothing is configured", () => {
    expect(resolveGatewayUrl(undefined, undefined)).toBe(DEFAULT_GATEWAY_URL);
  });

  it("drops trailing slashes so paths can be appended", () => {
    expect(resolveGatewayUrl("https://gw.example.com//", undefined)).toBe("https://gw.example.com");
  });

  it("trims surrounding spaces", () => {
    expect(resolveGatewayUrl(" https://gw.example.com ", undefined)).toBe("https://gw.example.com");
  });
});
