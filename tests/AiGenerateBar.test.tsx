import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AiGenerateBar } from "../src/components/AiGenerateBar.js";
import { useEditorStore } from "../src/state/useEditorStore.js";

describe("AiGenerateBar", () => {
  beforeEach(() => {
    useEditorStore.setState({ source: "original", assistantRequest: null });
  });

  it("hands the description to the assistant panel and never touches the editor source", () => {
    render(<AiGenerateBar />);
    fireEvent.change(screen.getByLabelText(/Descripción para generar/i), { target: { value: "un gato" } });
    fireEvent.click(screen.getByRole("button", { name: /Generar/i }));

    expect(useEditorStore.getState().assistantRequest).toEqual({ mode: "generate", prompt: "un gato" });
    expect(useEditorStore.getState().source).toBe("original");
  });

  it("disables the submit button until a prompt is typed", () => {
    render(<AiGenerateBar />);
    expect(screen.getByRole("button", { name: /Generar/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Descripción para generar/i), { target: { value: "x" } });
    expect(screen.getByRole("button", { name: /Generar/i })).toBeEnabled();
  });
});
