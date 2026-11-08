import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { SculptureFallback } from "./SculptureFallback.js";
import { canUseWebGL, isLowPowerDevice, isSmallScreen, prefersReducedMotion } from "./webgl.js";

// Three.js is its own chunk: the landing's text and the static sculpture paint first.
const SculptureCanvas = lazy(() => import("./scene/SculptureCanvas.js"));

class SceneBoundary extends Component<{ readonly onError: () => void; readonly children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  override componentDidCatch(): void {
    this.props.onError();
  }
  override render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}

type Mode = "static" | "3d";

/**
 * Decides between the interactive 3D scene and the static SVG. The 3D scene is
 * used only when WebGL exists, the device isn't low-power and motion isn't
 * reduced (the user can still opt in); it renders only while on screen.
 */
export function HeroSculpture(): JSX.Element {
  const host = useRef<HTMLDivElement>(null);
  const [reduced] = useState(prefersReducedMotion);
  const [optedIn, setOptedIn] = useState(false);
  const [failed, setFailed] = useState(false);
  const [capable] = useState(() => canUseWebGL() && !isLowPowerDevice());
  const [lite] = useState(isSmallScreen);
  const [visible, setVisible] = useState(true);
  // The 3D chunk is fetched/parsed only once the browser is idle, so the headline reveal and first paint never wait for it.
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const schedule = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 400));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = schedule(() => setIdle(true), { timeout: 1500 } as IdleRequestOptions);
    return () => cancel(handle as number);
  }, []);

  const wants3d = capable && !failed && (!reduced || optedIn);
  const mode: Mode = wants3d ? "3d" : "static";

  useEffect(() => {
    const element = host.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? true), { threshold: 0.05 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sculpture" ref={host} data-mode={mode}>
      {mode === "3d" && idle ? (
        <SceneBoundary onError={() => setFailed(true)}>
          <Suspense fallback={<SculptureFallback />}>
            <SculptureCanvas active={visible} lite={lite} onFailure={() => setFailed(true)} />
          </Suspense>
        </SceneBoundary>
      ) : (
        <SculptureFallback />
      )}
      {mode === "3d" ? <p className="sculpture__hint">Arrastra · la escultura te sigue</p> : null}
      {mode === "static" && reduced && capable && !failed ? (
        <button type="button" className="sculpture__optin" onClick={() => setOptedIn(true)}>
          Activar escultura 3D
        </button>
      ) : null}
    </div>
  );
}
