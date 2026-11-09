import ergogen from "ergogen";
import type { EngineFile, EngineResult, OutlineShapes, Reference } from "../types";

/**
 * Runs Ergogen on a YAML config and flattens its nested results into a list of files.
 *
 * Runs on whatever thread calls it: the app calls it from a Web Worker (see worker.ts), tests
 * call it directly. Never throws; Ergogen's errors come back as `ok: false`.
 */
export async function runErgogen(config: string): Promise<EngineResult> {
  const log: string[] = [];
  try {
    // debug: also produce the points demo and "_"-prefixed helper outlines, which are useful
    // while designing. svg: produce SVG next to DXF so outlines can be previewed. shapes: where
    // each outline part is placed, for the canvas (an option of the ToYoNiX/ergogen-cli fork).
    const results = await ergogen.process(config, { debug: true, svg: true, shapes: true }, (message) =>
      log.push(message),
    );
    return {
      ok: true,
      files: toFiles(results),
      shapes: toShapes(results),
      references: toReferences(results),
      log,
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error), log };
  }
}

type Results = Awaited<ReturnType<typeof ergogen.process>>;

/** The keys, to draw behind the outlines. Ergogen's default key is 18 × 18 mm. */
function toReferences(results: Results): Reference[] {
  return Object.entries(results.points ?? {}).map(([name, point]) => ({
    name,
    x: point.x,
    y: point.y,
    r: point.r,
    width: point.meta.width ?? 18,
    height: point.meta.height ?? 18,
  }));
}

/** The fork reports each outline's extents; the canvas needs the size of its SVG drawing. */
function toShapes(results: Results): Record<string, OutlineShapes> {
  const shapes: Record<string, OutlineShapes> = {};
  for (const [name, outline] of Object.entries(results.shapes ?? {})) {
    const extents = outline.extents;
    // Rounded like the SVG's viewBox (makerjs writes 3 decimals).
    const round = (value: number) => Math.round(value * 1000) / 1000;
    shapes[name] = {
      size: extents
        ? { width: round(extents.high[0] - extents.low[0]), height: round(extents.high[1] - extents.low[1]) }
        : { width: 0, height: 0 },
      origin: extents ? { x: round(extents.low[0]), y: round(extents.high[1]) } : { x: 0, y: 0 },
      // A part with nothing left to draw has no path data: an empty path is easier to handle.
      parts: outline.parts.map((part) => ({
        ...part,
        placements: part.placements.map((placement) => ({ ...placement, path: placement.path ?? "" })),
      })),
    };
  }
  return shapes;
}

function toFiles(results: Results): EngineFile[] {
  const files: EngineFile[] = [];

  if (results.demo?.svg) files.push({ path: "points/demo.svg", kind: "svg", content: results.demo.svg });

  for (const [name, outline] of Object.entries(results.outlines ?? {})) {
    if (outline.svg) files.push({ path: `outlines/${name}.svg`, kind: "svg", content: outline.svg });
    if (outline.dxf) files.push({ path: `outlines/${name}.dxf`, kind: "dxf", content: outline.dxf });
  }

  for (const [name, caseOutput] of Object.entries(results.cases ?? {})) {
    if (caseOutput.jscad)
      files.push({ path: `cases/${name}.jscad`, kind: "jscad", content: caseOutput.jscad });
  }

  for (const [name, pcb] of Object.entries(results.pcbs ?? {})) {
    files.push({ path: `pcbs/${name}.kicad_pcb`, kind: "kicad_pcb", content: pcb });
  }

  return files;
}
