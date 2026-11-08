import { describe, expect, it, vi } from "vitest";
import type { EngineResult } from "./types";
import {
  createWorkerRunner,
  type WorkerLike,
  type WorkerRequest,
  type WorkerResponse,
} from "./worker-runner";

/** A stand-in for a Web Worker that records requests and lets the test reply by hand. */
class FakeWorker implements WorkerLike {
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  requests: WorkerRequest[] = [];
  terminate = vi.fn();

  postMessage(request: WorkerRequest) {
    this.requests.push(request);
  }

  reply(id: number, result: EngineResult) {
    this.onmessage?.({ data: { id, result } } as MessageEvent<WorkerResponse>);
  }

  crash(message: string) {
    this.onerror?.({ message } as ErrorEvent);
  }

  request(index: number): WorkerRequest {
    const request = this.requests[index];
    if (!request) throw new Error(`No request at index ${index}`);
    return request;
  }
}

const ok = (path: string): EngineResult => ({
  ok: true,
  files: [{ path, kind: "svg", content: "" }],
  shapes: {},
  log: [],
});

describe("createWorkerRunner", () => {
  it("matches each reply to its own request, even out of order", async () => {
    // Arrange
    const worker = new FakeWorker();
    const run = createWorkerRunner(() => worker);

    // Act
    const first = run("first");
    const second = run("second");
    const firstRequest = worker.request(0);
    const secondRequest = worker.request(1);
    worker.reply(secondRequest.id, ok("second.svg"));
    worker.reply(firstRequest.id, ok("first.svg"));

    // Assert
    expect(firstRequest.config).toBe("first");
    expect(secondRequest.config).toBe("second");
    await expect(first).resolves.toEqual(ok("first.svg"));
    await expect(second).resolves.toEqual(ok("second.svg"));
  });

  it("creates the worker only when the first run starts", () => {
    // Arrange
    const factory = vi.fn(() => new FakeWorker());

    // Act
    const run = createWorkerRunner(factory);
    const before = factory.mock.calls.length;
    void run("config");
    void run("config");

    // Assert
    expect(before).toBe(0);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("fails pending runs when the worker crashes, then starts a fresh worker", async () => {
    // Arrange
    const crashed = new FakeWorker();
    const fresh = new FakeWorker();
    const factory = vi.fn().mockReturnValueOnce(crashed).mockReturnValueOnce(fresh);
    const run = createWorkerRunner(factory);
    const pending = run("config");

    // Act
    crashed.crash("out of memory");
    const next = run("config");
    fresh.reply(fresh.request(0).id, ok("next.svg"));

    // Assert
    await expect(pending).resolves.toEqual({ ok: false, error: "Engine crashed: out of memory", log: [] });
    expect(crashed.terminate).toHaveBeenCalled();
    await expect(next).resolves.toEqual(ok("next.svg"));
  });
});
