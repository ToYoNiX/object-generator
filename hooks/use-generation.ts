"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EngineFile, EngineResult, OutlineShapes } from "@/engines/types";

export interface GenerationState {
  /** Files from the last successful run. Kept while a later run fails, so the preview stays. */
  files: EngineFile[];
  /** Where each outline's parts are, from the same run as `files` (kept on failure too). */
  shapes: Record<string, OutlineShapes>;
  /** Error of the latest run, or null if it succeeded. */
  error: string | null;
  /** True while the latest run is in progress. */
  running: boolean;
  /** Runs right away instead of waiting for the pause. */
  runNow: () => void;
}

/**
 * Runs the engine on `config` once it stops changing for `delayMs`. Only the newest run's
 * result is used: a slow older run that finishes later is ignored. `run` must be stable.
 */
export function useGeneration(
  run: (config: string) => Promise<EngineResult>,
  config: string | null,
  delayMs = 500,
): GenerationState {
  const [files, setFiles] = useState<EngineFile[]>([]);
  const [shapes, setShapes] = useState<Record<string, OutlineShapes>>({});
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const latestRun = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestConfig = useRef(config);

  const start = useCallback(
    async (input: string) => {
      clearTimeout(timer.current);
      const id = ++latestRun.current;
      setRunning(true);
      const result = await run(input);
      if (id !== latestRun.current) return;
      setRunning(false);
      if (result.ok) {
        setFiles(result.files);
        setShapes(result.shapes);
        setError(null);
      } else {
        setError(result.error);
      }
    },
    [run],
  );

  useEffect(() => {
    latestConfig.current = config;
    if (config === null) return;
    timer.current = setTimeout(() => void start(config), delayMs);
    return () => clearTimeout(timer.current);
  }, [config, delayMs, start]);

  const runNow = useCallback(() => {
    if (latestConfig.current !== null) void start(latestConfig.current);
  }, [start]);

  return { files, shapes, error, running, runNow };
}
