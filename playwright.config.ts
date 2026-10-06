import { defineConfig, devices } from "@playwright/test";

/**
 * Runs against an already-running stack (docker-compose, or `npm run dev` +
 * the backend services) — it does not start a dev server itself, since the
 * point is to exercise the real build (or the real gateway) end to end.
 * Override with E2E_BASE_URL, e.g. http://localhost:5173 for a local dev run.
 */
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
});
