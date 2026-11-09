import { isCollection, isSeq, visit, YAMLSeq, type Document } from "yaml";
import { formatNumber, readValue, setScalar, updateDocument, type YamlPath } from "@/lib/yaml-edit";

/**
 * Canvas edits written into an Ergogen config: moving, resizing and rounding a part, and
 * adding, deleting and reordering parts. Each takes the config text and returns the new text,
 * keeping the user's comments and formatting (see lib/yaml-edit.ts).
 *
 * Distances are in Ergogen's own coordinates (millimetres, y up).
 */

/** A part of an outline, as reported in the engine's shapes. */
export interface PartRef {
  outline: string;
  /** The index ("0", "1", …) in a list of parts, or the part's name. */
  part: string;
}

/** How the placement being dragged sits: its rotation in degrees, and whether it's mirrored. */
export interface PlacementFrame {
  r: number;
  mirrored: boolean;
}

type Point = { x: number; y: number };

const NEARLY_ZERO = 1e-9;

/** Where a part lives in the YAML: list parts by index, named parts by name. */
export function partPath(text: string, ref: PartRef): YamlPath {
  const parts = readValue(text, ["outlines", ref.outline]);
  return ["outlines", ref.outline, Array.isArray(parts) ? Number(ref.part) : ref.part];
}

/**
 * Adds `delta` to a config value, keeping formulas: `kx - 1` plus 2 is `kx + 1`. A trailing
 * number added earlier is folded in, so repeated drags don't pile up `+ 1 + 2 - 0.5`.
 */
