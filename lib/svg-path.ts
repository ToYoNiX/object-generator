/**
 * Reading SVG path data (as written by makerjs) without a browser: the points a path goes
 * through, and the box around them. Used to place handles around a part on the canvas.
 */

export interface PathPoint {
  x: number;
  y: number;
}

/** How many numbers each command takes; its last two are the point it ends at. */
const ARGUMENTS: Record<string, number> = { M: 2, L: 2, T: 2, A: 7, C: 6, S: 4, Q: 4 };

/**
 * The end point of every drawing command in absolute path data (M, L, A, C, S, Q, T; Z
 * draws back to the start and adds none). Arc radii and flags are skipped. Arcs and curves can
 * bulge past their end points, so this bounds straight-sided shapes exactly and others roughly.
 */
export function pathPoints(d: string): PathPoint[] {
  const points: PathPoint[] = [];
  const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g) ?? [];
  for (const command of commands) {
    const letter = command[0]?.toUpperCase() ?? "";
    const size = ARGUMENTS[letter];
    if (!size) continue;
    const numbers = (command.slice(1).match(/-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi) ?? []).map(Number);
    // A command can repeat: "L 1 2 3 4" draws two lines.
    for (let i = 0; i + size <= numbers.length; i += size) {
      points.push({ x: numbers[i + size - 2] ?? 0, y: numbers[i + size - 1] ?? 0 });
    }
  }
  return points;
}

/** The box around a path's points, or null if it has none. */
export function pathBounds(d: string): { x: number; y: number; width: number; height: number } | null {
  const points = pathPoints(d);
  if (points.length === 0) return null;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}
