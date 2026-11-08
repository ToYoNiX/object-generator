import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import type { EngineFile } from "@/engines/types";
import { buildZip, fileName, mimeType } from "./download";

describe("fileName", () => {
  it("uses the last part of the file path", () => {
    // Act
    const name = fileName("outlines/board_edge.svg");

    // Assert
    expect(name).toBe("board_edge.svg");
  });
});

describe("mimeType", () => {
  it.each([
    ["svg", "image/svg+xml"],
    ["dxf", "application/dxf"],
    ["kicad_pcb", "text/plain"],
    ["jscad", "text/javascript"],
    ["yaml", "application/yaml"],
  ] as const)("maps %s files to %s", (kind, expected) => {
    // Act
    const type = mimeType(kind);

    // Assert
    expect(type).toBe(expected);
  });
});

describe("buildZip", () => {
  it("puts every file at its path, plus the config that produced them", async () => {
    // Arrange
    const files: EngineFile[] = [
      { path: "outlines/board.svg", kind: "svg", content: "<svg/>" },
      { path: "pcbs/main.kicad_pcb", kind: "kicad_pcb", content: "(kicad_pcb)" },
    ];

    // Act
    const blob = await buildZip(files, "points: {}");
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());

    // Assert
    expect(Object.keys(zip.files).filter((name) => !zip.files[name]?.dir)).toEqual([
      "config.yaml",
      "outlines/board.svg",
      "pcbs/main.kicad_pcb",
    ]);
    expect(await zip.file("config.yaml")?.async("string")).toBe("points: {}");
    expect(await zip.file("pcbs/main.kicad_pcb")?.async("string")).toBe("(kicad_pcb)");
  });
});
