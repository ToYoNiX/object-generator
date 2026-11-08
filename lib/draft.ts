/** The work in progress: which engine, and the YAML config being edited. */
export interface Draft {
  engine: string;
  config: string;
}

/** storage.app key of the draft (stored as `toyonix:object-generator:draft`). */
export const DRAFT_KEY = "draft";

/**
 * Validates a value read from storage. Storage is shared with every toyonix app and can hold
 * old or hand-edited data, so anything unexpected is treated as "no draft".
 */
export function parseDraft(value: unknown): Draft | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const { engine, config } = value as Record<string, unknown>;
  if (typeof engine !== "string" || engine === "") return undefined;
  if (typeof config !== "string") return undefined;
  return { engine, config };
}
