interface RuntimeConfig {
  readonly GATEWAY_URL?: string;
}

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

/**
 * Resolution order: runtime config (injected by docker/runtime-config-entrypoint.sh
 * at container start — same built image, any deploy target, no rebuild) →
 * build-time Vite env var → localhost default for `npm run dev`.
 * Guards against the template's literal "${GATEWAY_URL}" when the
 * entrypoint never ran (e.g. opening dist/ directly, no Docker).
 */
function resolveGatewayUrl(): string {
  const runtimeValue = window.__RUNTIME_CONFIG__?.GATEWAY_URL;
  if (runtimeValue && !runtimeValue.startsWith("${")) {
    return runtimeValue;
  }
  return import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:4000";
}

/** All tunable frontend constants live here — nothing below reads process.env/import.meta.env directly. */
export const GATEWAY_URL: string = resolveGatewayUrl();

/** How long the editor waits after the last keystroke before triggering a compile (INP: keystrokes stay instant). */
export const COMPILE_DEBOUNCE_MS = 300;

export const SVG_EXPORT_FILENAME = "diagrama.svg";
export const PNG_EXPORT_FILENAME = "diagrama.png";

export const BRAND_NAME = "Compilador de Imágenes";

/** localStorage key for the export history panel — see useExportHistoryStore.ts. */
export const EXPORT_HISTORY_STORAGE_KEY = "compiler-img:export-history";
/** Oldest entries are dropped once the list grows past this, to keep localStorage bounded (PNG entries embed a base64 data URL). */
export const EXPORT_HISTORY_MAX_ENTRIES = 8;

/** localStorage key marking that the guide's welcome tip was already shown once — see useGuideTips.ts. */
export const GUIDE_WELCOME_SEEN_KEY = "compiler-img:guide-welcome-seen";
/** How long after mount the welcome tip appears — gives the editor a beat to render first. */
export const GUIDE_WELCOME_DELAY_MS = 1200;

export const DEFAULT_DSL_SOURCE = [
  "c1 = crear_circulo(radio=50, color=rojo, x=100, y=100);",
  "r1 = crear_rectangulo(ancho=80, alto=40, color=azul, x=200, y=150);",
  "t1 = crear_texto(contenido=\"Hola\", x=50, y=50, color=negro);",
  "conectar(c1, r1, tipo=flecha);",
  "",
].join("\n");
