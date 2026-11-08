import { describe, expect, it } from "vitest";
import { DEFAULT_PANELS, parsePanels } from "./panels";

describe("parsePanels", () => {
  it("restores stored panel states", () => {
    // Arrange
    const stored: unknown = { yaml: false, files: true };

    // Act
    const panels = parsePanels(stored);

    // Assert
    expect(panels).toEqual({ yaml: false, files: true });
  });

  it("opens a panel whose stored state is missing or not a boolean", () => {
    // Arrange
    const stored: unknown = { yaml: "no" };

    // Act
    const panels = parsePanels(stored);

    // Assert
    expect(panels).toEqual({ yaml: true, files: true });
  });

  it.each([
    ["nothing stored", undefined],
    ["a string", "yaml"],
    ["null", null],
  ])("opens everything for %s", (_label, stored: unknown) => {
    // Act
    const panels = parsePanels(stored);

    // Assert
    expect(panels).toEqual(DEFAULT_PANELS);
  });
});
