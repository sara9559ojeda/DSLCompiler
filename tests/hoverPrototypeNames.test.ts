import { describe, expect, it } from "vitest";
import { hoverDocFor } from "../src/editor/dslCompletions.js";

describe("hover help for names that exist on Object.prototype", () => {
  it.each(["constructor", "toString", "valueOf", "hasOwnProperty", "__proto__"])(
    "shows nothing for '%s' when the program does not declare it",
    (word) => {
      expect(hoverDocFor(word, "")).toBeNull();
    },
  );

  it("still documents a real color", () => {
    expect(hoverDocFor("rojo", "")).toMatch(/^\*\*Color\*\* `rojo` — #/);
  });

  it("documents 'constructor' as a variable when the program declares it", () => {
    expect(hoverDocFor("constructor", "let constructor = 5;")).toBe("**Variable** `constructor`");
  });
});
