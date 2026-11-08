import type { Engine } from "../types";
import { createWorkerRunner } from "../worker-runner";
import { sblit36 } from "./examples/sblit36";

/** Ergogen (ToYoNiX/ergogen-cli fork): keyboard points, outlines, cases, and KiCad PCBs. */
export const ergogenEngine: Engine = {
  id: "ergogen",
  label: "Ergogen",
  examples: [sblit36],
  run: createWorkerRunner(() => new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })),
};
