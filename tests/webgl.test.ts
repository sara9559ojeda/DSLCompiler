import { afterEach, describe, expect, it, vi } from "vitest";
import { canUseWebGL, isLowPowerDevice, isSmallScreen, prefersReducedMotion } from "../src/landing/webgl.js";

function stubNavigator(hints: { deviceMemory?: number; hardwareConcurrency?: number; saveData?: boolean }): void {
  vi.stubGlobal("navigator", {
    deviceMemory: hints.deviceMemory,
    hardwareConcurrency: hints.hardwareConcurrency,
    connection: hints.saveData === undefined ? undefined : { saveData: hints.saveData },
  });
}

function stubMatchMedia(matches: (query: string) => boolean): void {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: matches(query) }));
  window.matchMedia = ((query: string) => ({ matches: matches(query) })) as typeof window.matchMedia;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("isLowPowerDevice", () => {
  it("is false for a capable device", () => {
    stubNavigator({ deviceMemory: 8, hardwareConcurrency: 8, saveData: false });
    expect(isLowPowerDevice()).toBe(false);
  });

  it.each([
    ["little memory", { deviceMemory: 2, hardwareConcurrency: 8 }],
    ["few cores", { deviceMemory: 8, hardwareConcurrency: 2 }],
    ["data saver on", { deviceMemory: 8, hardwareConcurrency: 8, saveData: true }],
  ])("is true with %s", (_label, hints) => {
    stubNavigator(hints);
    expect(isLowPowerDevice()).toBe(true);
  });

  it("is false when the browser gives no hints", () => {
    stubNavigator({});
    expect(isLowPowerDevice()).toBe(false);
  });
});

describe("media query helpers", () => {
  it("read reduced motion and small screens from matchMedia", () => {
    stubMatchMedia((query) => query.includes("reduce") || query.includes("700px"));
    expect(prefersReducedMotion()).toBe(true);
    expect(isSmallScreen()).toBe(true);
  });

  it("fall back to false when matchMedia throws", () => {
    window.matchMedia = (() => {
      throw new Error("unsupported");
    }) as typeof window.matchMedia;
    expect(prefersReducedMotion()).toBe(false);
    expect(isSmallScreen()).toBe(false);
  });
});

describe("canUseWebGL", () => {
  it("is false when the browser cannot create a WebGL context", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(canUseWebGL()).toBe(false);
  });

  it("is true when a context can be created", () => {
    Object.defineProperty(window, "WebGLRenderingContext", { value: function WebGLRenderingContext() {}, configurable: true });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({} as RenderingContext);
    expect(canUseWebGL()).toBe(true);
  });
});
