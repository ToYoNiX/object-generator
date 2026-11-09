import { describe, expect, it } from "vitest";
import { pathBounds } from "./svg-path";

const expectBox = (
  box: ReturnType<typeof pathBounds>,
  expected: { x: number; y: number; width: number; height: number },
) => {
  expect(box).not.toBeNull();
  expect(box?.x).toBeCloseTo(expected.x, 3);
  expect(box?.y).toBeCloseTo(expected.y, 3);
  expect(box?.width).toBeCloseTo(expected.width, 3);
  expect(box?.height).toBeCloseTo(expected.height, 3);
};

describe("pathBounds", () => {
  it("bounds a straight-sided shape", () => {
    // Act / Assert
    expectBox(pathBounds("M 3 1 L 9 1 L 9 6 L 3 6 Z"), { x: 3, y: 1, width: 6, height: 5 });
  });

  it("bounds a circle written with relative arcs, as makerjs exports it", () => {
    // Arrange: a circle of radius 5 centered on (11.5, 5)
    const circle = "M 11.5 5 m -5 0 a 5 5 0 0 1 10 0 a 5 5 0 0 1 -10 0 z";

    // Act / Assert: the arcs bulge 5 above and below their end points
    expectBox(pathBounds(circle), { x: 6.5, y: 0, width: 10, height: 10 });
  });

  it("bounds a rounded rectangle, whose corner arcs stay inside its sides", () => {
    // Arrange: 23.05 square with 2 mm corners, from makerjs
    const rounded =
      "M 2 42.05 L 21.05 42.05 A 2 2 0 0 0 23.05 40.05 L 23.05 21 A 2 2 0 0 0 21.05 19 L 2 19 A 2 2 0 0 0 0 21 L 0 40.05 A 2 2 0 0 0 2 42.05 Z";

    // Act / Assert
    expectBox(pathBounds(rounded), { x: 0, y: 19, width: 23.05, height: 23.05 });
  });

  it("includes how far a curve bulges past its end points", () => {
    // Act: a cubic from (20, 0) to (24, 0) whose control points pull it down to y = 3.75
    const box = pathBounds("M 20 0 C 21 5 23 5 24 0");

    // Assert
    expectBox(box, { x: 20, y: 0, width: 4, height: 3.75 });
  });

  it("follows relative, horizontal and vertical commands", () => {
    // Act / Assert
    expectBox(pathBounds("m 1 1 l 2 0 v 3 h -2 z"), { x: 1, y: 1, width: 2, height: 3 });
    expectBox(pathBounds("M0,0L5-2 7.5,1"), { x: 0, y: -2, width: 7.5, height: 3 });
  });

  it("is null for an empty path", () => {
    // Act / Assert
    expect(pathBounds("")).toBeNull();
  });
});
