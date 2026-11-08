import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSculpture } from "../src/landing/HeroSculpture.js";
import { SculptureFallback } from "../src/landing/SculptureFallback.js";

describe("HeroSculpture without WebGL", () => {
  it("renders the static SVG sculpture (jsdom has no WebGL) and never mounts a canvas", () => {
    const { container } = render(<HeroSculpture />);
    expect(container.querySelector(".sculpture")).toHaveAttribute("data-mode", "static");
    expect(screen.getByRole("img", { name: /Escultura de ojos concéntricos/ })).toBeInTheDocument();
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("does not offer the 3D opt-in when the device cannot run it", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduce"), addEventListener: () => undefined, removeEventListener: () => undefined }));
    render(<HeroSculpture />);
    expect(screen.queryByRole("button", { name: /Activar escultura 3D/ })).toBeNull();
    vi.unstubAllGlobals();
  });
});

describe("SculptureFallback", () => {
  it("is a labelled image made only of SVG shapes", () => {
    const { container } = render(<SculptureFallback />);
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(5);
  });
});
