import { isNode, isScalar, parseDocument, type Document } from "yaml";

/**
 * Edits to the user's YAML that keep their file as they wrote it.
 *
 * - Changing an existing value (`setScalar`) replaces only that value's characters in the
 *   source, so comments, spacing and alignment elsewhere stay byte-for-byte the same.
 * - Structural changes (`updateDocument`: adding a key, a part, reordering) go through the
 *   `yaml` package's document model, which keeps comments but may normalize the formatting of
 *   what it re-prints (e.g. `[  0,   1 ]` becomes `[0, 1]`).
 *
 * Callers apply the result to the editor with `minimalChange`, so cursor and undo survive.
 */

export type YamlPath = readonly (string | number)[];

const PRINT = { lineWidth: 0, flowCollectionPadding: false } as const;

function parse(text: string): Document {
  const doc = parseDocument(text);
  const [error] = doc.errors;
  if (error) throw new Error(`The YAML can't be edited until it's valid: ${error.message}`);
  return doc;
}

/** A number as it should appear in a config: at most 4 decimals, no float noise, no "-0". */
export function formatNumber(value: number): string {
  const rounded = Number(value.toFixed(4));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/** The plain value at `path` (numbers, strings, arrays, objects), or undefined. */
export function readValue(text: string, path: YamlPath): unknown {
  let value: unknown = parse(text).toJS();
  for (const key of path) {
    if (value === null || typeof value !== "object") return undefined;
    value = (value as Record<string | number, unknown>)[key];
  }
  return value;
}

/**
 * Where the value at `path` is in the text (e.g. a part's whole block), for highlighting it in
 * the editor. Null if there's nothing there or the YAML doesn't parse.
 */
export function findRange(text: string, path: YamlPath): { from: number; to: number } | null {
  const doc = parseDocument(text);
  if (doc.errors.length > 0) return null;
  const node = doc.getIn(path, true);
  if (!isNode(node) || !node.range) return null;
  const [from, valueEnd] = node.range;
  return { from, to: valueEnd };
}

/** Sets the value at `path`: in place if it already exists as a plain value, otherwise added. */
export function setScalar(text: string, path: YamlPath, value: number | string): string {
  const doc = parse(text);
  const written = typeof value === "number" ? formatNumber(value) : value;
  const node = doc.getIn(path, true);
  if (isScalar(node) && node.type === "PLAIN" && node.range) {
    const [start, end] = node.range;
    return text.slice(0, start) + written + text.slice(end);
  }
  return updateDocument(text, (structural) => {
    structural.setIn(path, typeof value === "number" ? Number(written) : value);
  });
}

/** Applies a structural change to the parsed document and prints it back, comments included. */
export function updateDocument(text: string, edit: (doc: Document) => void): string {
  const doc = parse(text);
  edit(doc);
  return doc.toString(PRINT);
}
