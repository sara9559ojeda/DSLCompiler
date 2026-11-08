import { test, expect } from "@playwright/test";

test.describe("Landing", () => {
  test("shows the hero and the sculpture (3D or its static fallback)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("El código");
    await expect(page.locator(".sculpture")).toBeVisible();
  });

  test("the playground compiles for real and follows its controls", async ({ page }) => {
    await page.goto("/");
    await page.locator("#del-codigo-al-arte").scrollIntoViewIfNeeded();
    await expect(page.locator(".pg-canvas__svg svg")).toBeVisible({ timeout: 15_000 });
    const before = await page.locator(".pg-canvas__svg circle").count();
    await page.getByRole("slider").first().fill("6");
    await expect.poll(async () => page.locator(".pg-canvas__svg circle").count(), { timeout: 10_000 }).not.toBe(before);
  });

  test("a gallery example opens in the studio with its source code", async ({ page }) => {
    await page.goto("/");
    await page.locator(".gcard__button").first().click();
    await expect(page).toHaveURL(/#\/estudio/);
    await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 15_000 });
  });

  test("the call to action opens the studio", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Empezar a crear/ }).click();
    await expect(page).toHaveURL(/#\/estudio/);
  });

  test("without WebGL the static SVG sculpture is shown and nothing breaks", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
        return (original as (...args: unknown[]) => unknown).call(this, type, ...rest) as never;
      } as typeof original;
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await expect(page.locator(".sculpture")).toHaveAttribute("data-mode", "static");
    await expect(page.locator(".sculpture__fallback")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("prefers-reduced-motion: static sculpture, headline fully visible, no running animations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".sculpture")).toHaveAttribute("data-mode", "static");
    const transform = await page.locator(".lhero__title .editorial__text").first().evaluate((el) => getComputedStyle(el).transform);
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(transform);
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getTiming().iterations === Infinity).length);
    expect(running).toBe(0);
  });

  test("phone width: no horizontal scroll on the landing and the CTAs are reachable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Empezar a crear/ })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
