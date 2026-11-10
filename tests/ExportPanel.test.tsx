import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ExportPanel } from "../src/components/ExportPanel.js";
import { useEditorStore } from "../src/state/useEditorStore.js";
import { useExportHistoryStore } from "../src/state/useExportHistoryStore.js";
import type { IExportClient } from "../src/api/IExportClient.js";
import { installMemoryStorage } from "./helpers/memoryStorage.js";

vi.mock("../src/api/downloadBlob.js", () => ({ downloadBlob: vi.fn() }));
const { downloadBlob } = await import("../src/api/downloadBlob.js");

const SVG = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

function setCompileResult(success: boolean): void {
  useEditorStore.setState({
    source: "c1 = crear_circulo(radio=10, x=0, y=0);",
    result: { success, svg: success ? SVG : null, diagnostics: [] },
  } as never);
}

const okClient: IExportClient = { exportPng: async () => new Blob(["png"], { type: "image/png" }) };

describe("ExportPanel", () => {
  beforeEach(() => {
    installMemoryStorage();
    useExportHistoryStore.setState({ entries: [] });
    vi.mocked(downloadBlob).mockClear();
  });

  it("disables both exports while the program has errors", () => {
    setCompileResult(false);
    render(<ExportPanel exportClient={okClient} />);

    expect(screen.getByRole("button", { name: /SVG/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /PNG/ })).toBeDisabled();
  });

  it("downloads the compiled SVG without a network call and records it", async () => {
    setCompileResult(true);
    const exportPng = vi.fn();
    render(<ExportPanel exportClient={{ exportPng }} />);

    fireEvent.click(screen.getByRole("button", { name: /SVG/ }));

    await waitFor(() => expect(useExportHistoryStore.getState().entries).toHaveLength(1));
    expect(vi.mocked(downloadBlob).mock.calls[0]?.[1]).toBe("diagrama.svg");
    expect(exportPng).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("SVG descargado");
  });

  it("asks the export client for the PNG and records it", async () => {
    setCompileResult(true);
    const exportPng = vi.fn(okClient.exportPng);
    render(<ExportPanel exportClient={{ exportPng }} />);

    fireEvent.click(screen.getByRole("button", { name: /PNG/ }));

    await waitFor(() => expect(useExportHistoryStore.getState().entries[0]?.format).toBe("png"));
    expect(exportPng).toHaveBeenCalledWith("c1 = crear_circulo(radio=10, x=0, y=0);");
  });

  it("shows the client's error message when the PNG export fails", async () => {
    setCompileResult(true);
    const failing: IExportClient = { exportPng: async () => Promise.reject(new Error("El servidor no respondió.")) };
    render(<ExportPanel exportClient={failing} />);

    fireEvent.click(screen.getByRole("button", { name: /PNG/ }));

    expect(await screen.findByText("El servidor no respondió.")).toBeInTheDocument();
    expect(downloadBlob).not.toHaveBeenCalled();
  });
});
