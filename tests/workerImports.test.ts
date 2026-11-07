import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const isComment = (line: string): boolean => /^\s*(\/\/|\/\*|\*)/.test(line);

// The compile worker has no `window`: whatever it imports must not touch it at load time.
describe("compile worker imports", () => {
  it("only pulls in worker-safe config", () => {
    expect(readFileSync("src/compiler/compiler.worker.ts", "utf8")).not.toMatch(/app\.config/);
    const code = readFileSync("src/config/compile.config.ts", "utf8").split("\n").filter((line) => !isComment(line));
    expect(code.join("\n")).not.toMatch(/\bwindow\b|import\.meta\.env/);
  });
});
