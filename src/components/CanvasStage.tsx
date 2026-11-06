import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { HandleId, Point } from "@saramariaojeda9559/compiler-core";
import { applyVisualEdit } from "../editing/applyVisualEdit.js";
import { findTarget, isMovable, localDelta, overlayFor, planMove, planResize } from "../editing/visualEdit.js";
import { redoEdit, selectSpan, undoEdit } from "../editor/editorBridge.js";
import { useEditorStore } from "../state/useEditorStore.js";

/** Pointer travel (screen px) before a press becomes a drag: a plain click never edits the source. */
const DRAG_THRESHOLD_PX = 3;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;
const NUDGE = 1;
const NUDGE_SHIFT = 10;
const NUDGE_FLUSH_MS = 160;

interface View {
  readonly scale: number;
  readonly x: number;
  readonly y: number;
}

type Gesture =
  | { readonly kind: "pan"; readonly startX: number; readonly startY: number; readonly view: View }
  | { readonly kind: "move"; readonly id: string; readonly start: Point; moved: boolean }
  | { readonly kind: "resize"; readonly id: string; readonly handle: HandleId; moved: boolean };

type Preview =
  | { readonly kind: "move"; readonly id: string; readonly delta: Point }
  | { readonly kind: "resize"; readonly id: string; readonly params: Record<string, number> };

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/**
 * The interactive preview. The compiled SVG is shown as-is and an overlay SVG
 * with the same coordinate system sits on top for the selection box and
 * handles. Dragging only moves the live element (an SVG transform) and the
 * overlay; the source is touched once, on release, through the same minimal
 * edits the inspector uses — so nothing recompiles mid-drag.
 */
