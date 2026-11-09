import { describe, expect, it } from "vitest";
import { describePart, OPERATION_SYMBOLS, readPartFields, setPartField } from "./parts";

const CONFIG = `outlines:
  plate:
    - what: outline
      name: board_edge
    - what: rectangle
      where: /matrix/
      size: [kx - 1, ky - 1]
      operation: subtract
    - what: circle
      radius: 1.6
      operation: stack
  holes:
    left:
      what: rectangle
      size: 18
`;

describe("describePart", () => {
  it.each([
    ["plate", "0", { label: "board_edge", meta: "outline" }],
    ["plate", "1", { label: "#2 rectangle", meta: "kx - 1 × ky - 1" }],
    ["plate", "2", { label: "#3 circle", meta: "r 1.6" }],
    ["holes", "left", { label: "left", meta: "18 × 18" }],
  ])("describes %s part %s", (outline, part, expected) => {
    // Act / Assert
    expect(describePart(CONFIG, { outline, part })).toEqual(expected);
  });

  it("has a symbol for every operation", () => {
    // Assert
    expect(OPERATION_SYMBOLS).toEqual({ add: "+", subtract: "−", intersect: "∩", stack: "⧉" });
  });
});

const SHAPE = `outlines:
  board:
    - what: rectangle
      adjust:
        shift: [11.5, -40.5] # keep me
      size: [kx - 1, 100]
      corner: 3
    - what: circle
      radius: 1.6
      operation: subtract
`;

describe("readPartFields", () => {
  it("reads a rectangle's fields as they're written, formulas included", () => {
    // Act / Assert
    expect(readPartFields(SHAPE, { outline: "board", part: "0" })).toEqual({
      what: "rectangle",
      shiftX: "11.5",
      shiftY: "-40.5",
      width: "kx - 1",
      height: "100",
      corner: "3",
      operation: "add",
    });
  });

  it("reads empty fields for what's not set (a circle has no size here)", () => {
    // Act / Assert
    expect(readPartFields(SHAPE, { outline: "board", part: "1" })).toEqual({
      what: "circle",
      shiftX: "",
      shiftY: "",
      width: "",
      height: "",
      corner: "",
      operation: "subtract",
    });
  });
});

describe("setPartField", () => {
  it("writes a number or a formula in place, keeping comments", () => {
    // Act
    const shifted = setPartField(SHAPE, { outline: "board", part: "0" }, "shiftX", "20");
    const sized = setPartField(SHAPE, { outline: "board", part: "0" }, "height", "ky * 2");

    // Assert
    expect(shifted).toContain("shift: [20, -40.5] # keep me");
    expect(sized).toContain("size: [kx - 1, ky * 2]");
  });

  it("adds a shift to a part that has none", () => {
    // Act
    const edited = setPartField(SHAPE, { outline: "board", part: "1" }, "shiftY", "4");

    // Assert
    expect(readPartFields(edited, { outline: "board", part: "1" }).shiftY).toBe("4");
    expect(readPartFields(edited, { outline: "board", part: "1" }).shiftX).toBe("0");
  });

  it("sets the operation, and removes it when it's back to add", () => {
    // Act
    const stacked = setPartField(SHAPE, { outline: "board", part: "0" }, "operation", "stack");
    const added = setPartField(SHAPE, { outline: "board", part: "1" }, "operation", "add");

    // Assert
    expect(readPartFields(stacked, { outline: "board", part: "0" }).operation).toBe("stack");
    expect(added).not.toContain("operation:");
  });

  it("removes a field that's cleared", () => {
    // Act
    const square = setPartField(SHAPE, { outline: "board", part: "0" }, "corner", "");

    // Assert
    expect(square).not.toContain("corner:");
  });
});
