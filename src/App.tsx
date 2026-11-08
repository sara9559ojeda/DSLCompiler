import { lazy, Suspense } from "react";
import { useHashRoute } from "./routing/useHashRoute.js";

// Each view is its own chunk: the landing never pays for Monaco, and the studio never pays for Three.js.
const LandingPage = lazy(() => import("./landing/LandingPage.js"));
const StudioWorkspace = lazy(() => import("./studio/StudioWorkspace.js"));

function RouteFallback(): JSX.Element {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <span className="route-fallback__eye" aria-hidden="true" />
      <span className="visually-hidden">Cargando…</span>
    </div>
  );
}

export function App(): JSX.Element {
  const route = useHashRoute();
  return <Suspense fallback={<RouteFallback />}>{route === "studio" ? <StudioWorkspace /> : <LandingPage />}</Suspense>;
}