export function offsetValue(value: unknown, delta: number): number | string {
  if (typeof value === "number") return Number(formatNumber(value + delta));
  if (typeof value !== "string") return Number(formatNumber(delta));
  let base = value.trim();
  let offset = delta;
  const trailing = /^(.*?)\s*([+-])\s*(\d+(?:\.\d+)?)$/.exec(base);
  // Only fold `… + n` / `… - n` when what's before it is a complete expression (not `a * -3`).
  if (trailing?.[1] && !/[-+*/^(]$/.test(trailing[1])) {
    base = trailing[1];
    offset += (trailing[2] === "-" ? -1 : 1) * Number(trailing[3]);
  }
  if (Math.abs(offset) < NEARLY_ZERO) return base;
  return `${base} ${offset < 0 ? "-" : "+"} ${formatNumber(Math.abs(offset))}`;
}

/** A new node for `value`, with lists written inline (`[1, 2]`), as in Ergogen configs. */
export function inlineNode(doc: Document, value: unknown) {
  const node = doc.createNode(value);
  visit(node, {
    Seq(_, seq) {
      seq.flow = true;
    },
  });
  return node;
}

/** Offsets a pair value (`shift`, `size`) by `delta`, editing only the numbers that change. */
function offsetPair(text: string, path: YamlPath, delta: Point): string {
  const current = readValue(text, path);
  if (Array.isArray(current)) {
    let edited = text;
    const deltas = [delta.x, delta.y];
    for (const index of [0, 1]) {
      const change = deltas[index] ?? 0;
      if (Math.abs(change) < NEARLY_ZERO) continue;
      edited = setScalar(edited, [...path, index], offsetValue(current[index], change));
    }
    return edited;
  }
  // A single value (or nothing yet) becomes a pair.
  const pair = [offsetValue(current, delta.x), offsetValue(current, delta.y)];
  return updateDocument(text, (doc) => doc.setIn(path, inlineNode(doc, pair)));
}

/**
 * Moves a part by `delta` by changing its `adjust.shift`. Ergogen applies the shift in the frame
 * of the point the part is placed on, so the distance is turned back by the point's rotation
 * (not counting the part's own `adjust.rotate`, applied after the shift) and mirrored if needed.
 * A part placed on several points moves on all of them.
 */
export function moveShape(text: string, ref: PartRef, delta: Point, frame: PlacementFrame): string {
  const path = partPath(text, ref);
  const ownRotation = readValue(text, [...path, "adjust", "rotate"]);
  const degrees = frame.r - (typeof ownRotation === "number" ? ownRotation : 0);
  const angle = (-degrees * Math.PI) / 180;
  let x = delta.x * Math.cos(angle) - delta.y * Math.sin(angle);
  const y = delta.x * Math.sin(angle) + delta.y * Math.cos(angle);
  if (frame.mirrored) x = -x;
  if (Math.abs(x) < NEARLY_ZERO && Math.abs(y) < NEARLY_ZERO) return text;

  if (readValue(text, [...path, "adjust"]) === undefined) {
    const shift = [Number(formatNumber(x)), Number(formatNumber(y))];
    return updateDocument(text, (doc) => doc.setIn([...path, "adjust"], inlineNode(doc, { shift })));
  }
  return offsetPair(text, [...path, "adjust", "shift"], { x, y });
}

/**
 * Grows or shrinks a rectangle by `delta` (width, height), changing its `size`. Rectangles are
 * placed from their center and grow both ways: to keep one edge still, also move the part by
 * half the change.
 */
export function resizeShape(text: string, ref: PartRef, delta: { width: number; height: number }): string {
  const path = partPath(text, ref);
  const size = readValue(text, [...path, "size"]);
  if (size === undefined) return text;
  if (!Array.isArray(size) && Math.abs(delta.width - delta.height) < NEARLY_ZERO) {
    // A square stays a square.
    return setScalar(text, [...path, "size"], offsetValue(size, delta.width));
  }
  return offsetPair(text, [...path, "size"], { x: delta.width, y: delta.height });
}

/** Sets a rectangle's corner radius; 0 removes the key (square corners). */
export function setCornerRadius(text: string, ref: PartRef, radius: number): string {
  const path = [...partPath(text, ref), "corner"];
  if (radius > NEARLY_ZERO) return setScalar(text, path, radius);
  if (readValue(text, path) === undefined) return text;
  return updateDocument(text, (doc) => doc.deleteIn(path));
}

/**
 * Adds a part at the end of an outline: appended to a list of parts, or under a new name
 * (`circle_1`, …) in named parts. A missing outline is created as a list. Returns the new
 * config and the new part's name, as the engine's shapes will call it.
 */
export function addPart(
  text: string,
  outline: string,
  part: Record<string, unknown>,
): { config: string; part: string } {
  const parts = readValue(text, ["outlines", outline]);
  let name = "0";
  if (Array.isArray(parts)) {
    name = String(parts.length);
  } else if (parts !== undefined) {
    const prefix = typeof part.what === "string" ? part.what : "part";
    let index = 1;
    while ((parts as Record<string, unknown>)[`${prefix}_${index}`] !== undefined) index++;
    name = `${prefix}_${index}`;
  }
  const config = updateDocument(text, (doc) => {
    const node = inlineNode(doc, part);
    if (parts === undefined) {
      const list = new YAMLSeq();
      list.items.push(node);
      doc.setIn(["outlines", outline], list);
    } else if (Array.isArray(parts)) {
      doc.addIn(["outlines", outline], node);
    } else {
      doc.setIn(["outlines", outline, name], node);
    }
  });
  return { config, part: name };
}

export function deletePart(text: string, ref: PartRef): string {
  const path = partPath(text, ref);
  return updateDocument(text, (doc) => doc.deleteIn(path));
}

/** Moves a part to position `index` among its outline's parts (order decides what's cut first). */
export function movePart(text: string, ref: PartRef, index: number): string {
  const path = partPath(text, ref);
  return updateDocument(text, (doc) => {
    const parts = doc.getIn(["outlines", ref.outline], true);
    if (!isCollection(parts)) return;
    const items = parts.items as unknown[];
    const from = isSeq(parts)
      ? Number(path[2])
      : items.findIndex((pair) => String((pair as { key: { value?: unknown } }).key.value) === ref.part);
    if (from < 0 || from >= items.length) return;
    const [moved] = items.splice(from, 1);
    items.splice(Math.max(0, Math.min(index, items.length)), 0, moved);
  });
}
