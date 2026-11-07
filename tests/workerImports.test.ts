import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The compile worker has no `window`: whatever it imports must not touch it at load time.
describe("compile worker imports", () => {
  it("only pulls in worker-safe config", () => {
    const source = readFileSync("src/compiler/compiler.worker.ts", "utf8");
    expect(source).not.toMatch(/app\.config/);
    expect(readFileSync("src/config/compile.config.ts", "utf8")).not.toMatch(/\bwindow\b(?!\/)\.|import\.meta\.env/);
  });
});
