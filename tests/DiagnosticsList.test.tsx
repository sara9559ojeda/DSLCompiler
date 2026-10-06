import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiagnosticsList } from "../src/components/DiagnosticsList.js";
import { useEditorStore } from "../src/state/useEditorStore.js";

describe("DiagnosticsList", () => {
  beforeEach(() => {
    useEditorStore.setState({ result: null, source: "", isCompiling: false });
  });

  it("shows a neutral message before the first compile", () => {
    render(<DiagnosticsList />);
    expect(screen.getByText("Compilando…")).toBeInTheDocument();
  });

  it("shows a success message when there are no diagnostics", () => {
    useEditorStore.setState({ result: { success: true, svg: "<svg></svg>", diagnostics: [] } });
    render(<DiagnosticsList />);
    expect(screen.getByText("Sin errores.")).toBeInTheDocument();
  });

  it("lists each diagnostic with its position", () => {
    useEditorStore.setState({
      result: {
        success: false,
        svg: null,
        diagnostics: [
          { severity: "error", message: "Falta el parámetro 'radio'.", position: { line: 2, column: 5 } },
        ],
      },
    });
    render(<DiagnosticsList />);
    expect(screen.getByText(/2:5 — Falta el parámetro 'radio'\./)).toBeInTheDocument();
  });
});
