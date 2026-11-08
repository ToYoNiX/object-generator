import { describe, expect, it } from "vitest";
import { describePart, OPERATION_SYMBOLS } from "./parts";

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
