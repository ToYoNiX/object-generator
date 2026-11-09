"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EngineFile, EngineResult, OutlineShapes, Reference } from "@/engines/types";

export interface GenerationState {
  /** Files from the last successful run. Kept while a later run fails, so the preview stays. */
  files: EngineFile[];
  /** Where each outline's parts are, from the same run as `files` (kept on failure too). */
  shapes: Record<string, OutlineShapes>;
  /** Marks to draw behind the outlines (the keys), from the same run. */
  references: Reference[];
  /** Error of the latest run, or null if it succeeded. */
  error: string | null;
  /** How many runs have finished (successful or not): changes whenever a run is done. */
  revision: number;
  /** True while the latest run is in progress. */
  running: boolean;
  /** Runs right away instead of waiting for the pause. */
  runNow: () => void;
  /**
   * Takes a result already made for `config` (an edit checked by running the engine on it), so
   * the engine isn't run again when `config` becomes the current config.
   */
  accept: (config: string, result: EngineResult) => void;
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
  const [references, setReferences] = useState<Reference[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [revision, setRevision] = useState(0);
  const latestRun = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latestConfig = useRef(config);
  // The config whose result was handed over with accept: no need to run it again.
  const accepted = useRef<string | null>(null);

  const show = useCallback((result: EngineResult) => {
    setRevision((count) => count + 1);
    if (result.ok) {
      setFiles(result.files);
      setShapes(result.shapes);
      setReferences(result.references);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  const start = useCallback(
    async (input: string) => {
      clearTimeout(timer.current);
      const id = ++latestRun.current;
      setRunning(true);
      const result = await run(input);
      if (id !== latestRun.current) return;
      setRunning(false);
      show(result);
    },
    [run, show],
  );

  useEffect(() => {
    latestConfig.current = config;
    if (config === null || config === accepted.current) return;
    timer.current = setTimeout(() => void start(config), delayMs);
    return () => clearTimeout(timer.current);
  }, [config, delayMs, start]);

  const runNow = useCallback(() => {
    if (latestConfig.current !== null) void start(latestConfig.current);
  }, [start]);

  const accept = useCallback(
    (input: string, result: EngineResult) => {
      clearTimeout(timer.current);
      // A run still going for an older config must not replace this result.
      latestRun.current++;
      setRunning(false);
      accepted.current = input;
      show(result);
    },
    [show],
  );

  return { files, shapes, references, error, revision, running, runNow, accept };
}
