/**
 * The contract between the app and a generation engine.
 *
 * An engine turns a YAML config into files (outlines, PCBs, case scripts, …). The editor, the
 * previews, and later the canvas only talk to this interface, so another engine (for things
 * other than keyboards) can be added without touching them. Ergogen is the first engine.
 */

/** What a generated file contains, so the app can pick a preview for it. */
export type EngineFileKind = "svg" | "dxf" | "kicad_pcb" | "jscad" | "yaml";

export interface EngineFile {
  /** Unique, slash-separated path, e.g. "outlines/board.svg". Also the download name. */
  path: string;
  kind: EngineFileKind;
  content: string;
}

/** One place a part was drawn (a part can be placed many times, e.g. once per key). */
export interface Placement {
  /** The named point it's placed on, or null. */
  point: string | null;
  /** Position and rotation (degrees) in the engine's own coordinates. */
  x: number;
  y: number;
  r: number;
  mirrored: boolean;
  /** The part's outline as SVG path data, in the coordinates of its outline's SVG file. */
  path: string;
}

/** A part of an outline, as written in the config. */
export interface PlacedPart {
  /** Its key in the config: the index ("0", "1", …) for a list of parts, or its name. */
  name: string;
  /** What kind of shape, e.g. "rectangle", "circle", "outline". */
  what: string;
  /** How it combines with the parts before it: "add", "subtract", "intersect" or "stack". */
  operation: string;
  placements: Placement[];
}

/** Where the parts of one outline are, for the canvas. */
export interface OutlineShapes {
  /** The size of the outline's SVG drawing (its viewBox), in the same units. */
  size: { width: number; height: number };
  /**
   * The drawing's top-left corner in the engine's coordinates, which have y pointing up: a point
   * (x, y) is drawn at (x - origin.x, origin.y - y).
   */
  origin: { x: number; y: number };
  parts: PlacedPart[];
}

/**
 * Something to draw faintly behind the outlines for orientation, such as a keyboard's keys: a
 * rectangle centered on (x, y), rotated `r` degrees counter-clockwise, in engine coordinates.
 */
export interface Reference {
  name: string;
  x: number;
  y: number;
  r: number;
  width: number;
  height: number;
}

export type EngineResult =
  | {
      ok: true;
      files: EngineFile[];
      /** Per outline name: its parts and where they are. Empty for engines that can't say. */
      shapes: Record<string, OutlineShapes>;
      /** Marks to draw behind the outlines (for Ergogen: the keys). */
      references: Reference[];
      log: string[];
    }
  | { ok: false; error: string; log: string[] };

export interface EngineExample {
  /** Used in links: /workspace/?example=<id>. */
  id: string;
  label: string;
  author: string;
  /** One line for the example's card on the home page. */
  description?: string;
  config: string;
}

export interface Engine {
  id: string;
  label: string;
  /** The config a new object starts from (also the draft on a first visit). */
  starter: string;
  examples: EngineExample[];
  /**
   * Runs the engine off the main thread. Never rejects: failures come back as `ok: false`.
   * A plain function (not a method), so it can be passed around on its own.
   */
  run: (config: string) => Promise<EngineResult>;
}
