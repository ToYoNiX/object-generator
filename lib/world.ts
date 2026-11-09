import type { OutlineShapes, Reference } from "@/engines/types";

/**
 * The canvas's world: the engine's coordinates (mm) with y flipped, since the engine's y points
 * up and SVG's points down. Everything (outlines, keys) is placed in it, so a part that moves
 * moves relative to the keys around it.
 */

export interface WorldBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Where an outline's drawing (its SVG, starting at 0, 0) goes in the world. */
export function drawingOffset(shapes: OutlineShapes): { x: number; y: number } {
  return { x: shapes.origin.x, y: -shapes.origin.y };
}

/** The SVG transform that puts a reference (drawn centered on 0, 0) in its place. */
export function referenceTransform(reference: Reference): string {
  // The engine turns counter-clockwise with y up; flipped, that's clockwise in SVG.
  return `translate(${reference.x} ${-reference.y}) rotate(${-reference.r})`;
}

/** The area holding the references and the outline, for fitting the view. */
export function worldBounds(references: Reference[], shapes: OutlineShapes | undefined): WorldBounds {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const reference of references) {
    const angle = (reference.r * Math.PI) / 180;
    for (const [dx, dy] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ] as const) {
      const cx = (dx * reference.width) / 2;
      const cy = (dy * reference.height) / 2;
      xs.push(reference.x + cx * Math.cos(angle) - cy * Math.sin(angle));
      ys.push(-(reference.y + cx * Math.sin(angle) + cy * Math.cos(angle)));
    }
  }
  if (shapes) {
    const offset = drawingOffset(shapes);
    xs.push(offset.x, offset.x + shapes.size.width);
    ys.push(offset.y, offset.y + shapes.size.height);
  }
  if (xs.length === 0) return { x: 0, y: 0, width: 100, height: 100 };
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}
