interface NavigatorHints extends Navigator {
  readonly deviceMemory?: number;
  readonly connection?: { readonly saveData?: boolean };
}

/** True when the browser can create a WebGL context at all (the 3D sculpture needs one). */
export function canUseWebGL(): boolean {
  try {
    if (typeof window === "undefined" || !("WebGLRenderingContext" in window)) return false;
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Devices where an always-running 3D scene isn't worth it: little memory/CPU, or the user asked to save data. */
export function isLowPowerDevice(): boolean {
  const hints = navigator as NavigatorHints;
  return (
    (hints.deviceMemory !== undefined && hints.deviceMemory <= 2) ||
    (hints.hardwareConcurrency !== undefined && hints.hardwareConcurrency <= 2) ||
    hints.connection?.saveData === true
  );
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function isSmallScreen(): boolean {
  try {
    return window.matchMedia("(max-width: 700px)").matches;
  } catch {
    return false;
  }
}
