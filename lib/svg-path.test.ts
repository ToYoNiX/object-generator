import { describe, expect, it } from "vitest";
import { pathBounds, pathPoints } from "./svg-path";

describe("pathPoints", () => {
  it("reads the end point of each command (lines, arcs, curves), not arc radii or flags", () => {
    // Arrange: a 10 × 4 rectangle with one rounded corner, then a curve
    const d = "M 1 0 L 10 0 L 10 4 L 1 4 A 1 1 0 0 1 0 3 L 0 1 Z M 20 0 C 21 5 23 5 24 0";

    // Act
    const points = pathPoints(d);

    // Assert
    expect(points).toEqual([
      { x: 1, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 4 },
      { x: 1, y: 4 },
      { x: 0, y: 3 },
      { x: 0, y: 1 },
      { x: 20, y: 0 },
      { x: 24, y: 0 },
    ]);
  });

  it("reads numbers without spaces and repeated coordinates after one command", () => {
    // Act / Assert
    expect(pathPoints("M0,0L5-2 7.5,1")).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: -2 },
      { x: 7.5, y: 1 },
    ]);
  });
});

describe("pathBounds", () => {
  it("is the box around a path's points", () => {
    // Act
    const box = pathBounds("M 3 1 L 9 1 L 9 6 L 3 6 Z");

    // Assert
    expect(box).toEqual({ x: 3, y: 1, width: 6, height: 5 });
  });

  it("is null for an empty path", () => {
    // Act / Assert
    expect(pathBounds("")).toBeNull();
  });
});
