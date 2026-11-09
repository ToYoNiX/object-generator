import { describe, expect, it } from "vitest";
import { sblit36 } from "./examples/sblit36";
import { runErgogen } from "./run";

describe("runErgogen", () => {
  it("generates the outlines and the PCB for the Sblit36", async () => {
    // Arrange
    const config = sblit36.config;

    // Act
    const result = await runErgogen(config);

    // Assert
    if (!result.ok) throw new Error(result.error);
    const paths = result.files.map((file) => file.path);
    expect(paths).toContain("outlines/board_edge.svg");
    expect(paths).toContain("outlines/board_edge.dxf");
    expect(paths).toContain("pcbs/tnx_sblit36.kicad_pcb");
    const board = result.files.find((file) => file.path === "outlines/board_edge.svg");
    expect(board?.kind).toBe("svg");
    expect(board?.content).toContain("<svg");
  });

  it("reports where each part of each outline is placed, lined up with its SVG", async () => {
    // Arrange
    const config = sblit36.config;

    // Act
    const result = await runErgogen(config);

    // Assert
    if (!result.ok) throw new Error(result.error);
    const plate = result.shapes.switch_plate;
    expect(plate?.parts.map((part) => [part.name, part.what, part.operation])).toEqual([
      ["0", "outline", "add"],
      ["1", "outline", "subtract"],
      ["2", "outline", "stack"],
    ]);
    const keycaps = result.shapes.key_keycaps?.parts[0]?.placements ?? [];
    expect(keycaps).toHaveLength(18);
    expect(keycaps[0]?.point).toBe("matrix_pinky_top");
    // board_edge's one rectangle fills its whole SVG (viewBox 0 0 119 100).
    const board = result.shapes.board_edge;
    expect(board?.size).toEqual({ width: 119, height: 100 });
    // Its drawing's top-left corner, in Ergogen's coordinates (y up): x of the left edge, y of the top.
    expect(board?.origin).toEqual({ x: 150.19, y: -97.585 });
    expect(board?.parts[0]?.placements[0]?.path).toBe("M 0 100 L 119 100 L 119 0 L 0 0 L 0 100 Z");
  });

  it("gives the keys as references to draw behind the outlines", async () => {
    // Act
    const result = await runErgogen(sblit36.config);

    // Assert
    if (!result.ok) throw new Error(result.error);
    expect(result.references).toHaveLength(18);
    expect(result.references[0]).toEqual({
      name: "matrix_pinky_top",
      x: 160,
      y: -160,
      r: 0,
      width: 18,
      height: 18,
    });
    expect(result.references.some((key) => key.r !== 0)).toBe(true);
  });

  it("gives an empty path, not none, for a part with nothing left to draw", async () => {
    // Arrange: "ref" places "cut", whose rectangle subtracts everything from it
    const config = `points:
  zones:
    m:
outlines:
  dots:
    - what: circle
      radius: 5
  cut:
    - what: outline
      name: dots
    - what: rectangle
      size: [100, 100]
      operation: subtract
  ref:
    - what: outline
      name: cut
`;

    // Act
    const result = await runErgogen(config);

    // Assert
    if (!result.ok) throw new Error(result.error);
    expect(result.shapes.ref?.parts[0]?.placements[0]?.path).toBe("");
  });

  it("returns the error instead of throwing when the config is invalid", async () => {
    // Arrange
    const config = "units:\n  kx: 19\n";

    // Act
    const result = await runErgogen(config);

    // Assert
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/points/);
  });
});
