import { describe, expect, it } from "vitest";
import { createDefaultPipeline } from "@saramariaojeda9559/compiler-core";
import { DSL_PRESETS } from "../src/config/presets.config.js";

describe("DSL presets", () => {
  it("have unique ids", () => {
    const ids = DSL_PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(DSL_PRESETS.map((preset) => [preset.name, preset.source] as const))(
    "%s compiles with no diagnostics",
    (_name, source) => {
      const result = createDefaultPipeline().compile(source);
      expect(result.diagnostics).toEqual([]);
      expect(result.success).toBe(true);
      expect(result.svg).toContain("<svg");
    },
  );
});
