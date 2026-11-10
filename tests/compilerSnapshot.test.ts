import { describe, expect, it } from "vitest";
import { createDefaultPipeline } from "@saramariaojeda9559/compiler-core";

/** Guards the vendored compiler snapshot: these programs failed before backend commit 898b295. */
describe("vendored compiler-core snapshot", () => {
  it("accepts Object.prototype names as variable names", () => {
    const result = createDefaultPipeline().compile("constructor = crear_circulo(radio=10, x=0, y=0);");
    expect(result.diagnostics).toEqual([]);
  });

  it("rejects an Object.prototype name as a color with a semantic error", () => {
    const result = createDefaultPipeline().compile("crear_circulo(radio=10, x=0, y=0, color=toString);");
    expect(result.success).toBe(false);
    expect(result.diagnostics[0]?.code).toMatch(/^SEM-/);
  });
});
