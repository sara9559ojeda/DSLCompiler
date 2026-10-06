import { test, expect } from "@playwright/test";

test.describe("Compiler workflow", () => {
  test("compiles the default program and shows a live SVG preview", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Sin errores.")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".preview-panel__canvas svg")).toBeVisible();
    await expect(page.locator(".preview-panel__canvas circle")).toBeVisible();
  });

  test("shows a diagnostic with its position when the program has an error", async ({ page }) => {
    await page.goto("/");
    // Monaco's ARIA textbox node is an accessibility-only element that
    // Playwright's visibility check rejects; click the actual editor
    // surface instead.
    await page.locator(".monaco-editor").click();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type("crear_circulo(x=0, y=0);"); // missing required 'radio'

    await expect(page.locator(".diagnostics__item--error").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".diagnostics__item--error").first()).toContainText("radio");
  });

  test("downloads an SVG file when clicking the SVG export button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Sin errores.")).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "SVG" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("diagrama.svg");
  });

  test("downloads a PNG file when clicking the PNG export button (real round trip through the gateway)", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("Sin errores.")).toBeVisible({ timeout: 15_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "PNG" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("diagrama.png");
  });

  test("toggles between light and dark theme", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const initialTheme = await html.getAttribute("data-theme");

    await page.getByRole("button", { name: /Cambiar a tema/ }).click();

    await expect(html).not.toHaveAttribute("data-theme", initialTheme ?? "");
  });
});
