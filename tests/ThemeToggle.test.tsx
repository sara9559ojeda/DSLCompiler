import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "../src/theme/ThemeProvider.js";
import { ThemeToggle } from "../src/components/ThemeToggle.js";

describe("ThemeToggle", () => {
  it("toggles the data-theme attribute on the document root when clicked", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const initialTheme = document.documentElement.getAttribute("data-theme");
    fireEvent.click(screen.getByRole("button"));
    const nextTheme = document.documentElement.getAttribute("data-theme");

    expect(nextTheme).not.toBe(initialTheme);
  });
});
