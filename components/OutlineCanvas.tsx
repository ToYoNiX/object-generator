"use client";

import {
  Canvas,
  CanvasCornerHandle,
  CanvasLabel,
  CanvasResizeHandle,
  useCanvas,
  useCanvasDrag,
  type CanvasApi,
  type CanvasPoint,
} from "@toyonix/web-kit/react";
import { useMemo, useRef, useState, type Ref } from "react";
import type { OutlineShapes, PlacedPart, Placement, Reference } from "@/engines/types";
import { fittingCorner, radiusFromDrag, resizeFromHandle, type HandleEdge } from "@/lib/handles";
import { prepareSvg } from "@/lib/svg";
import { pathBounds } from "@/lib/svg-path";
import { drawingOffset, referenceTransform, worldBounds } from "@/lib/world";
import { formatNumber } from "@/lib/yaml-edit";

/** How the placement being edited sits: its rotation in degrees, and whether it's mirrored. */
type Frame = { r: number; mirrored: boolean };

/**
 * Edits the canvas asks for. Each is checked by the engine before the YAML changes, and resolves
 * to whether it was made (false: put things back).
 */
export interface CanvasEdits {
  /** Move by `delta` (engine coordinates: mm, y up). */
  move: (part: string, delta: CanvasPoint, frame: Frame) => Promise<boolean>;
  /**
   * Grow by `grow` (mm), and move by `move` so the opposite side stays put. `corner` is set when
   * the corner radius has to shrink to still fit the smaller shape.
   */
  resize: (
    part: string,
    grow: { width: number; height: number },
    move: CanvasPoint,
    frame: Frame,
    corner?: number,
  ) => Promise<boolean>;
  /** Set a rectangle's corner radius (mm; 0 for square corners). */
  corner: (part: string, radius: number) => Promise<boolean>;
}

/** What the canvas needs to know about the selected part beyond its outline. */
export interface SelectedInfo {
  /** Rectangles get handles; other kinds can only be moved. */
  what: string;
  /** The rectangle's corner radius, if it's a plain number (0 otherwise). */
  corner: number;
}

interface OutlineCanvasProps {
  /** The outline's name, e.g. "switch_plate". */
  name: string;
  /** The outline's SVG file from the engine. */
  svg: string;
  /** Where the outline's parts are (from the same run as `svg`). */
  shapes: OutlineShapes | undefined;
  /** Drawn faintly behind the outline (the keys), so moves show against something fixed. */
  references: Reference[];
  /** Changes whenever a generation finishes: a dropped preview stays until then. */
  revision: number;
  /** The selected part's name ("0", "1", … or its key), or null. */
  selected: string | null;
  /** Which of its placements was clicked: the handles go there. */
  selectedPlacement: number;
  selectedInfo: SelectedInfo | null;
  /** A part (and which of its placements) was clicked, or empty space (null). */
  onSelect: (part: string | null, placement?: number) => void;
  edits: CanvasEdits;
  tool: "select" | "pan";
  /** The pointer's position in the engine's coordinates (mm, y up), or null when it leaves. */
  onCursorMove?: (point: CanvasPoint | null) => void;
  ref?: Ref<CanvasApi>;
}

/** A click that moved less than this (px) is a click, not the end of a pan. */
const CLICK_SLOP = 4;

/** Drags snap to half a millimetre; Shift drags freely. */
const SNAP = 0.5;

const HANDLE_EDGES: (HandleEdge & { cursor: string })[] = [
  { x: -1, y: -1, cursor: "nwse-resize" },
  { x: 0, y: -1, cursor: "ns-resize" },
  { x: 1, y: -1, cursor: "nesw-resize" },
  { x: 1, y: 0, cursor: "ew-resize" },
  { x: 1, y: 1, cursor: "nwse-resize" },
  { x: 0, y: 1, cursor: "ns-resize" },
  { x: -1, y: 1, cursor: "nesw-resize" },
  { x: -1, y: 0, cursor: "ew-resize" },
];

