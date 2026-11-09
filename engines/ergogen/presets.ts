import type { CanvasPoint } from "@toyonix/web-kit/react";
import { formatNumber } from "@/lib/yaml-edit";

/** A shape the Add shape menu can add. */
export interface ShapePreset {
  id: "rectangle" | "rounded" | "circle" | "pill";
  label: string;
  description: string;
  /** The YAML part, placed at `at` (engine coordinates, mm). */
  part: (at: CanvasPoint) => Record<string, unknown>;
}

/** Placed by its shift from the origin (no `where`), so it lands where the user is looking. */
const at = (point: CanvasPoint) => ({
  adjust: { shift: [Number(formatNumber(point.x)), Number(formatNumber(point.y))] },
});

export const SHAPE_PRESETS: ShapePreset[] = [
  {
    id: "rectangle",
    label: "Rectangle",
    description: "20 × 20 mm, square corners",
    part: (point) => ({ what: "rectangle", ...at(point), size: [20, 20] }),
  },
  {
    id: "rounded",
    label: "Rounded rectangle",
    description: "20 × 20 mm, 3 mm corners",
    part: (point) => ({ what: "rectangle", ...at(point), size: [20, 20], corner: 3 }),
  },
  {
    // A square whose corners are half its side: Ergogen draws it as a circle, and it resizes
    // and rounds with the same handles as any rectangle.
    id: "circle",
    label: "Circle",
    description: "10 mm across",
    part: (point) => ({ what: "rectangle", ...at(point), size: [10, 10], corner: 5 }),
  },
  {
    id: "pill",
    label: "Pill / slot",
    description: "30 × 10 mm, round ends",
    part: (point) => ({ what: "rectangle", ...at(point), size: [30, 10], corner: 5 }),
  },
];
