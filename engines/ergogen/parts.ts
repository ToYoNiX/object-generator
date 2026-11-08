import { readValue } from "@/lib/yaml-edit";
import type { PartRef } from "./edits";

/** How each operation is shown next to a part, e.g. in the Layers list. */
export const OPERATION_SYMBOLS: Record<string, string> = {
  add: "+",
  subtract: "−",
  intersect: "∩",
  stack: "⧉",
};

const show = (value: unknown) =>
  typeof value === "number" || typeof value === "string" ? String(value) : "?";

/**
 * A short, readable description of a part for lists: its name (a referenced outline's name, a
 * named part's key, or "#n what" for a list of parts) and its main dimension.
 */
export function describePart(config: string, ref: PartRef): { label: string; meta: string } {
  const parts = readValue(config, ["outlines", ref.outline]);
  const isList = Array.isArray(parts);
  const part = readValue(config, ["outlines", ref.outline, isList ? Number(ref.part) : ref.part]);
  const fields = (part ?? {}) as Record<string, unknown>;
  const what = typeof fields.what === "string" ? fields.what : "outline";

  if (what === "outline" && typeof fields.name === "string") return { label: fields.name, meta: "outline" };

  const label = isList ? `#${Number(ref.part) + 1} ${what}` : ref.part;
  let meta = what;
  if (what === "circle") meta = `r ${show(fields.radius)}`;
  else if (Array.isArray(fields.size)) meta = `${show(fields.size[0])} × ${show(fields.size[1])}`;
  else if (fields.size !== undefined) meta = `${show(fields.size)} × ${show(fields.size)}`;
  return { label, meta };
}
