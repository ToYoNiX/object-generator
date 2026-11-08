import { describe, expect, it } from "vitest";
import { applyChange, minimalChange } from "./text-diff";

describe("minimalChange", () => {
  it("returns null when the texts are equal", () => {
    // Act
    const change = minimalChange("size: 18", "size: 18");

    // Assert
    expect(change).toBeNull();
  });

  it("replaces only the part that differs", () => {
    // Arrange
    const before = "a: 1\nsize: [18, 18]\nb: 2\n";
    const after = "a: 1\nsize: [24.5, 18]\nb: 2\n";

    // Act
    const change = minimalChange(before, after);

    // Assert
    expect(change).toEqual({ from: 12, to: 14, insert: "24.5" });
  });

  it("handles pure insertions and pure deletions", () => {
    // Act
    const inserted = minimalChange("ab", "aXb");
    const deleted = minimalChange("aXb", "ab");

    // Assert
    expect(inserted).toEqual({ from: 1, to: 1, insert: "X" });
    expect(deleted).toEqual({ from: 1, to: 2, insert: "" });
  });

  it("does not let the common prefix and suffix overlap on repeated characters", () => {
    // Arrange
    const before = "aaa";
    const after = "aaaa";

    // Act
    const change = minimalChange(before, after);

    // Assert
    expect(change).not.toBeNull();
    expect(applyChange(before, change!)).toBe(after);
  });

  it.each([
    ["", "points: {}"],
    ["points: {}", ""],
    ["x: 1\ny: 2", "y: 2\nx: 1"],
    ["héllo wörld", "hello world"],
  ])("always produces a change that turns %j into %j", (before, after) => {
    // Act
    const change = minimalChange(before, after);

    // Assert
    expect(applyChange(before, change!)).toBe(after);
  });
});
