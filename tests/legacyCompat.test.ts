import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { createDefaultPipeline } from "@saramariaojeda9559/compiler-core";
import { DSL_PRESETS } from "../src/config/presets.config.js";

/**
 * Compatibility with language 1.x: the eight original presets (no loops, no
 * groups, no diagrams) must produce byte-for-byte the SVG the published 0.2.0
 * compiler produced. The reference output comes from the real 0.2.0 package,
 * extracted outside the repo (LEGACY_CORE_DIST points at its dist/index.js) and
 * run in its own Node process; without it the test is skipped rather than
 * comparing the compiler against itself.
 */
const LEGACY_DIST = process.env.LEGACY_CORE_DIST;
const LEGACY_IDS = ["gato", "pez", "casa", "flor", "robot", "muneco", "carro", "diagrama"];
const sourceOf = (id: string): string => DSL_PRESETS.find((preset) => preset.id === id)!.source;

function legacyOutputs(): Record<string, { svg: string | null; diagnostics: unknown }> {
  const script = `
    const { createDefaultPipeline } = await import(${JSON.stringify(pathToFileURL(LEGACY_DIST!).href)});
    const sources = JSON.parse(process.env.SOURCES);
    const out = {};
    for (const [id, source] of Object.entries(sources)) {
      const r = createDefaultPipeline().compile(source);
      out[id] = { svg: r.svg ?? null, diagnostics: r.diagnostics };
    }
    process.stdout.write(JSON.stringify(out));
  `;
  const sources = Object.fromEntries(LEGACY_IDS.map((id) => [id, sourceOf(id)]));
  const stdout = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    env: { ...process.env, SOURCES: JSON.stringify(sources) },
    maxBuffer: 20 * 1024 * 1024,
  });
  return JSON.parse(stdout.toString("utf8")) as Record<string, { svg: string | null; diagnostics: unknown }>;
}

describe.skipIf(!LEGACY_DIST || !existsSync(LEGACY_DIST))("language 1.x compatibility", () => {
  const reference = LEGACY_DIST && existsSync(LEGACY_DIST) ? legacyOutputs() : {};

  it.each(LEGACY_IDS)("preset %s renders identically to compiler-core 0.2.0", (id) => {
    const after = createDefaultPipeline().compile(sourceOf(id));
    expect(after.success).toBe(true);
    expect(after.svg).toBe(reference[id]!.svg);
    expect(after.diagnostics).toEqual(reference[id]!.diagnostics);
  });
});

describe("language 1.x programs keep compiling", () => {
  it.each(LEGACY_IDS)("preset %s compiles without diagnostics", (id) => {
    expect(createDefaultPipeline().compile(sourceOf(id)).diagnostics).toEqual([]);
  });
});
