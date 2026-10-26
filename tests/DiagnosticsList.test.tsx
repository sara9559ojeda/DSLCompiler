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
          { severity: "error", code: "SEM-009", message: "Falta el parámetro 'radio'.", position: { line: 2, column: 5 } },
        ],
      },
    });
    render(<DiagnosticsList />);
    expect(screen.getByText(/2:5 — Falta el parámetro 'radio'\./)).toBeInTheDocument();
  });

  it("shows the code, the offending line with a caret, and the suggestion", () => {
    useEditorStore.setState({
      result: {
        success: false,
        svg: null,
        diagnostics: [
          {
            severity: "error",
            code: "SEM-004",
            message: "Comando desconocido: 'crear_circlo'.",
            position: { line: 1, column: 6 },
            suggestion: "¿Quisiste decir 'crear_circulo'?",
            snippet: "c1 = crear_circlo(radio=5, x=1, y=1);",
          },
        ],
      },
    });
    const { container } = render(<DiagnosticsList />);
    expect(screen.getByText("SEM-004")).toBeInTheDocument();
    expect(screen.getByText("¿Quisiste decir 'crear_circulo'?")).toBeInTheDocument();
    expect(container.querySelector(".diagnostics__snippet")?.textContent).toBe(
      "c1 = crear_circlo(radio=5, x=1, y=1);\n     ^",
    );
  });

  it("cuts long lines to a window around the column so the caret stays visible", () => {
    const snippet = "casa = crear_rectangulo(ancho=200, alto=120, x=100, y=200, color=azl);";
    useEditorStore.setState({
      result: {
        success: false,
        svg: null,
        diagnostics: [
          { severity: "error", code: "SEM-012", message: "Color desconocido: 'azl'.", position: { line: 1, column: 66 }, snippet },
        ],
      },
    });
    const { container } = render(<DiagnosticsList />);
    const [line, caret] = container.querySelector(".diagnostics__snippet")!.textContent!.split("\n");
    expect(line!.startsWith("…")).toBe(true);
    expect(line![caret!.indexOf("^")]).toBe("a"); // the caret sits under the 'a' of 'azl'
    expect(line!.slice(caret!.indexOf("^"))).toBe("azl);");
  });
});
