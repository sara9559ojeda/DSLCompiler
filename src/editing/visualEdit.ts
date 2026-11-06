import {
  handlesFor,
  moveParams,
  resizeParams,
  shapeBox,
  toCanvasSpace,
  toLocalSpace,
  vectorToLocal,
  type EditRequest,
  type HandleId,
  type Point,
  type ResolvedGroup,
  type ResolvedShape,
  type Scene,
  type SourceOrigin,
} from "@saramariaojeda9559/compiler-core";

/**
 * The pure half of the visual editor: scene lookups, drag → parameter
 * changes, and the geometry of the selection overlay. No DOM, no Monaco, so
 * all of it is unit-tested. The component only turns pointer events into the
 * numbers these functions take.
 */
export type SceneTarget =
  | { readonly kind: "shape"; readonly shape: ResolvedShape; readonly origin: SourceOrigin | undefined }
  | { readonly kind: "group"; readonly group: ResolvedGroup; readonly origin: SourceOrigin | undefined };

export function groupMap(scene: Scene): ReadonlyMap<string, ResolvedGroup> {
  return new Map((scene.groups ?? []).map((group) => [group.id, group]));
}

export function findTarget(scene: Scene, id: string | null): SceneTarget | null {
  if (id === null) return null;
  const shape = scene.shapes.find((candidate) => candidate.id === id);
  if (shape) return { kind: "shape", shape, origin: shape.origin };
  const group = scene.groups?.find((candidate) => candidate.id === id);
  return group ? { kind: "group", group, origin: group.origin } : null;
}

/**
 * The element a cursor at `offset` is "on": the innermost statement that
 * contains it. A loop's shapes all share one statement, so the first
 * instance stands for it (editing is refused for shared sites anyway, and the
 * inspector explains why).
 */
export function findTargetAtOffset(scene: Scene, offset: number): string | null {
  let best: { id: string; size: number } | null = null;
  const consider = (id: string, origin: SourceOrigin | undefined): void => {
    if (!origin) return;
    const { start, end } = origin.statementSpan;
    if (offset < start || offset > end) return;
    const size = end - start;
    if (!best || size < best.size) best = { id, size };
  };
  for (const shape of scene.shapes) consider(shape.id, shape.origin);
  for (const group of scene.groups ?? []) consider(group.id, group.origin);
  return (best as { id: string } | null)?.id ?? null;
}

const roundTo = (value: number): number => Math.round(value * 100) / 100;

/** Moving a shape by a drag measured on the canvas. The change is expressed in the shape's own (possibly grouped) space. */
export function planMove(scene: Scene, shapeId: string, canvasDelta: Point): EditRequest | null {
  const target = findTarget(scene, shapeId);
  if (target?.kind !== "shape") return null;
  const local = vectorToLocal(canvasDelta, target.shape.groupId, groupMap(scene));
  const params = moveParams(target.shape, local.x, local.y);
  return Object.keys(params).length === 0 ? null : { kind: "setParams", targetId: shapeId, params: roundParams(params) };
}

/** The local-space displacement for a canvas drag: what the CSS transform on the live element needs. */
export function localDelta(scene: Scene, shapeId: string, canvasDelta: Point): Point {
  const target = findTarget(scene, shapeId);
  if (target?.kind !== "shape") return canvasDelta;
  return vectorToLocal(canvasDelta, target.shape.groupId, groupMap(scene));
}

/** Resizing by dragging `handle` to a canvas point. */
export function planResize(scene: Scene, shapeId: string, handle: HandleId, canvasPoint: Point): EditRequest | null {
  const target = findTarget(scene, shapeId);
  if (target?.kind !== "shape") return null;
  const local = toLocalSpace(canvasPoint, target.shape.groupId, groupMap(scene));
  const params = resizeParams(target.shape, handle, local);
  return Object.keys(params).length === 0 ? null : { kind: "setParams", targetId: shapeId, params: roundParams(params) };
}

function roundParams(params: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(params).map(([name, value]) => [name, roundTo(value)]));
}

export interface OverlayGeometry {
  /** The shape's box as a polygon in canvas space (4 corners; a rotated/scaled group makes it a parallelogram). */
  readonly corners: readonly Point[];
  readonly handles: readonly { readonly id: HandleId; readonly point: Point }[];
}

/** Selection box and handles for `shape`, optionally as it would be with `override` params applied (live drag preview). */
export function overlayFor(
  scene: Scene,
  shape: ResolvedShape,
  override: Readonly<Record<string, number>> = {},
): OverlayGeometry | null {
  const previewed: ResolvedShape = { ...shape, params: { ...shape.params, ...override } };
  const box = shapeBox(previewed);
  if (!box) return null;
  const groups = groupMap(scene);
  const toCanvas = (point: Point): Point => toCanvasSpace(point, shape.groupId, groups);
  return {
    corners: [
      toCanvas({ x: box.x, y: box.y }),
      toCanvas({ x: box.x + box.width, y: box.y }),
      toCanvas({ x: box.x + box.width, y: box.y + box.height }),
      toCanvas({ x: box.x, y: box.y + box.height }),
    ],
    handles: handlesFor(previewed).map((handle) => ({ id: handle.id, point: toCanvas(handle) })),
  };
}

/** Whether a shape kind can be dragged/resized at all (a `texto` can be moved but has no resize handles). */
export const isMovable = (shape: ResolvedShape): boolean => Object.keys(moveParams(shape, 0, 0)).length > 0;
