import { describe, expect, it } from "vitest";
import { collapseDiff, diffLines, hasChanges } from "../src/ai/lineDiff.js";

const apply = (ops: ReturnType<typeof diffLines>): { before: string; after: string } => ({
  before: ops.filter((o) => o.type !== "add").map((o) => o.text).join("\n"),
  after: ops.filter((o) => o.type !== "del").map((o) => o.text).join("\n"),
});

describe("diffLines", () => {
  it("reports no change for identical text", () => {
    expect(hasChanges(diffLines("a\nb", "a\nb"))).toBe(false);
  });

  it("marks one changed line as a deletion plus an addition", () => {
    const ops = diffLines("a\nb\nc", "a\nB\nc");
    expect(ops).toEqual([
      { type: "same", text: "a" },
      { type: "del", text: "b" },
      { type: "add", text: "B" },
      { type: "same", text: "c" },
    ]);
  });

  it("handles insertions and deletions in the middle", () => {
    const before = "a\nb\nc\nd\ne";
    const after = "a\nc\nX\nd\nY\ne";
    expect(apply(diffLines(before, after))).toEqual({ before, after });
  });

  it("reconstructs both sides for arbitrary edits", () => {
    const before = Array.from({ length: 40 }, (_, i) => `l${i}`).join("\n");
    const after = Array.from({ length: 40 }, (_, i) => (i % 7 === 0 ? `changed${i}` : `l${i}`)).concat(["tail"]).join("\n");
    expect(apply(diffLines(before, after))).toEqual({ before, after });
  });

  it("falls back to a full replacement for huge inputs instead of hanging", () => {
    const big = (prefix: string): string => Array.from({ length: 2500 }, (_, i) => `${prefix}${i}`).join("\n");
    const started = Date.now();
    const ops = diffLines(big("a"), big("b"));
    expect(Date.now() - started).toBeLessThan(2000);
    expect(ops.filter((o) => o.type === "del")).toHaveLength(2500);
  });
});

describe("collapseDiff", () => {
  it("keeps changes with context and counts the skipped lines", () => {
    const before = Array.from({ length: 20 }, (_, i) => `l${i}`).join("\n");
    const after = before.replace("l10", "CHANGED");
    const { hunks, skippedAfter } = collapseDiff(diffLines(before, after), 2);
    expect(hunks).toHaveLength(1);
    expect(hunks[0]!.skippedBefore).toBe(8);
    expect(hunks[0]!.ops.map((o) => o.text)).toEqual(["l8", "l9", "l10", "CHANGED", "l11", "l12"]);
    expect(skippedAfter).toBe(7);
  });

  it("splits distant changes into separate hunks", () => {
    const before = Array.from({ length: 30 }, (_, i) => `l${i}`).join("\n");
    const after = before.replace("l2", "A").replace("l27", "B");
    expect(collapseDiff(diffLines(before, after), 1).hunks).toHaveLength(2);
  });
});
