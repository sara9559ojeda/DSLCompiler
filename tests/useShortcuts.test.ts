import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { SHORTCUT_HELP, useShortcuts } from "../src/studio/useShortcuts.js";

function press(init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  window.dispatchEvent(event);
  return event;
}

describe("useShortcuts", () => {
  it("runs the action mapped to a combination and stops the browser default", () => {
    const save = vi.fn();
    renderHook(() => useShortcuts({ "mod+s": save }));

    const event = press({ key: "s", code: "KeyS", ctrlKey: true });

    expect(save).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it("treats Cmd like Ctrl", () => {
    const save = vi.fn();
    renderHook(() => useShortcuts({ "mod+s": save }));

    press({ key: "s", code: "KeyS", metaKey: true });

    expect(save).toHaveBeenCalledOnce();
  });

  it("leaves unmapped keys alone", () => {
    const save = vi.fn();
    renderHook(() => useShortcuts({ "mod+s": save }));

    const event = press({ key: "s", code: "KeyS" });

    expect(save).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("uses the physical digit for Alt shortcuts, whatever the layout prints", () => {
    const showResult = vi.fn();
    renderHook(() => useShortcuts({ "alt+1": showResult }));

    press({ key: "¡", code: "Digit1", altKey: true });

    expect(showResult).toHaveBeenCalledOnce();
  });

  it("stops listening when the component unmounts", () => {
    const save = vi.fn();
    const { unmount } = renderHook(() => useShortcuts({ "mod+s": save }));
    unmount();

    press({ key: "s", code: "KeyS", ctrlKey: true });

    expect(save).not.toHaveBeenCalled();
  });
});

describe("SHORTCUT_HELP", () => {
  it("documents every shortcut with keys and an action", () => {
    for (const entry of SHORTCUT_HELP) {
      expect(entry.keys).not.toBe("");
      expect(entry.action).not.toBe("");
    }
  });
});
