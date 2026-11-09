import { describe, expect, it } from "vitest";
import { fittingCorner, radiusFromDrag, resizeFromHandle } from "./handles";

describe("resizeFromHandle (world coordinates: y down)", () => {
  it("grows from the right edge and moves the center half as far, so the left edge stays", () => {
    // Act
    const change = resizeFromHandle({ x: 1, y: 0 }, { x: 10, y: 3 });

    // Assert: y movement on a side handle does nothing
    expect(change).toEqual({ grow: { width: 10, height: 0 }, move: { x: 5, y: 0 } });
  });

  it("grows from the top-left corner: up and left are bigger, the center moves up-left", () => {
    // Act
    const change = resizeFromHandle({ x: -1, y: -1 }, { x: -4, y: -6 });

    // Assert: the engine's y points up, so moving up is +y there
    expect(change).toEqual({ grow: { width: 4, height: 6 }, move: { x: -2, y: 3 } });
  });
});

describe("radiusFromDrag", () => {
  it("rounds more when the top-left corner handle moves in, less when it moves out", () => {
    // Act / Assert
    expect(radiusFromDrag(3, { x: 2, y: 2 }, 10)).toBe(5);
    expect(radiusFromDrag(3, { x: -2, y: -1 }, 10)).toBe(1.5);
  });

  it("stays between square (0) and half the shorter side", () => {
    // Act / Assert
    expect(radiusFromDrag(3, { x: -9, y: -9 }, 10)).toBe(0);
    expect(radiusFromDrag(3, { x: 20, y: 20 }, 10)).toBe(10);
  });
});

describe("fittingCorner", () => {
  it("keeps the corner when it still fits", () => {
    // Act / Assert
    expect(fittingCorner(3, { width: 20, height: 10 })).toBe(3);
  });

  it("shrinks the corner with the shape, so a shrunk circle stays a circle", () => {
    // Act: a 10 mm circle (corner 5) shrunk to 6 × 6
    const corner = fittingCorner(5, { width: 6, height: 6 });

    // Assert
    expect(corner).toBe(3);
  });
});
