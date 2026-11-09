/**
 * The box around SVG path data (as written by makerjs: absolute and relative commands, arcs,
 * curves), without a browser. Used to place handles around a part on the canvas.
 */

export interface PathBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Point = { x: number; y: number };

/** How many numbers each command takes. */
const ARGUMENTS: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

/** Curves and arcs are traced at this many points each: plenty for a bounding box. */
const SAMPLES = 24;

/** Points along an SVG arc (endpoint form), following the SVG spec's conversion to its center. */
function arcPoints(
  from: Point,
  to: Point,
  rxIn: number,
  ryIn: number,
  degrees: number,
  large: boolean,
  sweep: boolean,
): Point[] {
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx === 0 || ry === 0) return [to];
  const phi = (degrees * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (from.x - to.x) / 2;
  const dy = (from.y - to.y) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  // Radii too small for the distance are scaled up, as browsers do.
  const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const numerator = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const denominator = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const coefficient = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, numerator / denominator));
  const cx1 = (coefficient * rx * y1) / ry;
  const cy1 = (-coefficient * ry * x1) / rx;
  const cx = cos * cx1 - sin * cy1 + (from.x + to.x) / 2;
  const cy = sin * cx1 + cos * cy1 + (from.y + to.y) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number) =>
    Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const start = angle(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
  let delta = angle((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  const points: Point[] = [];
  for (let i = 1; i <= SAMPLES; i++) {
    const a = start + (delta * i) / SAMPLES;
    points.push({
      x: cx + rx * Math.cos(a) * cos - ry * Math.sin(a) * sin,
      y: cy + rx * Math.cos(a) * sin + ry * Math.sin(a) * cos,
    });
  }
  return points;
}

/** Points along a quadratic or cubic Bézier curve, its start excluded. */
function curvePoints(controls: Point[]): Point[] {
  const points: Point[] = [];
  for (let i = 1; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    // De Casteljau: repeatedly blend neighbouring points until one is left.
    let level = controls;
    while (level.length > 1) {
      const previous = level;
      level = previous.slice(1).map((point, index) => {
        const before = previous[index] ?? point;
        return { x: before.x + (point.x - before.x) * t, y: before.y + (point.y - before.y) * t };
      });
    }
    if (level[0]) points.push(level[0]);
  }
  return points;
}

/** Every point the path passes through, with arcs and curves traced along their length. */
function tracePath(d: string): Point[] {
  const points: Point[] = [];
  let current: Point = { x: 0, y: 0 };
  let subpathStart: Point = current;
  for (const command of d.match(/[a-zA-Z][^a-zA-Z]*/g) ?? []) {
    const letter = command[0] ?? "";
    const upper = letter.toUpperCase();
    const relative = letter !== upper;
    const size = ARGUMENTS[upper];
    if (size === undefined) continue;
    if (upper === "Z") {
      current = subpathStart;
      continue;
    }
    const numbers = (command.slice(1).match(/-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi) ?? []).map(Number);
    // A command can repeat: "L 1 2 3 4" draws two lines; after "M", extra pairs are lines.
    for (let i = 0; i + size <= numbers.length; i += size) {
      const n = (k: number) => numbers[i + k] ?? 0;
      const from = current;
      const at = (x: number, y: number): Point => (relative ? { x: from.x + x, y: from.y + y } : { x, y });
      let next: Point;
      switch (upper) {
        case "H":
          next = { x: relative ? from.x + n(0) : n(0), y: from.y };
          points.push(next);
          break;
        case "V":
          next = { x: from.x, y: relative ? from.y + n(0) : n(0) };
          points.push(next);
          break;
        case "C":
          next = at(n(4), n(5));
          points.push(...curvePoints([from, at(n(0), n(1)), at(n(2), n(3)), next]));
          break;
        case "Q":
          next = at(n(2), n(3));
          points.push(...curvePoints([from, at(n(0), n(1)), next]));
          break;
        case "S":
          // The reflected control point isn't tracked; the end points bound these closely enough.
          next = at(n(2), n(3));
          points.push(at(n(0), n(1)), next);
          break;
        case "A":
          next = at(n(5), n(6));
          points.push(...arcPoints(from, next, n(0), n(1), n(2), n(3) !== 0, n(4) !== 0));
          break;
        default:
          // M, L, T
          next = at(n(0), n(1));
          points.push(next);
          if (upper === "M" && i === 0) subpathStart = next;
      }
      current = next;
    }
  }
  return points;
}

/** The box around a path, or null if it draws nothing. */
export function pathBounds(d: string): PathBox | null {
  const points = tracePath(d);
  if (points.length === 0) return null;
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}
