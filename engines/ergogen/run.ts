import ergogen from "ergogen";
import type { EngineFile, EngineResult } from "../types";

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
    // while designing. svg: produce SVG next to DXF so outlines can be previewed.
    const results = await ergogen.process(config, { debug: true, svg: true }, (message) => log.push(message));
    return { ok: true, files: toFiles(results), log };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error), log };
  }
}

type Results = Awaited<ReturnType<typeof ergogen.process>>;

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
