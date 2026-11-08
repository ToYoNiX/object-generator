// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PANELS_KEY } from "@/lib/panels";
import { usePanels, type PanelStore } from "./use-panels";

function memoryStore(initial: Record<string, unknown> = {}): PanelStore & { data: Record<string, unknown> } {
  const data = { ...initial };
  return {
    data,
    get: <T>(key: string) => data[key] as T | undefined,
    set: (key: string, value: unknown) => {
      data[key] = value;
      return true;
    },
  };
}

describe("usePanels", () => {
  it("restores the saved layout", () => {
    // Arrange
    const store = memoryStore({ [PANELS_KEY]: { yaml: false, files: true } });

    // Act
    const { result } = renderHook(() => usePanels(store));

    // Assert
    expect(result.current.panels).toEqual({ yaml: false, files: true });
  });

  it("saves a panel being hidden", () => {
    // Arrange
    const store = memoryStore();
    const { result } = renderHook(() => usePanels(store));

    // Act
    act(() => {
      result.current.setPanel("files", false);
    });

    // Assert
    expect(result.current.panels).toEqual({ yaml: true, files: false });
    expect(store.data[PANELS_KEY]).toEqual({ yaml: true, files: false });
  });
});
