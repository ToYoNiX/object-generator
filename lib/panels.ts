/** Which side panels of the workspace are open. */
export interface Panels {
  yaml: boolean;
  files: boolean;
}

export type PanelName = keyof Panels;

/** storage.app key (stored as `toyonix:object-generator:panels`). */
export const PANELS_KEY = "panels";

export const DEFAULT_PANELS: Panels = { yaml: true, files: true };

/**
 * Validates a value read from storage (shared with every toyonix app, so it may be anything).
 * Missing or invalid fields fall back to open.
 */
export function parsePanels(value: unknown): Panels {
  if (typeof value !== "object" || value === null) return DEFAULT_PANELS;
  const { yaml, files } = value as Record<string, unknown>;
  return {
    yaml: typeof yaml === "boolean" ? yaml : DEFAULT_PANELS.yaml,
    files: typeof files === "boolean" ? files : DEFAULT_PANELS.files,
  };
}
