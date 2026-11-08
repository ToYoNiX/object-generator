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
