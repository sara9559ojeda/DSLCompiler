import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { countLabel } from "../src/text/pluralize.js";
import { ProblemsPanel } from "../src/studio/ProblemsPanel.js";
import { useEditorStore } from "../src/state/useEditorStore.js";

describe("countLabel", () => {
  it.each([
    [0, "0 errores"],
    [1, "1 error"],
    [2, "2 errores"],
  ])("labels %i", (count, label) => {
    expect(countLabel(count, "error", "errores")).toBe(label);
  });
});

describe("ProblemsPanel counts", () => {
  const diagnostic = (severity: "error" | "warning") => ({ severity, message: "x", position: { line: 1, column: 1 } });

  it("uses the singular for exactly one error and one warning", () => {
    useEditorStore.setState({
      result: { success: false, svg: null, diagnostics: [diagnostic("error"), diagnostic("warning")] },
      inspection: null,
    } as never);

    render(<ProblemsPanel open={false} onToggle={() => undefined} />);

    expect(screen.getByText("1 error")).toBeInTheDocument();
    expect(screen.getByText("1 aviso")).toBeInTheDocument();
  });

  it("uses the plural for none or several", () => {
    useEditorStore.setState({
      result: { success: false, svg: null, diagnostics: [diagnostic("error"), diagnostic("error")] },
      inspection: null,
    } as never);

    render(<ProblemsPanel open={false} onToggle={() => undefined} />);

    expect(screen.getByText("2 errores")).toBeInTheDocument();
    expect(screen.getByText("0 avisos")).toBeInTheDocument();
  });
});
