import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { navigate, routeFromHash, STUDIO_HASH, useHashRoute } from "../src/routing/useHashRoute.js";
import { askAssistantInStudio, openInStudio } from "../src/landing/openInStudio.js";
import { useEditorStore } from "../src/state/useEditorStore.js";

describe("routeFromHash", () => {
  it.each([
    ["", "landing"],
    ["#galeria", "landing"],
    ["#lienzo", "landing"],
    [STUDIO_HASH, "studio"],
    [`${STUDIO_HASH}?proyecto=1`, "studio"],
  ])("maps '%s' to the %s view", (hash, route) => {
    expect(routeFromHash(hash)).toBe(route);
  });
});

describe("navigate and useHashRoute", () => {
  afterEach(() => {
    window.history.pushState(null, "", "/");
  });

  it("switches the view to the studio and back", () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    const { result } = renderHook(() => useHashRoute());
    expect(result.current).toBe("landing");

    act(() => {
      navigate("studio");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(result.current).toBe("studio");

    act(() => navigate("landing"));
    expect(result.current).toBe("landing");
    expect(window.location.hash).toBe("");
  });

  it("scrolls to the top when going back to the landing", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    navigate("landing");
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });
});

describe("openInStudio", () => {
  afterEach(() => {
    window.history.pushState(null, "", "/");
  });

  it("loads the program into the editor and opens the studio", () => {
    openInStudio("t1 = crear_texto(contenido=\"hola\", x=0, y=0);");
    expect(useEditorStore.getState().source).toContain("hola");
    expect(window.location.hash).toBe(STUDIO_HASH);
  });

  it("hands a prompt to the assistant and opens the studio", () => {
    askAssistantInStudio("una casa");
    expect(useEditorStore.getState().assistantRequest).toMatchObject({ mode: "generate", prompt: "una casa" });
    expect(window.location.hash).toBe(STUDIO_HASH);
  });
});
