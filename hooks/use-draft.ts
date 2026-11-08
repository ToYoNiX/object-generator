"use client";

import { storage, type AppStore } from "@toyonix/web-kit/storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { DRAFT_KEY, parseDraft, type Draft } from "@/lib/draft";

export type DraftStore = Pick<AppStore, "get" | "set">;

export interface DraftState {
  /** null until the saved draft has been read (storage only exists in the browser). */
  draft: Draft | null;
  setConfig: (config: string) => void;
  /** Replaces engine and config at once, e.g. when loading an example. */
  setDraft: (draft: Draft) => void;
  /** True when the last save was refused (storage full or disabled), so the user can be told. */
  saveFailed: boolean;
}

/**
 * The draft being edited, kept in `storage.app`. Saves once typing pauses for `delayMs`, and
 * right away when the page is hidden or closed, so a pending edit isn't lost.
 *
 * `fallback` and `store` must be stable (module-level constants), since the saved draft is
 * read once on mount.
 */
export function useDraft(fallback: Draft, store: DraftStore = storage.app, delayMs = 400): DraftState {
  const [draft, setDraftState] = useState<Draft | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const current = useRef<Draft | null>(null);
  const unsaved = useRef<Draft | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const restored = parseDraft(store.get(DRAFT_KEY)) ?? fallback;
    current.current = restored;
    // Reading storage has to wait for the browser; the first render matches the static HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftState(restored);
  }, [fallback, store]);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    const next = unsaved.current;
    if (!next) return;
    unsaved.current = null;
    setSaveFailed(!store.set(DRAFT_KEY, next));
  }, [store]);

  const update = useCallback(
    (next: Draft) => {
      current.current = next;
      unsaved.current = next;
      setDraftState(next);
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delayMs);
    },
    [delayMs, flush],
  );

  const setConfig = useCallback(
    (config: string) => update({ ...(current.current ?? fallback), config }),
    [fallback, update],
  );

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHidden);
      flush();
    };
  }, [flush]);

  return { draft, setConfig, setDraft: update, saveFailed };
}
