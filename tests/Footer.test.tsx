import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "../src/components/Footer.js";
import { PROJECT_LINKS } from "../src/config/app.config.js";

describe("Footer", () => {
  it("links to every section of the page", () => {
    render(<Footer />);
    for (const [name, href] of [
      ["Proyecto", "#proyecto"],
      ["Compilar", "#compilar"],
      ["Exportaciones", "#exportaciones"],
    ]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });

  it("opens external project links in a new tab, safely", () => {
    render(<Footer />);
    for (const link of PROJECT_LINKS) {
      const anchor = screen.getByRole("link", { name: new RegExp(link.label) });
      expect(anchor).toHaveAttribute("href", link.href);
      expect(anchor).toHaveAttribute("target", "_blank");
      expect(anchor).toHaveAttribute("rel", "noreferrer");
    }
  });

  it("has a back-to-top link pointing at the hero", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: /Volver arriba/ })).toHaveAttribute("href", "#top");
  });
});
