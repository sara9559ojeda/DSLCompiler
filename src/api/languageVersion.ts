import { LANGUAGE_VERSION } from "@saramariaojeda9559/compiler-core";
import { GATEWAY_URL } from "../config/app.config.js";

export type VersionStatus =
  | { readonly kind: "checking" }
  | { readonly kind: "match"; readonly version: string }
  | { readonly kind: "mismatch"; readonly local: string; readonly backend: string }
  /** The backend could not be asked (offline, cold start): not an error, the local compiler keeps working. */
  | { readonly kind: "unknown"; readonly local: string };

/** The language the Web Worker compiles with: the one bundled into this frontend. */
export const LOCAL_LANGUAGE_VERSION: string = LANGUAGE_VERSION;

export function compareLanguageVersions(local: string, backend: string | undefined): VersionStatus {
  if (backend === undefined) return { kind: "unknown", local };
  return local === backend ? { kind: "match", version: local } : { kind: "mismatch", local, backend };
}

/**
 * Asks the backend which language version it validates and exports with
 * (`/api/ai/health` → `languageVersion`). A mismatch means the preview (Web
 * Worker) and the exports/AI could disagree about what a program means.
 */
export async function checkLanguageVersion(fetchImpl: typeof fetch | undefined = globalThis.fetch): Promise<VersionStatus> {
  if (!fetchImpl) return { kind: "unknown", local: LOCAL_LANGUAGE_VERSION };
  try {
    const response = await fetchImpl(`${GATEWAY_URL}/api/ai/health`);
    if (!response.ok) return compareLanguageVersions(LOCAL_LANGUAGE_VERSION, undefined);
    const body = (await response.json()) as { languageVersion?: unknown };
    return compareLanguageVersions(LOCAL_LANGUAGE_VERSION, typeof body.languageVersion === "string" ? body.languageVersion : undefined);
  } catch {
    return compareLanguageVersions(LOCAL_LANGUAGE_VERSION, undefined);
  }
}
