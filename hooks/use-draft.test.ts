// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Draft } from "@/lib/draft";
import { useDraft, type DraftStore } from "./use-draft";

const FALLBACK: Draft = { engine: "ergogen", config: "example: true" };

/** An in-memory stand-in for storage.app that can be told to refuse writes (storage full). */
function fakeStore(initial?: unknown, { full = false } = {}) {
  const values = new Map<string, unknown>(initial === undefined ? [] : [["draft", initial]]);
  const store: DraftStore & { full: boolean } = {
    full,
    get: <T>(key: string) => values.get(key) as T | undefined,
    set: vi.fn((key: string, value: unknown) => {
      if (store.full) return false;
      values.set(key, value);
      return true;
    }),
  };
  return store;
}

describe("useDraft", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("restores the saved draft", () => {
    // Arrange
    const store = fakeStore({ engine: "ergogen", config: "saved: true" });

    // Act
    const { result } = renderHook(() => useDraft(FALLBACK, store));

    // Assert
    expect(result.current.draft).toEqual({ engine: "ergogen", config: "saved: true" });
  });

  it("starts from the fallback when nothing valid is saved", () => {
    // Arrange
    const store = fakeStore({ engine: 1 });

    // Act
    const { result } = renderHook(() => useDraft(FALLBACK, store));

    // Assert
    expect(result.current.draft).toEqual(FALLBACK);
  });

  it("saves edits once typing pauses, not on every keystroke", () => {
    // Arrange
    const store = fakeStore();
    const { result } = renderHook(() => useDraft(FALLBACK, store, 400));

    // Act
    act(() => {
      result.current.setConfig("a");
    });
    act(() => {
      result.current.setConfig("ab");
    });
    act(() => {
      vi.advanceTimersByTime(399);
    });
    const writesBeforePause = vi.mocked(store.set).mock.calls.length;
    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Assert
    expect(result.current.draft?.config).toBe("ab");
    expect(writesBeforePause).toBe(0);
    expect(store.set).toHaveBeenCalledTimes(1);
    expect(store.set).toHaveBeenCalledWith("draft", { engine: "ergogen", config: "ab" });
  });

  it("saves a pending edit right away when the page is being left", () => {
    // Arrange
    const store = fakeStore();
    const { result } = renderHook(() => useDraft(FALLBACK, store, 400));
    act(() => {
      result.current.setConfig("unsaved");
    });

    // Act
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });

    // Assert
    expect(store.set).toHaveBeenCalledWith("draft", { engine: "ergogen", config: "unsaved" });
  });

  it("reports when the draft could not be saved, and clears it after a later save works", () => {
    // Arrange
    const store = fakeStore(undefined, { full: true });
    const { result } = renderHook(() => useDraft(FALLBACK, store, 400));

    // Act
    act(() => {
      result.current.setConfig("too big");
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    const failedAfterFullStorage = result.current.saveFailed;
    store.full = false;
    act(() => {
      result.current.setConfig("smaller");
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Assert
    expect(failedAfterFullStorage).toBe(true);
    expect(result.current.saveFailed).toBe(false);
  });

  it("replaces the whole draft when loading an example", () => {
    // Arrange
    const store = fakeStore();
    const { result } = renderHook(() => useDraft(FALLBACK, store, 400));

    // Act
    act(() => {
      result.current.setDraft({ engine: "ergogen", config: "example: 2" });
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Assert
    expect(result.current.draft).toEqual({ engine: "ergogen", config: "example: 2" });
    expect(store.set).toHaveBeenLastCalledWith("draft", { engine: "ergogen", config: "example: 2" });
  });
});
