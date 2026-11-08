import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Splitter } from "../src/studio/Splitter.js";
import { describeKeyEvent } from "../src/studio/useShortcuts.js";
import { restoreLocalProject } from "../src/studio/useLocalProject.js";
import { routeFromHash, STUDIO_HASH } from "../src/routing/useHashRoute.js";
import { useEditorStore } from "../src/state/useEditorStore.js";

describe("routing", () => {
  it("opens the studio only for #/estudio; in-page anchors stay on the landing", () => {
    expect(routeFromHash(STUDIO_HASH)).toBe("studio");
    expect(routeFromHash("#/estudio?x=1")).toBe("studio");
    expect(routeFromHash("")).toBe("landing");
    expect(routeFromHash("#galeria")).toBe("landing");
    expect(routeFromHash("#como-funciona")).toBe("landing");
  });
});

describe("Splitter (resizable panels)", () => {
  function setup(sign: 1 | -1 = 1): { changes: number[] } {
    const changes: number[] = [];
    render(<Splitter orientation="vertical" label="Ancho" value={300} min={200} max={400} sign={sign} onChange={(v) => changes.push(v)} />);
    return { changes };
  }

  it("is a keyboard-focusable separator exposing its value", () => {
    setup();
    const separator = screen.getByRole("separator", { name: "Ancho" });
    expect(separator).toHaveAttribute("tabindex", "0");
    expect(separator).toHaveAttribute("aria-valuenow", "300");
    expect(separator).toHaveAttribute("aria-valuemin", "200");
    expect(separator).toHaveAttribute("aria-valuemax", "400");
  });

  it("resizes with the arrow keys, clamps to its limits and jumps with Home/End", () => {
    const { changes } = setup();
    const separator = screen.getByRole("separator");
    fireEvent.keyDown(separator, { key: "ArrowRight" });
    fireEvent.keyDown(separator, { key: "ArrowLeft" });
    fireEvent.keyDown(separator, { key: "Home" });
    fireEvent.keyDown(separator, { key: "End" });
    expect(changes).toEqual([324, 276, 200, 400]);
  });

  it("inverts the direction for panels anchored to the opposite side", () => {
    const { changes } = setup(-1);
    fireEvent.keyDown(screen.getByRole("separator"), { key: "ArrowRight" });
    expect(changes).toEqual([276]);
  });
});

describe("keyboard shortcuts", () => {
  const press = (init: KeyboardEventInit): string => describeKeyEvent(new KeyboardEvent("keydown", init));

  it("normalises combinations and treats Cmd like Ctrl", () => {
    expect(press({ key: "b", ctrlKey: true })).toBe("mod+b");
    expect(press({ key: "B", metaKey: true })).toBe("mod+b");
    expect(press({ key: "E", ctrlKey: true, shiftKey: true })).toBe("mod+shift+e");
  });

  it("uses the physical digit key so Alt+number works on any layout", () => {
    expect(press({ key: "¡", code: "Digit1", altKey: true })).toBe("alt+1");
  });
});

describe("local project persistence", () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
    });
    useEditorStore.setState({ source: "original", projectName: "Sin título" });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("restores the saved source and name into the shared store", () => {
    store.set("dsl-studio:project", JSON.stringify({ name: "Mi obra", source: "crear_circulo(radio=5, x=1, y=1);", savedAt: 1 }));
    restoreLocalProject();
    expect(useEditorStore.getState().source).toBe("crear_circulo(radio=5, x=1, y=1);");
    expect(useEditorStore.getState().projectName).toBe("Mi obra");
  });

  it("ignores corrupt or missing data instead of crashing", () => {
    restoreLocalProject();
    expect(useEditorStore.getState().source).toBe("original");
    store.set("dsl-studio:project", "{not json");
    restoreLocalProject();
    store.set("dsl-studio:project", JSON.stringify({ name: 3 }));
    restoreLocalProject();
    expect(useEditorStore.getState().source).toBe("original");
  });
});
