/**
 * What dragging a handle on the canvas does to a shape. Distances come in world coordinates
 * (y down, lib/world.ts); moves go out in engine coordinates (y up), ready for moveShape.
 */

type Point = { x: number; y: number };

/** Which handle: -1, 0 or 1 per axis (e.g. { x: 1, y: 0 } is the right edge). */
export interface HandleEdge {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
}

/**
 * How a rectangle changes when a handle is dragged by `delta`. It's placed from its center, so
 * it grows toward the handle and moves half as far, which keeps the opposite side put.
 */
export function resizeFromHandle(
  edge: HandleEdge,
  delta: Point,
): { grow: { width: number; height: number }; move: Point } {
  const width = edge.x * delta.x;
  const height = edge.y * delta.y;
  // "+ 0" turns a -0 (from multiplying by 0) into 0.
  return { grow: { width, height }, move: { x: (edge.x * width) / 2 + 0, y: -(edge.y * height) / 2 + 0 } };
}

/**
 * The corner radius that still fits a shape of `size`: Ergogen needs the radius to be at most
 * half the shorter side, so a shape shrunk past its corners takes its corners down with it (a
 * shrunk circle stays a circle).
 */
export function fittingCorner(corner: number, size: { width: number; height: number }): number {
  return Math.min(corner, size.width / 2, size.height / 2);
}

/**
 * A corner radius after dragging the top-left corner handle by `delta`: moving it in (right
 * and down) rounds more. Between 0 (square) and `max` (half the shorter side).
 */
export function radiusFromDrag(radius: number, delta: Point, max: number): number {
  return Math.min(max, Math.max(0, radius + (delta.x + delta.y) / 2));
}
