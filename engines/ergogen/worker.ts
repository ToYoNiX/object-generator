// Web Worker entry for the Ergogen engine: runs Ergogen off the main thread so the editor stays
// responsive while a config is generated.
import type { WorkerRequest, WorkerResponse } from "../worker-runner";
import { runErgogen } from "./run";

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, config } = event.data;
  const response: WorkerResponse = { id, result: await runErgogen(config) };
  self.postMessage(response);
};
