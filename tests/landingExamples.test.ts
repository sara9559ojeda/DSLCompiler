import { describe, expect, it } from "vitest";
import { createDefaultPipeline } from "@saramariaojeda9559/compiler-core";
import { PLAYGROUND_EXAMPLES, defaultValues, extremeValues } from "../src/landing/examples.js";
import { GALLERY_ITEMS } from "../src/landing/galleryItems.js";
import { AI_EXAMPLE } from "../src/landing/aiExample.js";
import { DSL_PRESETS } from "../src/config/presets.config.js";

describe("landing examples are real, compiling DSL", () => {
  it.each(PLAYGROUND_EXAMPLES.map((example) => [example.id, example] as const))(
    "playground '%s' compiles at default and extreme parameter values",
    (_id, example) => {
      for (const values of [defaultValues(example), ...extremeValues(example)]) {
        const result = createDefaultPipeline().compile(example.build(values));
        expect(result.diagnostics.filter((d) => d.severity === "error")).toEqual([]);
        expect(result.success).toBe(true);
        expect(result.svg).toContain("<svg");
      }
    },
  );

  it("every gallery item points at an existing preset that compiles", () => {
    for (const item of GALLERY_ITEMS) {
      const preset = DSL_PRESETS.find((candidate) => candidate.id === item.presetId);
      expect(preset, item.presetId).toBeDefined();
      const result = createDefaultPipeline().compile(preset!.source);
      expect(result.success, item.presetId).toBe(true);
    }
  });

  it("the Creative AI section's sample program compiles", () => {
    const result = createDefaultPipeline().compile(AI_EXAMPLE.code);
    expect(result.diagnostics).toEqual([]);
    expect(result.success).toBe(true);
  });
});
