import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { readLocalProject, writeLocalProject } from "../src/studio/localProjectStorage.js";
import { restoreLocalProject, useLocalProject } from "../src/studio/useLocalProject.js";
import { useEditorStore } from "../src/state/useEditorStore.js";
import { LOCAL_PROJECT_AUTOSAVE_DELAY_MS, LOCAL_PROJECT_STORAGE_KEY } from "../src/config/app.config.js";
import { installMemoryStorage, installThrowingStorage } from "./helpers/memoryStorage.js";

const project = { name: "Mi diagrama", source: "c1 = crear_circulo(radio=10, x=0, y=0);", savedAt: 1_700_000_000_000 };

describe("localProjectStorage", () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it("reads back what it wrote", () => {
    expect(writeLocalProject(project)).toBe(true);
    expect(readLocalProject()).toEqual(project);
  });

  it("returns null when nothing is saved", () => {
    expect(readLocalProject()).toBeNull();
  });

  it.each([
    ["corrupted JSON", "{oops"],
    ["JSON null", "null"],
    ["a project without source", JSON.stringify({ name: "x" })],
    ["a project without name", JSON.stringify({ source: "x" })],
  ])("returns null for %s", (_label, raw) => {
    window.localStorage.setItem(LOCAL_PROJECT_STORAGE_KEY, raw);
    expect(readLocalProject()).toBeNull();
  });

  it("falls back to now when the saved date is missing", () => {
    window.localStorage.setItem(LOCAL_PROJECT_STORAGE_KEY, JSON.stringify({ name: "x", source: "y" }));
    expect(readLocalProject(() => 42)).toEqual({ name: "x", source: "y", savedAt: 42 });
  });

  it("reports failure instead of throwing when storage is unavailable", () => {
    installThrowingStorage();
    expect(writeLocalProject(project)).toBe(false);
    expect(readLocalProject()).toBeNull();
  });
});

describe("restoreLocalProject", () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it("loads the saved project into the editor store", () => {
    writeLocalProject(project);
    restoreLocalProject();
    expect(useEditorStore.getState().source).toBe(project.source);
    expect(useEditorStore.getState().projectName).toBe(project.name);
  });
});

describe("useLocalProject", () => {
  beforeEach(() => {
    installMemoryStorage();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks the project dirty on edit and saves it after the autosave delay", () => {
    const { result } = renderHook(() => useLocalProject());
    expect(result.current.saveState).toBe("saved");

    act(() => useEditorStore.getState().setSource("c2 = crear_texto(contenido=\"hola\", x=0, y=0);"));
    expect(result.current.saveState).toBe("dirty");

    act(() => vi.advanceTimersByTime(LOCAL_PROJECT_AUTOSAVE_DELAY_MS));
    expect(result.current.saveState).toBe("saved");
    expect(readLocalProject()?.source).toContain("hola");
  });

  it("says the project cannot be saved when storage is unavailable", () => {
    const { result } = renderHook(() => useLocalProject());
    installThrowingStorage();

    act(() => result.current.saveNow());

    expect(result.current.saveState).toBe("unavailable");
  });
});
