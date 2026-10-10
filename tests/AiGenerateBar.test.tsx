import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AiGenerateBar } from "../src/components/AiGenerateBar.js";
import { useEditorStore } from "../src/state/useEditorStore.js";

describe("AiGenerateBar", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    useEditorStore.setState({ source: "", result: null, isCompiling: false });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("loads the generated DSL into the shared store so the editor picks it up", async () => {
    const payload = {
      dslSource: "c1 = crear_circulo(radio=20, color=negro, x=10, y=10);",
      valid: true,
      diagnostics: [],
    };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) }) as unknown as typeof fetch;

    render(<AiGenerateBar />);
    fireEvent.change(screen.getByLabelText(/Descripción para generar/i), { target: { value: "un gato" } });
    fireEvent.click(screen.getByRole("button", { name: /Generar/i }));

    await waitFor(() => expect(useEditorStore.getState().source).toBe(payload.dslSource));
  });

  it("warns (without blocking the load) when the generated DSL didn't compile cleanly", async () => {
    const payload = { dslSource: "crear_circulo(x=0, y=0);", valid: false, diagnostics: [] };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(payload) }) as unknown as typeof fetch;

    render(<AiGenerateBar />);
    fireEvent.change(screen.getByLabelText(/Descripción para generar/i), { target: { value: "algo raro" } });
    fireEvent.click(screen.getByRole("button", { name: /Generar/i }));

    await waitFor(() => expect(useEditorStore.getState().source).toBe(payload.dslSource));
    expect(screen.getByText(/quedó con errores/i)).toBeInTheDocument();
  });

  it("shows an error note when generation fails, without touching the editor source", async () => {
    useEditorStore.setState({ source: "original" });
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: "falló la generación" } }),
    }) as unknown as typeof fetch;

    render(<AiGenerateBar />);
    fireEvent.change(screen.getByLabelText(/Descripción para generar/i), { target: { value: "algo" } });
    fireEvent.click(screen.getByRole("button", { name: /Generar/i }));

    await waitFor(() => expect(screen.getByText("falló la generación")).toBeInTheDocument());
    expect(useEditorStore.getState().source).toBe("original");
  });

  it("disables the submit button until a prompt is typed", () => {
    render(<AiGenerateBar />);
    expect(screen.getByRole("button", { name: /Generar/i })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Descripción para generar/i), { target: { value: "x" } });
    expect(screen.getByRole("button", { name: /Generar/i })).toBeEnabled();
  });
});
