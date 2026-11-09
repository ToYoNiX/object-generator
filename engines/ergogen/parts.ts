import { readValue, setScalar, updateDocument } from "@/lib/yaml-edit";
import { inlineNode, partPath, type PartRef } from "./edits";

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

/** The fields of a part the Shape panel edits, as written in the YAML ("" when not set). */
export interface PartFields {
  what: string;
  shiftX: string;
  shiftY: string;
  width: string;
  height: string;
  corner: string;
  operation: string;
}

export type PartField = Exclude<keyof PartFields, "what">;

const text = (value: unknown) =>
  typeof value === "number" || typeof value === "string" ? String(value) : "";
const pair = (value: unknown): [string, string] =>
  Array.isArray(value) ? [text(value[0]), text(value[1])] : [text(value), text(value)];

export function readPartFields(config: string, ref: PartRef): PartFields {
  const path = partPath(config, ref);
  const read = (...keys: string[]) => readValue(config, [...path, ...keys]);
  const [shiftX, shiftY] = pair(read("adjust", "shift"));
  const [width, height] = pair(read("size"));
  const operation = read("operation");
  return {
    what: text(read("what")) || "outline",
    shiftX,
    shiftY,
    width,
    height,
    corner: text(read("corner")),
    operation: typeof operation === "string" ? operation : "add",
  };
}

/** A typed-in value: a number if it is one, otherwise kept as a formula (e.g. "kx - 1"). */
const parse = (raw: string): number | string => (/^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw);

/** Sets one of a pair (`adjust.shift`, `size`): in place if it's a list, else written as one. */
function setPairItem(
  config: string,
  path: readonly (string | number)[],
  index: 0 | 1,
  value: number | string,
) {
  const current = readValue(config, path);
  if (Array.isArray(current)) return setScalar(config, [...path, index], value);
  const other = current === undefined ? (path.at(-1) === "shift" ? 0 : value) : (current as number | string);
  const next = index === 0 ? [value, other] : [other, value];
  return updateDocument(config, (doc) => doc.setIn(path, inlineNode(doc, next)));
}

/**
 * Writes one field from the Shape panel. An empty value removes `corner` and resets a shift
 * to 0; "add" removes `operation` (it's the default); an empty size is ignored.
 */
export function setPartField(config: string, ref: PartRef, field: PartField, raw: string): string {
  const path = partPath(config, ref);
  const value = raw.trim();
  const remove = (key: string) =>
    readValue(config, [...path, key]) === undefined
      ? config
      : updateDocument(config, (doc) => doc.deleteIn([...path, key]));

  switch (field) {
    case "shiftX":
    case "shiftY": {
      const index = field === "shiftX" ? 0 : 1;
      if (readValue(config, [...path, "adjust"]) === undefined) {
        const shift = index === 0 ? [parse(value || "0"), 0] : [0, parse(value || "0")];
        return updateDocument(config, (doc) => doc.setIn([...path, "adjust"], inlineNode(doc, { shift })));
      }
      return setPairItem(config, [...path, "adjust", "shift"], index, parse(value || "0"));
    }
    case "width":
    case "height":
      return value ? setPairItem(config, [...path, "size"], field === "width" ? 0 : 1, parse(value)) : config;
    case "corner":
      return value && value !== "0" ? setScalar(config, [...path, "corner"], parse(value)) : remove("corner");
    case "operation":
      return value && value !== "add"
        ? setScalar(config, [...path, "operation"], value)
        : remove("operation");
  }
}
