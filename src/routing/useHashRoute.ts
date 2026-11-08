import { useSyncExternalStore } from "react";

/**
 * Two views, no router dependency: the landing (default) and the studio
 * (`#/estudio`). In-page anchors of the landing (`#galeria`…) are plain hashes
 * that don't start with `#/`, so they never switch the view.
 */
export type Route = "landing" | "studio";

export const STUDIO_HASH = "#/estudio";

export function routeFromHash(hash: string): Route {
  return hash.startsWith(STUDIO_HASH) ? "studio" : "landing";
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export function useHashRoute(): Route {
  return useSyncExternalStore(
    subscribe,
    () => routeFromHash(window.location.hash),
    () => "landing",
  );
}

/** Switches view; the landing view resets the hash so the page starts at the top. */
export function navigate(route: Route): void {
  if (route === "studio") {
    window.location.hash = STUDIO_HASH;
  } else {
    window.history.pushState(null, "", window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    window.scrollTo({ top: 0 });
  }
}