export function CanvasStage(): JSX.Element {
  const svg = useEditorStore((s) => (s.result?.success ? s.result.svg : null));
  const scene = useEditorStore((s) => s.inspection?.scene ?? null);
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.select);
  const refusal = useEditorStore((s) => s.editRefusal);
  const setEditRefusal = useEditorStore((s) => s.setEditRefusal);

  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const spaceRef = useRef(false);
  const nudgeRef = useRef<{ dx: number; dy: number; timer: number | undefined; tries: number }>({
    dx: 0,
    dy: 0,
    timer: undefined,
    tries: 0,
  });

  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const [autoFit, setAutoFit] = useState(true);
  const [preview, setPreview] = useState<Preview | null>(null);

  const canvas = scene?.canvas ?? { width: 800, height: 600 };
  const selected = scene ? findTarget(scene, selectedId) : null;

  // ── Fit / zoom ────────────────────────────────────────────────────────────
  const fit = useCallback((): View => {
    const viewport = viewportRef.current;
    if (!viewport) return { scale: 1, x: 0, y: 0 };
    const padding = 24;
    const scale = clamp(
      Math.min((viewport.clientWidth - padding * 2) / canvas.width, (viewport.clientHeight - padding * 2) / canvas.height),
      MIN_ZOOM,
      2,
    );
    return { scale, x: (viewport.clientWidth - canvas.width * scale) / 2, y: (viewport.clientHeight - canvas.height * scale) / 2 };
  }, [canvas.width, canvas.height]);

  useLayoutEffect(() => {
    if (autoFit) setView(fit());
  }, [autoFit, fit, svg === null]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      if (autoFit && gestureRef.current === null) setView(fit());
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [autoFit, fit]);

  const zoomAround = useCallback((factor: number, anchor?: Point) => {
    setAutoFit(false);
    setView((current) => {
      const viewport = viewportRef.current;
      const center = anchor ?? { x: (viewport?.clientWidth ?? 0) / 2, y: (viewport?.clientHeight ?? 0) / 2 };
      const scale = clamp(current.scale * factor, MIN_ZOOM, MAX_ZOOM);
      const ratio = scale / current.scale;
      return { scale, x: center.x - (center.x - current.x) * ratio, y: center.y - (center.y - current.y) * ratio };
    });
  }, []);

  // React's onWheel is passive and can't stop the page from scrolling.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      zoomAround(Math.exp(-event.deltaY * 0.0015), { x: event.clientX - rect.left, y: event.clientY - rect.top });
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [zoomAround]);

  // ── Coordinates ───────────────────────────────────────────────────────────
  const toCanvas = (event: { clientX: number; clientY: number }): Point => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (event.clientX - rect.left) / view.scale, y: (event.clientY - rect.top) / view.scale };
  };

  // ── Live feedback on the real element ────────────────────────────────────
  const liveElement = useCallback((id: string): SVGElement | null => {
    const nodes = artRef.current?.querySelectorAll<SVGElement>("[data-shape-id]") ?? [];
    for (const node of nodes) if (node.dataset.shapeId === id) return node;
    return null;
  }, []);

  const showLive = useCallback(
    (id: string, canvasDelta: Point) => {
      const element = liveElement(id);
      if (!element || !scene) return;
      if (element.dataset.baseTransform === undefined) element.dataset.baseTransform = element.getAttribute("transform") ?? "";
      const local = localDelta(scene, id, canvasDelta);
      const base = element.dataset.baseTransform;
      element.setAttribute("transform", `translate(${local.x} ${local.y})${base ? ` ${base}` : ""}`);
    },
    [liveElement, scene],
  );

  const resetLive = useCallback(
    (id: string) => {
      const element = liveElement(id);
      if (!element || element.dataset.baseTransform === undefined) return;
      const base = element.dataset.baseTransform;
      if (base) element.setAttribute("transform", base);
      else element.removeAttribute("transform");
      delete element.dataset.baseTransform;
    },
    [liveElement],
  );

  // A fresh compile replaces the DOM and the scene: any drag preview is obsolete.
  useEffect(() => setPreview(null), [scene]);

  // ── Commit ────────────────────────────────────────────────────────────────
  const commitMove = useCallback(
    (id: string, delta: Point): void => {
      if (!scene) return;
      const request = planMove(scene, id, delta);
      if (!request) return;
      if (applyVisualEdit(request) !== "applied") {
        resetLive(id);
        setPreview(null);
      }
    },
    [scene, resetLive],
  );

  const flushNudge = useCallback((): void => {
    const pending = nudgeRef.current;
    pending.timer = undefined;
    const id = useEditorStore.getState().selectedId;
    if (!id || (pending.dx === 0 && pending.dy === 0)) return;
    const { source, compiledSource } = useEditorStore.getState();
    // The previous edit is still compiling: its offsets would be stale. Wait, but not forever.
    if (source !== compiledSource && pending.tries++ < 20) {
      pending.timer = window.setTimeout(flushNudge, NUDGE_FLUSH_MS);
      return;
    }
    const delta = { x: pending.dx, y: pending.dy };
    pending.dx = 0;
    pending.dy = 0;
    pending.tries = 0;
    commitMove(id, delta);
  }, [commitMove]);

  useEffect(() => () => window.clearTimeout(nudgeRef.current.timer), []);

  // ── Pointer gestures ─────────────────────────────────────────────────────
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0 && event.button !== 1) return;
    const target = event.target as Element;
    viewportRef.current?.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);

    const handleId = target.closest<SVGElement>("[data-handle]")?.dataset.handle as HandleId | undefined;
    if (handleId && selectedId && event.button === 0) {
      gestureRef.current = { kind: "resize", id: selectedId, handle: handleId, moved: false };
      return;
    }

    const shapeId = target.closest<SVGElement>("[data-shape-id]")?.dataset.shapeId;
    if (shapeId && event.button === 0 && !spaceRef.current) {
      if (shapeId !== selectedId) select(shapeId, "canvas");
      else setEditRefusal(null);
      gestureRef.current = { kind: "move", id: shapeId, start: toCanvas(event), moved: false };
      return;
    }

    if (event.button === 0 && !spaceRef.current) select(null);
    setAutoFit(false);
    gestureRef.current = { kind: "pan", startX: event.clientX, startY: event.clientY, view };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const gesture = gestureRef.current;
    if (!gesture || !scene) return;

    if (gesture.kind === "pan") {
      setView({
        ...gesture.view,
        x: gesture.view.x + event.clientX - gesture.startX,
        y: gesture.view.y + event.clientY - gesture.startY,
      });
      return;
    }

    const point = toCanvas(event);
    if (gesture.kind === "move") {
      const delta = { x: point.x - gesture.start.x, y: point.y - gesture.start.y };
      if (!gesture.moved && Math.hypot(delta.x, delta.y) * view.scale < DRAG_THRESHOLD_PX) return;
      const shape = findTarget(scene, gesture.id);
      if (shape?.kind !== "shape" || !isMovable(shape.shape)) return;
      gesture.moved = true;
      showLive(gesture.id, delta);
      setPreview({ kind: "move", id: gesture.id, delta });
      return;
    }

    const request = planResize(scene, gesture.id, gesture.handle, point);
    if (request?.kind !== "setParams") return;
    gesture.moved = true;
    setPreview({ kind: "resize", id: gesture.id, params: request.params as Record<string, number> });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>): void => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!gesture || !scene || gesture.kind === "pan" || !gesture.moved) return;

    if (gesture.kind === "move") {
      const point = toCanvas(event);
      commitMove(gesture.id, { x: point.x - gesture.start.x, y: point.y - gesture.start.y });
      return;
    }
    const request = planResize(scene, gesture.id, gesture.handle, toCanvas(event));
    if (!request || applyVisualEdit(request) !== "applied") setPreview(null);
  };

  const onPointerCancel = (): void => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (gesture && gesture.kind !== "pan") resetLive(gesture.id);
    setPreview(null);
  };

  // ── Keyboard ──────────────────────────────────────────────────────────────
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const mod = event.ctrlKey || event.metaKey;
    if (event.key === " ") {
      spaceRef.current = true;
      event.preventDefault();
      return;
    }
    if (mod && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redoEdit();
      else undoEdit();
      return;
    }
    if (mod && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redoEdit();
      return;
    }
    if (event.key === "+" || event.key === "=") return void zoomAround(1.25);
    if (event.key === "-") return void zoomAround(0.8);
    if (event.key === "0") return void setAutoFit(true);
    if (event.key === "Escape") return void select(null);

    if (!selectedId) return;
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      applyVisualEdit({ kind: "delete", targetId: selectedId });
      return;
    }
    const step = event.shiftKey ? NUDGE_SHIFT : NUDGE;
    const direction: Record<string, Point> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    };
    const arrow = direction[event.key];
    if (!arrow) return;
    event.preventDefault();
    const pending = nudgeRef.current;
    pending.dx += arrow.x;
    pending.dy += arrow.y;
    showLive(selectedId, { x: pending.dx, y: pending.dy });
    setPreview({ kind: "move", id: selectedId, delta: { x: pending.dx, y: pending.dy } });
    window.clearTimeout(pending.timer);
    pending.timer = window.setTimeout(flushNudge, NUDGE_FLUSH_MS);
  };

  // ── Overlay ───────────────────────────────────────────────────────────────
  const overlay = useMemo(() => {
    if (selected?.kind !== "shape" || !scene) return null;
    const override = preview?.kind === "resize" && preview.id === selected.shape.id ? preview.params : {};
    const geometry = overlayFor(scene, selected.shape, override);
    if (!geometry) return null;
    const shift = preview?.kind === "move" && preview.id === selected.shape.id ? preview.delta : { x: 0, y: 0 };
    return { geometry, shift };
  }, [selected, scene, preview]);

  const handleSize = 8 / view.scale;
  const percent = Math.round(view.scale * 100);

  return (
    <div className="canvas-stage">
      <div className="canvas-stage__toolbar" role="toolbar" aria-label="Controles del lienzo">
        <button type="button" onClick={() => zoomAround(0.8)} aria-label="Alejar" title="Alejar (-)">
          −
        </button>
        <span className="canvas-stage__zoom" aria-live="off">
          {percent}%
        </span>
        <button type="button" onClick={() => zoomAround(1.25)} aria-label="Acercar" title="Acercar (+)">
          +
        </button>
        <button type="button" onClick={() => setAutoFit(true)} title="Ajustar a la vista (0)">
          Ajustar
        </button>
        <span className="canvas-stage__sep" aria-hidden="true" />
        <button type="button" onClick={undoEdit} title="Deshacer (Ctrl+Z)">
          Deshacer
        </button>
        <button type="button" onClick={redoEdit} title="Rehacer (Ctrl+Y)">
          Rehacer
        </button>
      </div>

      {svg ? (
        <div
          ref={viewportRef}
          className="canvas-stage__viewport"
          tabIndex={0}
          role="application"
          aria-label="Lienzo editable. Haz clic en una figura para seleccionarla, arrástrala para moverla y usa las flechas para ajustarla. Suprimir la elimina."
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onKeyDown={onKeyDown}
          onKeyUp={(event) => {
            if (event.key === " ") spaceRef.current = false;
          }}
        >
          <div
            ref={stageRef}
            className="canvas-stage__stage"
            style={{
              width: canvas.width,
              height: canvas.height,
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            }}
          >
            <div ref={artRef} className="canvas-stage__art" dangerouslySetInnerHTML={{ __html: svg }} />
            <svg className="canvas-stage__overlay" viewBox={`0 0 ${canvas.width} ${canvas.height}`} aria-hidden="true">
              {overlay && (
                <g transform={`translate(${overlay.shift.x} ${overlay.shift.y})`}>
                  <polygon
                    className="canvas-stage__box"
                    points={overlay.geometry.corners.map((corner) => `${corner.x},${corner.y}`).join(" ")}
                    strokeWidth={1.5 / view.scale}
                    strokeDasharray={`${4 / view.scale} ${3 / view.scale}`}
                  />
                  {overlay.geometry.handles.map((handle) => (
                    <rect
                      key={handle.id}
                      className="canvas-stage__handle"
                      data-handle={handle.id}
                      x={handle.point.x - handleSize / 2}
                      y={handle.point.y - handleSize / 2}
                      width={handleSize}
                      height={handleSize}
                      strokeWidth={1.5 / view.scale}
                    />
                  ))}
                </g>
              )}
            </svg>
          </div>
        </div>
      ) : (
        <p className="preview-panel__empty">Corrige los errores para ver la previsualización.</p>
      )}

      {refusal && (
        <div className="canvas-stage__notice" role="status">
          <span>{refusal.message}</span>
          {refusal.span && (
            <button type="button" onClick={() => selectSpan(refusal.span!, true)}>
              Ir al código
            </button>
          )}
          <button type="button" onClick={() => setEditRefusal(null)} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
