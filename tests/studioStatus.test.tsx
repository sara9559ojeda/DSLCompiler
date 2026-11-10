import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import { compileStatusOf } from "../src/studio/StudioHeader.js";
import { useMediaQuery } from "../src/studio/useMediaQuery.js";
import { ExportHistoryPanel } from "../src/components/ExportHistoryPanel.js";
import { useExportHistoryStore } from "../src/state/useExportHistoryStore.js";

const error = { severity: "error" };
const warning = { severity: "warning" };

describe("compileStatusOf", () => {
  it("shows compiling while a compile is running, whatever the last result", () => {
    expect(compileStatusOf(true, { success: false, diagnostics: [error] }).variant).toBe("compiling");
  });

  it("is idle before the first compile", () => {
    expect(compileStatusOf(false, null)).toEqual({ label: "Listo", variant: "idle" });
  });

  it("reports errors when the compile failed", () => {
    expect(compileStatusOf(false, { success: false, diagnostics: [] }).variant).toBe("error");
  });

  it("reports errors when an error diagnostic is present", () => {
    expect(compileStatusOf(false, { success: true, diagnostics: [error] }).variant).toBe("error");
  });

  it("is ok with warnings only", () => {
    expect(compileStatusOf(false, { success: true, diagnostics: [warning] })).toEqual({ label: "Compilado", variant: "ok" });
  });
});

describe("useMediaQuery", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("follows the media query as it changes", () => {
    let matches = false;
    const listeners = new Set<() => void>();
    window.matchMedia = ((query: string) => ({
      media: query,
      get matches() {
        return matches;
      },
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    })) as unknown as typeof window.matchMedia;

    const { result, unmount } = renderHook(() => useMediaQuery("(max-width: 900px)"));
    expect(result.current).toBe(false);

    act(() => {
      matches = true;
      listeners.forEach((listener) => listener());
    });
    expect(result.current).toBe(true);

    unmount();
    expect(listeners.size).toBe(0);
  });
});

describe("ExportHistoryPanel", () => {
  it("says when nothing has been exported yet", () => {
    useExportHistoryStore.setState({ entries: [] });
    render(<ExportHistoryPanel />);
    expect(screen.getByText("Todavía no exportaste ningún archivo.")).toBeInTheDocument();
  });

  it("lists each export with a link to download it again", () => {
    useExportHistoryStore.setState({
      entries: [{ id: "1", format: "png", filename: "diagrama.png", createdAt: Date.now(), dataUrl: "data:image/png;base64,AA==" }],
    });
    render(<ExportHistoryPanel />);

    expect(screen.getByText("PNG")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "Descargar diagrama.png de nuevo" });
    expect(link).toHaveAttribute("href", "data:image/png;base64,AA==");
    expect(link).toHaveAttribute("download", "diagrama.png");
  });
});
