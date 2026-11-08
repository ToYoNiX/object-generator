import type { EngineResult } from "./types";

/** Message from the app to an engine worker. */
export interface WorkerRequest {
  id: number;
  config: string;
}

/** Message from an engine worker back to the app. */
export interface WorkerResponse {
  id: number;
  result: EngineResult;
}

/** The slice of the Worker API the runner needs, so tests can pass a fake. */
export interface WorkerLike {
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  postMessage(request: WorkerRequest): void;
  terminate(): void;
}

/**
 * Turns an engine worker into an async `run(config)` function.
 *
 * The worker is created on the first run (never during server prerendering), each reply is
 * matched to its request by id, and a crashed worker fails its pending runs and is replaced
 * on the next run.
 */
export function createWorkerRunner(
  createWorker: () => WorkerLike,
): (config: string) => Promise<EngineResult> {
  let worker: WorkerLike | null = null;
  let nextId = 0;
  const pending = new Map<number, (result: EngineResult) => void>();

  const start = (): WorkerLike => {
    const started = createWorker();
    started.onmessage = (event) => {
      const resolve = pending.get(event.data.id);
      pending.delete(event.data.id);
      resolve?.(event.data.result);
    };
    started.onerror = (event) => {
      started.terminate();
      worker = null;
      const failed: EngineResult = { ok: false, error: `Engine crashed: ${event.message}`, log: [] };
      for (const resolve of pending.values()) resolve(failed);
      pending.clear();
    };
    return started;
  };

  return (config) => {
    worker ??= start();
    const id = nextId++;
    const result = new Promise<EngineResult>((resolve) => pending.set(id, resolve));
    worker.postMessage({ id, config });
    return result;
  };
}
