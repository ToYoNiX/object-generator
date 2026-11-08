import { describe, expect, it } from "vitest";
import type { EngineFile } from "@/engines/types";
import { groupFiles, pickSelection } from "./files";

const file = (path: string): EngineFile => ({
  path,
  kind: path.endsWith(".svg") ? "svg" : path.endsWith(".dxf") ? "dxf" : "kicad_pcb",
  content: "",
});

describe("pickSelection", () => {
  it("keeps the current file when it is still generated", () => {
    // Arrange
    const files = [file("outlines/a.svg"), file("outlines/b.svg")];

    // Act
    const selected = pickSelection(files, "outlines/b.svg");

    // Assert
    expect(selected).toBe("outlines/b.svg");
  });

  it("falls back to the first public outline SVG when the current file is gone", () => {
    // Arrange
    const files = [
      file("points/demo.svg"),
      file("outlines/_helper.svg"),
      file("outlines/board.dxf"),
      file("outlines/board.svg"),
    ];

    // Act
    const selected = pickSelection(files, "outlines/removed.svg");

    // Assert
    expect(selected).toBe("outlines/board.svg");
  });

  it("falls back to any SVG, then to any file", () => {
    // Arrange
    const onlyDemo = [file("pcbs/main.kicad_pcb"), file("points/demo.svg")];
    const onlyPcb = [file("pcbs/main.kicad_pcb")];

    // Act
    const fromDemo = pickSelection(onlyDemo, null);
    const fromPcb = pickSelection(onlyPcb, null);

    // Assert
    expect(fromDemo).toBe("points/demo.svg");
    expect(fromPcb).toBe("pcbs/main.kicad_pcb");
  });

  it("selects nothing when there are no files", () => {
    // Act
    const selected = pickSelection([], "outlines/board.svg");

    // Assert
    expect(selected).toBeNull();
  });
});

describe("groupFiles", () => {
  it("groups files by folder, in the order folders first appear", () => {
    // Arrange
    const files = [
      file("points/demo.svg"),
      file("outlines/board.svg"),
      file("outlines/board.dxf"),
      file("pcbs/main.kicad_pcb"),
    ];

    // Act
    const groups = groupFiles(files);

    // Assert
    expect(groups.map((group) => group.folder)).toEqual(["points", "outlines", "pcbs"]);
    expect(groups[1]?.files.map((entry) => entry.path)).toEqual(["outlines/board.svg", "outlines/board.dxf"]);
  });
});
