// Worker-safe: the compile worker imports this file, so it must not touch window/import.meta.env (app.config.ts does).

/** How long the editor waits after the last keystroke before triggering a compile (INP: keystrokes stay instant). */
export const COMPILE_DEBOUNCE_MS = 300;

/** Wall-clock budget for one compile inside the worker (the analyzer also has a deterministic step budget). */
export const COMPILE_DEADLINE_MS = 3000;
/** A newer compile replaces one still running after this long: the stuck worker is terminated and replaced. */
export const COMPILE_CANCEL_AFTER_MS = 250;
/** Hard limit before a compile is abandoned with a diagnostic. */
export const COMPILE_TIMEOUT_MS = 6000;