/** The inside of a prepared <svg>: its drawing, to place inside the canvas's own SVG. */
const drawingOf = (svg: string) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

const placementLabel = (part: PlacedPart, placement: Placement) =>
  `Part ${part.name}${placement.point ? ` on ${placement.point}` : ""}`;

/**
 * An outline on the canvas: the engine's drawing in ink, and each part on top as a target that
 * highlights under the pointer and selects on click. The selected part can be moved, and
 * rectangles resized and rounded with handles. Clicking empty space deselects.
 *
 * Everything is in world coordinates (the engine's, y flipped; lib/world.ts) with the keys
 * behind, so a moved part shows its new place relative to them. The view is fitted once, when
 * the outline opens (remount it per outline with `key`), and doesn't jump on later edits.
 */
export function OutlineCanvas({
  name,
  svg,
  shapes,
  references,
  revision,
  selected,
  selectedPlacement,
  selectedInfo,
  onSelect,
  edits,
  tool,
  onCursorMove,
  ref,
}: OutlineCanvasProps) {
  const drawing = useMemo(() => {
    const prepared = prepareSvg(svg);
    return prepared ? drawingOf(prepared) : "";
  }, [svg]);
  const pressedAt = useRef<CanvasPoint | null>(null);
  // Fitted once: edits that move the outline shouldn't move the view.
  const [bounds] = useState(() => worldBounds(references, shapes));
  const offset = shapes ? drawingOffset(shapes) : { x: 0, y: 0 };
  const selectedPart = shapes?.parts.find((part) => part.name === selected);

  return (
    <Canvas
      ref={ref}
      aria-label={`Outline ${name}`}
      bounds={bounds}
      tool={tool}
      onCursorMove={(point) => onCursorMove?.(point ? { x: point.x, y: -point.y } : null)}
      onPointerDown={(event) => {
        pressedAt.current = { x: event.clientX, y: event.clientY };
      }}
      onClick={(event) => {
        const from = pressedAt.current;
        if (from && Math.hypot(event.clientX - from.x, event.clientY - from.y) < CLICK_SLOP) onSelect(null);
      }}
    >
      <g aria-hidden="true">
        {references.map((reference) => (
          <rect
            key={reference.name}
            className="tx-canvas__ref"
            x={-reference.width / 2}
            y={-reference.height / 2}
            width={reference.width}
            height={reference.height}
            transform={referenceTransform(reference)}
          />
        ))}
      </g>
      <g transform={`translate(${offset.x} ${offset.y})`}>
        {/* Safe: prepareSvg rebuilt the drawing from an allowlist of drawing elements. */}
        <g className="og-drawing" dangerouslySetInnerHTML={{ __html: drawing }} />
        {shapes?.parts.map((part) =>
          part.name === selected ? null : (
            // One part placed on several points is one thing: hovering any copy shows them all.
            <g key={part.name} className="og-part-group">
              {part.placements.map((placement, index) => (
                <path
                  key={index}
                  d={placement.path}
                  className="og-part"
                  data-part={part.name}
                  aria-label={placementLabel(part, placement)}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(part.name, index);
                  }}
                />
              ))}
            </g>
          ),
        )}
        {/* The selected part goes last, on top. Keyed by revision: a new drawing starts fresh. */}
        {selectedPart ? (
          <SelectedPart
            key={`${selectedPart.name}-${revision}`}
            part={selectedPart}
            placementIndex={selectedPlacement}
            info={selectedInfo}
            edits={edits}
            onPickPlacement={(index) => onSelect(selectedPart.name, index)}
          />
        ) : null}
      </g>
    </Canvas>
  );
}

/** The selected part mid-edit: moved, resized or rounded, and whether it's still being dragged. */
type Preview =
  | { kind: "move"; delta: CanvasPoint; dragging: boolean }
  | { kind: "resize"; edge: HandleEdge; delta: CanvasPoint; dragging: boolean }
  | { kind: "corner"; delta: CanvasPoint; dragging: boolean };

type Box = { x: number; y: number; width: number; height: number };

