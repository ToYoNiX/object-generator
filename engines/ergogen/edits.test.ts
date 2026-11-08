import { describe, expect, it } from "vitest";
import { readValue } from "@/lib/yaml-edit";
import { addPart, deletePart, movePart, moveShape, offsetValue, resizeShape, setCornerRadius } from "./edits";

const CONFIG = `outlines:
  # the board
  board:
    - what: rectangle
      adjust:
        ref: matrix_middle_bottom
        shift: [11.5, -40.5] # from the middle key
      size: [119, 100]
    - what: rectangle
      where: /matrix/
      size: [kx - 1, ky - 1]
  holes:
    left:
      what: circle
      radius: 1.6
`;

const board0 = { outline: "board", part: "0" };
const keycaps = { outline: "board", part: "1" };
const UPRIGHT = { r: 0, mirrored: false };

describe("moveShape", () => {
  it("adds the distance to an existing shift, touching nothing else", () => {
    // Act
    const edited = moveShape(CONFIG, board0, { x: 3.5, y: -2 }, UPRIGHT);

    // Assert
    expect(edited).toBe(CONFIG.replace("[11.5, -40.5]", "[15, -42.5]"));
  });

  it("adds a shift (and an adjust) when there is none", () => {
    // Act
    const edited = moveShape(CONFIG, keycaps, { x: 1, y: 2 }, UPRIGHT);

    // Assert
    expect(readValue(edited, ["outlines", "board", 1, "adjust", "shift"])).toEqual([1, 2]);
    expect(edited).toContain("# from the middle key");
  });

  it("moves in the key's own frame when the key is rotated", () => {
    // Act: moving straight right on screen, on a key turned 90° counter-clockwise
    const edited = moveShape(CONFIG, board0, { x: 2, y: 0 }, { r: 90, mirrored: false });

    // Assert: in the key's frame that's "down" (negative y)
    expect(readValue(edited, ["outlines", "board", 0, "adjust", "shift"])).toEqual([11.5, -42.5]);
  });

  it("flips x on a mirrored placement", () => {
    // Act
    const edited = moveShape(CONFIG, board0, { x: 2, y: 0 }, { r: 0, mirrored: true });

    // Assert
    expect(readValue(edited, ["outlines", "board", 0, "adjust", "shift"])).toEqual([9.5, -40.5]);
  });
});

describe("resizeShape", () => {
  it("adds to plain sizes and keeps formulas, folding repeated changes into one offset", () => {
    // Act
    const wider = resizeShape(CONFIG, board0, { width: 10, height: 0 });
    const keysOnce = resizeShape(CONFIG, keycaps, { width: 2, height: -0.5 });
    const keysTwice = resizeShape(keysOnce, keycaps, { width: 1.5, height: 0 });

    // Assert
    expect(wider).toBe(CONFIG.replace("[119, 100]", "[129, 100]"));
    expect(keysOnce).toContain("size: [kx + 1, ky - 1.5]");
    expect(keysTwice).toContain("size: [kx + 2.5, ky - 1.5]");
  });

  it("drops an offset that comes back to zero", () => {
    // Act
    const edited = resizeShape(CONFIG, keycaps, { width: 1, height: 1 });

    // Assert
    expect(edited).toContain("size: [kx, ky]");
  });

  it("resizes a circle through its radius", () => {
    // Act
    const edited = resizeShape(CONFIG, { outline: "holes", part: "left" }, { width: 1, height: 1 });

    // Assert: the diameter grew by 1
    expect(readValue(edited, ["outlines", "holes", "left", "radius"])).toBe(2.1);
  });
});

describe("setCornerRadius", () => {
  it("sets a rectangle's corner radius, adding the key if needed", () => {
    // Act
    const edited = setCornerRadius(CONFIG, board0, 3);

    // Assert
    expect(readValue(edited, ["outlines", "board", 0, "corner"])).toBe(3);
    expect(edited).toContain("# the board");
  });

  it("removes the key for square corners", () => {
    // Arrange
    const rounded = setCornerRadius(CONFIG, board0, 3);

    // Act
    const square = setCornerRadius(rounded, board0, 0);

    // Assert
    expect(readValue(square, ["outlines", "board", 0, "corner"])).toBeUndefined();
  });
});

describe("parts", () => {
  it("adds a part at the end of an outline", () => {
    // Act
    const edited = addPart(CONFIG, "board", { what: "circle", radius: 3 });

    // Assert
    expect(readValue(edited, ["outlines", "board", 2])).toEqual({ what: "circle", radius: 3 });
  });

  it("adds a part to a named outline under a new name, and creates a missing outline", () => {
    // Act
    const named = addPart(CONFIG, "holes", { what: "circle", radius: 1 });
    const created = addPart(CONFIG, "logo", { what: "rectangle", size: [5, 5] });

    // Assert
    expect(readValue(named, ["outlines", "holes", "circle_1"])).toEqual({ what: "circle", radius: 1 });
    expect(readValue(created, ["outlines", "logo", 0])).toEqual({ what: "rectangle", size: [5, 5] });
  });

  it("deletes a part", () => {
    // Act
    const edited = deletePart(CONFIG, board0);

    // Assert
    expect(readValue(edited, ["outlines", "board"])).toEqual([
      { what: "rectangle", where: "/matrix/", size: ["kx - 1", "ky - 1"] },
    ]);
  });

  it("reorders parts, which changes what's added or cut first", () => {
    // Act
    const edited = movePart(CONFIG, keycaps, 0);

    // Assert
    expect(readValue(edited, ["outlines", "board", 0, "where"])).toBe("/matrix/");
    expect(readValue(edited, ["outlines", "board", 1, "size"])).toEqual([119, 100]);
  });
});

describe("offsetValue", () => {
  it.each([
    [10, 2.5, 12.5],
    ["u", 2, "u + 2"],
    ["kx - 1", 2, "kx + 1"],
    ["2 * kx - 1", -0.5, "2 * kx - 1.5"],
    // A trailing number that's part of a product isn't an offset to fold into.
    ["a * -3", 1, "a * -3 + 1"],
    [undefined, 4, 4],
  ])("%j plus %s is %j", (value, delta, expected) => {
    // Act / Assert
    expect(offsetValue(value, delta)).toEqual(expected);
  });
});
