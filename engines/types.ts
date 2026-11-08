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

export type EngineResult =
  { ok: true; files: EngineFile[]; log: string[] } | { ok: false; error: string; log: string[] };

export interface EngineExample {
  id: string;
  label: string;
  author: string;
  config: string;
}

export interface Engine {
  id: string;
  label: string;
  examples: EngineExample[];
  /**
   * Runs the engine off the main thread. Never rejects: failures come back as `ok: false`.
   * A plain function (not a method), so it can be passed around on its own.
   */
  run: (config: string) => Promise<EngineResult>;
}