/**
 * The selected part: its placements in the accent color, draggable, plus handles on the clicked
 * placement for rectangles that aren't rotated (all placements share one size in
 * the YAML, so resizing one resizes them all). While dragging, a ghost shows where it was.
 * After a drop the preview stays until the next drawing (this component is remounted per
 * revision), or goes back at once if the edit was refused.
 */
function SelectedPart({
  part,
  placementIndex,
  info,
  edits,
  onPickPlacement,
}: {
  part: PlacedPart;
  placementIndex: number;
  info: SelectedInfo | null;
  edits: CanvasEdits;
  onPickPlacement: (index: number) => void;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const handleIndex = part.placements[placementIndex] ? placementIndex : 0;
  const first = part.placements[handleIndex];
  const box = first ? pathBounds(first.path) : null;
  const frame = { r: first?.r ?? 0, mirrored: first?.mirrored ?? false };
  const what = info?.what ?? "outline";
  const resizable = Boolean(box && first && what === "rectangle" && first.r % 360 === 0);
  const corner = info?.corner ?? 0;
  // The dropped preview stays while the engine checks the edit; a refused edit puts it back.
  // (A made edit brings a new drawing, which remounts this component without the preview.)
  const settle = (edit: Promise<boolean> | false, next: Preview) => {
    setPreview({ ...next, dragging: false });
    void Promise.resolve(edit).then((made) => {
      if (!made) setPreview(null);
    });
  };

  // The box as it would be after the current preview.
  let shown: Box | null = box;
  let radius = corner;
  if (box && preview?.kind === "resize") {
    const { grow, move } = resizeFromHandle(preview.edge, preview.delta);
    const width = box.width + grow.width;
    const height = box.height + grow.height;
    const cx = box.x + box.width / 2 + move.x;
    const cy = box.y + box.height / 2 - move.y;
    shown = { x: cx - width / 2, y: cy - height / 2, width, height };
    radius = fittingCorner(corner, shown);
  }
  if (box && preview?.kind === "corner") {
    radius = radiusFromDrag(corner, preview.delta, Math.min(box.width, box.height) / 2);
  }
  const reshaped = preview?.kind === "resize" || preview?.kind === "corner";
  const moved = preview?.kind === "move" ? preview.delta : null;

  return (
    <g data-part={part.name}>
      {preview?.dragging
        ? part.placements.map((placement, index) => (
            <path key={`ghost-${index}`} d={placement.path} className="tx-canvas__ghost" />
          ))
        : null}
      <g transform={moved ? `translate(${moved.x} ${moved.y})` : undefined}>
        {part.placements.map((placement, index) => (
          <DraggablePlacement
            key={index}
            placement={placement}
            label={`${placementLabel(part, placement)}, selected`}
            hidden={reshaped && index === handleIndex}
            onPick={() => onPickPlacement(index)}
            onMove={(delta) => setPreview({ kind: "move", delta, dragging: true })}
            onEnd={(delta) => {
              // The drawing's y points down; the engine's points up.
              const engineDelta = { x: delta.x, y: -delta.y };
              const placementFrame = { r: placement.r, mirrored: placement.mirrored };
              const edit =
                (delta.x !== 0 || delta.y !== 0) && edits.move(part.name, engineDelta, placementFrame);
              settle(edit, { kind: "move", delta, dragging: false });
            }}
            onCancel={() => setPreview(null)}
          />
        ))}
      </g>
      {resizable && shown && box ? (
        <>
          {reshaped ? <rect className="tx-canvas__selected" {...shown} rx={radius} /> : null}
          <BoxLabels box={shown} />
          {HANDLE_EDGES.map((edge) => (
            <ResizeHandle
              key={edge.cursor + edge.x + edge.y}
              edge={edge}
              box={shown}
              onMove={(delta) => setPreview({ kind: "resize", edge, delta, dragging: true })}
              onEnd={(delta) => {
                const { grow, move } = resizeFromHandle(edge, delta);
                const size = { width: box.width + grow.width, height: box.height + grow.height };
                const fitted = fittingCorner(corner, size);
                const edit =
                  (grow.width !== 0 || grow.height !== 0) &&
                  edits.resize(part.name, grow, move, frame, fitted < corner ? fitted : undefined);
                settle(edit, { kind: "resize", edge, delta, dragging: false });
              }}
              onCancel={() => setPreview(null)}
            />
          ))}
          {resizable ? (
            <CornerHandle
              box={shown}
              radius={radius}
              onMove={(delta) => setPreview({ kind: "corner", delta, dragging: true })}
              onEnd={(delta) => {
                const next = radiusFromDrag(corner, delta, Math.min(box.width, box.height) / 2);
                const edit = next !== corner && edits.corner(part.name, next);
                settle(edit, { kind: "corner", delta, dragging: false });
              }}
              onCancel={() => setPreview(null)}
            />
          ) : null}
        </>
      ) : null}
    </g>
  );
}

/** One placement of the selected part, dragged with the kit's useCanvasDrag (inside <Canvas>). */
function DraggablePlacement({
  placement,
  label,
  hidden,
  onPick,
  onMove,
  onEnd,
  onCancel,
}: {
  placement: Placement;
  label: string;
  /** Hidden while its outline is shown resized or rounded instead. */
  hidden: boolean;
  /** Clicked: put the handles on this placement. */
  onPick: () => void;
  onMove: (delta: CanvasPoint) => void;
  onEnd: (delta: CanvasPoint) => void;
  onCancel: () => void;
}) {
  const drag = useCanvasDrag({ snap: SNAP, onMove, onEnd, onCancel });
  return (
    <path
      d={placement.path}
      className="tx-canvas__selected"
      aria-label={label}
      opacity={hidden ? 0 : undefined}
      onClick={(event) => {
        event.stopPropagation();
        onPick();
      }}
      {...drag}
    />
  );
}

function ResizeHandle({
  edge,
  box,
  onMove,
  onEnd,
  onCancel,
}: {
  edge: HandleEdge & { cursor: string };
  box: Box;
  onMove: (delta: CanvasPoint) => void;
  onEnd: (delta: CanvasPoint) => void;
  onCancel: () => void;
}) {
  const drag = useCanvasDrag({ snap: SNAP, onMove, onEnd, onCancel });
  return (
    <CanvasResizeHandle
      x={box.x + ((edge.x + 1) / 2) * box.width}
      y={box.y + ((edge.y + 1) / 2) * box.height}
      cursor={edge.cursor}
      aria-label="Resize"
      {...drag}
    />
  );
}

/** The diamond near the top-left corner: drag it in to round the corners, out to square them. */
function CornerHandle({
  box,
  radius,
  onMove,
  onEnd,
  onCancel,
}: {
  box: Box;
  radius: number;
  onMove: (delta: CanvasPoint) => void;
  onEnd: (delta: CanvasPoint) => void;
  onCancel: () => void;
}) {
  const { view } = useCanvas();
  const drag = useCanvasDrag({ snap: SNAP, onMove, onEnd, onCancel });
  // On the corner's arc, plus a little so it doesn't sit on the corner resize handle.
  const inset = radius * (1 - Math.SQRT1_2) + 16 / view.scale;
  return (
    <>
      <CanvasCornerHandle x={box.x + inset} y={box.y + inset} aria-label="Corner radius" {...drag} />
      <CanvasLabel x={box.x + inset + 30 / view.scale} y={box.y + inset} tone="accent">
        {`r ${formatNumber(radius)}`}
      </CanvasLabel>
    </>
  );
}

/** Width and height chips next to the box, the same size at any zoom. */
function BoxLabels({ box }: { box: Box }) {
  const { view } = useCanvas();
  const gap = 16 / view.scale;
  return (
    <>
      <CanvasLabel x={box.x + box.width / 2} y={box.y - gap}>
        {formatNumber(box.width)}
      </CanvasLabel>
      <CanvasLabel x={box.x + box.width + gap * 1.8} y={box.y + box.height / 2}>
        {formatNumber(box.height)}
      </CanvasLabel>
    </>
  );
}
