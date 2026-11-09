import { describe, expect, it } from "vitest";
import { drawingOffset, referenceTransform, worldBounds } from "./world";

const key = { name: "k", x: 160, y: -160, r: 0, width: 18, height: 18 };
const board = { size: { width: 119, height: 100 }, origin: { x: 150.19, y: -97.585 }, parts: [] };

describe("world coordinates (engine coordinates with y flipped for SVG)", () => {
  it("places an outline's drawing at its origin", () => {
    // Act / Assert
    expect(drawingOffset(board)).toEqual({ x: 150.19, y: 97.585 });
  });

  it("draws a reference centered on its point, turned the SVG way (clockwise is positive)", () => {
    // Act / Assert
    expect(referenceTransform({ ...key, r: 10 })).toBe("translate(160 160) rotate(-10)");
  });

  it("bounds the keys and the outline together", () => {
    // Act
    const bounds = worldBounds([key], board);

    // Assert: the key spans 151–169 in x and 151–169 in y; the board 150.19–269.19 and 97.585–197.585
    expect(bounds.x).toBeCloseTo(150.19);
    expect(bounds.y).toBeCloseTo(97.585);
    expect(bounds.x + bounds.width).toBeCloseTo(269.19);
    expect(bounds.y + bounds.height).toBeCloseTo(197.585);
  });

  it("counts a rotated key's corners", () => {
    // Act: a 18 × 18 key turned 45° reaches 9√2 from its center
    const bounds = worldBounds([{ ...key, r: 45 }], undefined);

    // Assert
    expect(bounds.width).toBeCloseTo(18 * Math.SQRT2);
    expect(bounds.x).toBeCloseTo(160 - 9 * Math.SQRT2);
  });

  it("has a small default area when there's nothing to bound", () => {
    // Act / Assert
    expect(worldBounds([], undefined)).toEqual({ x: 0, y: 0, width: 100, height: 100 });
  });
});
