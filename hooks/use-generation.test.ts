// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EngineResult } from "@/engines/types";
import { useGeneration } from "./use-generation";

/** A fake engine whose runs only finish when the test says so. */
function controllableEngine() {
  const runs: { config: string; finish: (result: EngineResult) => void }[] = [];
  const run = vi.fn(
    (config: string) =>
      new Promise<EngineResult>((resolve) => {
        runs.push({ config, finish: resolve });
      }),
  );
  const finish = async (index: number, result: EngineResult) => {
    const pending = runs[index];
    if (!pending) throw new Error(`No run at index ${index}`);
    await act(async () => {
      pending.finish(result);
      // Let the hook's await on the run settle inside act.
      await Promise.resolve();
    });
  };
  return { run, runs, finish };
}

const ok = (path: string): EngineResult => ({
  ok: true,
  files: [{ path, kind: "svg", content: "<svg/>" }],
  log: [],
});
const failed = (error: string): EngineResult => ({ ok: false, error, log: [] });

describe("useGeneration", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("does nothing until there is a config", () => {
    // Arrange
    const engine = controllableEngine();

    // Act
    renderHook(() => useGeneration(engine.run, null, 500));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Assert
    expect(engine.run).not.toHaveBeenCalled();
  });

  it("runs once the config stops changing", async () => {
    // Arrange
    const engine = controllableEngine();
    const { result, rerender } = renderHook(({ config }) => useGeneration(engine.run, config, 500), {
      initialProps: { config: "a" },
    });

    // Act
    rerender({ config: "ab" });
    act(() => {
      vi.advanceTimersByTime(499);
    });
    const runsBeforePause = engine.run.mock.calls.length;
    act(() => {
      vi.advanceTimersByTime(1);
    });
    const runningWhilePending = result.current.running;
    await engine.finish(0, ok("outlines/ab.svg"));

    // Assert
    expect(runsBeforePause).toBe(0);
    expect(engine.run).toHaveBeenCalledTimes(1);
    expect(engine.run).toHaveBeenCalledWith("ab");
    expect(runningWhilePending).toBe(true);
    expect(result.current.running).toBe(false);
    expect(result.current.files.map((file) => file.path)).toEqual(["outlines/ab.svg"]);
    expect(result.current.error).toBeNull();
  });

  it("runs immediately on runNow, without waiting for the pause", () => {
    // Arrange
    const engine = controllableEngine();
    const { result } = renderHook(() => useGeneration(engine.run, "config", 500));

    // Act
    act(() => {
      result.current.runNow();
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Assert
    expect(engine.run).toHaveBeenCalledTimes(1);
  });

  it("ignores an older run that finishes after a newer one", async () => {
    // Arrange
    const engine = controllableEngine();
    const { result, rerender } = renderHook(({ config }) => useGeneration(engine.run, config, 500), {
      initialProps: { config: "old" },
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender({ config: "new" });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Act
    await engine.finish(1, ok("outlines/new.svg"));
    await engine.finish(0, ok("outlines/old.svg"));

    // Assert
    expect(result.current.files.map((file) => file.path)).toEqual(["outlines/new.svg"]);
    expect(result.current.running).toBe(false);
  });

  it("keeps the last good files on screen when a run fails, and shows the error", async () => {
    // Arrange
    const engine = controllableEngine();
    const { result, rerender } = renderHook(({ config }) => useGeneration(engine.run, config, 500), {
      initialProps: { config: "good" },
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    await engine.finish(0, ok("outlines/good.svg"));

    // Act
    rerender({ config: "broken" });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    await engine.finish(1, failed('Field "points" is missing'));

    // Assert
    expect(result.current.files.map((file) => file.path)).toEqual(["outlines/good.svg"]);
    expect(result.current.error).toBe('Field "points" is missing');
  });

  it("clears the error once a later run succeeds", async () => {
    // Arrange
    const engine = controllableEngine();
    const { result, rerender } = renderHook(({ config }) => useGeneration(engine.run, config, 500), {
      initialProps: { config: "broken" },
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    await engine.finish(0, failed("bad"));

    // Act
    rerender({ config: "fixed" });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    await engine.finish(1, ok("outlines/fixed.svg"));

    // Assert
    expect(result.current.error).toBeNull();
  });
});
