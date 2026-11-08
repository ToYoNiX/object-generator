/** Replace `from`..`to` of the old text with `insert`. Same shape as a CodeMirror change. */
export interface TextChange {
  from: number;
  to: number;
  insert: string;
}

/**
 * The smallest single replacement that turns `before` into `after` (common prefix and suffix
 * kept). Applying edits this way, instead of replacing the whole document, keeps the editor's
 * cursor, scroll position and undo history intact. Returns null when nothing changed.
 */
export function minimalChange(before: string, after: string): TextChange | null {
  if (before === after) return null;

  let start = 0;
  const shortest = Math.min(before.length, after.length);
  while (start < shortest && before[start] === after[start]) start++;

  // The suffix may not reach back into the prefix, in either text.
  let endBefore = before.length;
  let endAfter = after.length;
  while (endBefore > start && endAfter > start && before[endBefore - 1] === after[endAfter - 1]) {
    endBefore--;
    endAfter--;
  }

  return { from: start, to: endBefore, insert: after.slice(start, endAfter) };
}

export function applyChange(text: string, change: TextChange): string {
  return text.slice(0, change.from) + change.insert + text.slice(change.to);
}
