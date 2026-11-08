"use client";

import { Canvas, type CanvasApi, type CanvasPoint } from "@toyonix/web-kit/react";
import { useMemo, useRef, type Ref } from "react";
import type { OutlineShapes } from "@/engines/types";
import { prepareSvg } from "@/lib/svg";

interface OutlineCanvasProps {
  /** The outline's name, e.g. "switch_plate". */
  name: string;
  /** The outline's SVG file from the engine. */
  svg: string;
  /** Where the outline's parts are (from the same run as `svg`). */
  shapes: OutlineShapes | undefined;
  /** The selected part's name ("0", "1", … or its key), or null. */
  selected: string | null;
  onSelect: (part: string | null) => void;
  tool: "select" | "pan";
  /** The pointer's position in the engine's coordinates (mm, y up), or null when it leaves. */
  onCursorMove?: (point: CanvasPoint | null) => void;
  onZoom?: (scale: number) => void;
  ref?: Ref<CanvasApi>;
}

/** A click that moved less than this (px) is a click, not the end of a pan. */
const CLICK_SLOP = 4;

/** The inside of a prepared <svg>: its drawing, to place inside the canvas's own SVG. */
const drawingOf = (svg: string) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

/**
 * An outline on the canvas: the engine's drawing in ink, and each part on top as a target that
 * highlights under the pointer and selects on click. The selected part's placements are
 * shown in the accent color. Clicking empty space clears the selection.
 */
export function OutlineCanvas({
  name,
  svg,
  shapes,
  selected,
  onSelect,
  tool,
  onCursorMove,
  onZoom,
  ref,
}: OutlineCanvasProps) {
  const drawing = useMemo(() => {
    const prepared = prepareSvg(svg);
    return prepared ? drawingOf(prepared) : "";
  }, [svg]);
  const pressedAt = useRef<CanvasPoint | null>(null);
  const size = shapes?.size ?? { width: 0, height: 0 };
  const origin = shapes?.origin ?? { x: 0, y: 0 };

  return (
    <Canvas
      ref={ref}
      aria-label={`Outline ${name}`}
      bounds={{ x: 0, y: 0, width: size.width, height: size.height }}
      tool={tool}
      onViewChange={(view) => onZoom?.(view.scale)}
      onCursorMove={(point) =>
        onCursorMove?.(point ? { x: origin.x + point.x, y: origin.y - point.y } : null)
      }
      onPointerDown={(event) => {
        pressedAt.current = { x: event.clientX, y: event.clientY };
      }}
      onClick={(event) => {
        const from = pressedAt.current;
        if (from && Math.hypot(event.clientX - from.x, event.clientY - from.y) < CLICK_SLOP) onSelect(null);
      }}
    >
      {/* Safe: prepareSvg rebuilt the drawing from an allowlist of drawing elements. */}
      <g className="og-drawing" dangerouslySetInnerHTML={{ __html: drawing }} />
      {shapes?.parts.map((part) =>
        part.placements.map((placement, index) => (
          <path
            key={`${part.name}-${index}`}
            d={placement.path}
            className={part.name === selected ? "tx-canvas__selected" : "og-part"}
            data-part={part.name}
            aria-label={`Part ${part.name}${placement.point ? ` on ${placement.point}` : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(part.name);
            }}
          />
        )),
      )}
    </Canvas>
  );
}
