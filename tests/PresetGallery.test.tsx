import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PresetGallery } from "../src/components/PresetGallery.js";
import { useEditorStore } from "../src/state/useEditorStore.js";
import { DSL_PRESETS } from "../src/config/presets.config.js";
import { DEFAULT_DSL_SOURCE } from "../src/config/app.config.js";

const gato = DSL_PRESETS.find((preset) => preset.id === "gato")!;
const pez = DSL_PRESETS.find((preset) => preset.id === "pez")!;

describe("PresetGallery", () => {
  beforeEach(() => {
    useEditorStore.setState({ source: DEFAULT_DSL_SOURCE, result: null, isCompiling: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders one button per preset with a compiled thumbnail", () => {
    const { container } = render(<PresetGallery />);
    for (const preset of DSL_PRESETS) {
      expect(screen.getByRole("button", { name: preset.name })).toBeInTheDocument();
    }
    expect(container.querySelectorAll(".preset-card__thumb svg")).toHaveLength(DSL_PRESETS.length);
  });

  it("loads the preset into the editor and marks it active", () => {
    render(<PresetGallery />);
    fireEvent.click(screen.getByRole("button", { name: "Gato" }));

    expect(useEditorStore.getState().source).toBe(gato.source);
    expect(screen.getByRole("button", { name: "Gato" })).toHaveAttribute("aria-pressed", "true");
  });

  it("switches between presets without asking", () => {
    const confirm = vi.spyOn(window, "confirm");
    useEditorStore.setState({ source: gato.source });
    render(<PresetGallery />);

    fireEvent.click(screen.getByRole("button", { name: "Pez" }));

    expect(confirm).not.toHaveBeenCalled();
    expect(useEditorStore.getState().source).toBe(pez.source);
  });

  it("asks before replacing code the user wrote, and keeps it if they cancel", () => {
    const own = "mi_circulo = crear_circulo(radio=10, x=50, y=50);\n";
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    useEditorStore.setState({ source: own });
    render(<PresetGallery />);

    fireEvent.click(screen.getByRole("button", { name: "Gato" }));

    expect(confirm).toHaveBeenCalledOnce();
    expect(useEditorStore.getState().source).toBe(own);
  });
});
