import { describe, expect, it } from "vitest";
import { addPart } from "./edits";
import { SHAPE_PRESETS } from "./presets";
import { runErgogen } from "./run";
import { starterConfig } from "./starter";

describe("SHAPE_PRESETS", () => {
  it.each(SHAPE_PRESETS.map((preset) => [preset.label, preset] as const))(
    "%s generates in Ergogen, placed where asked",
    async (_label, preset) => {
      // Arrange
      const { config, part } = addPart(starterConfig, "board", preset.part({ x: 40, y: -12.25 }));

      // Act
      const result = await runErgogen(config);

      // Assert
      if (!result.ok) throw new Error(result.error);
      const added = result.shapes.board?.parts.find((candidate) => candidate.name === part);
      expect(added?.placements[0]).toMatchObject({ x: 40, y: -12.25, point: null });
    },
  );
});

describe("the Circle preset", () => {
  it("is a square with corners half its side, which Ergogen draws as a circle", async () => {
    // Arrange
    const circle = SHAPE_PRESETS.find((preset) => preset.id === "circle");
    const { config, part } = addPart(starterConfig, "board", circle?.part({ x: 0, y: 0 }) ?? {});

    // Act
    const result = await runErgogen(config);

    // Assert: a 10 mm circle is two half-arcs of radius 5
    expect(circle?.part({ x: 0, y: 0 })).toMatchObject({ what: "rectangle", size: [10, 10], corner: 5 });
    if (!result.ok) throw new Error(result.error);
    const path = result.shapes.board?.parts.find((candidate) => candidate.name === part)?.placements[0]?.path;
    expect(path?.match(/A 5 5/g)).toHaveLength(2);
    expect(path).not.toMatch(/ L /);
  });
});
