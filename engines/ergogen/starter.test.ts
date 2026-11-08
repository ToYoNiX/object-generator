import { describe, expect, it } from "vitest";
import { runErgogen } from "./run";
import { starterConfig } from "./starter";

describe("starterConfig", () => {
  it("generates its key and board outlines", async () => {
    // Act
    const result = await runErgogen(starterConfig);

    // Assert
    if (!result.ok) throw new Error(result.error);
    const paths = result.files.map((file) => file.path);
    expect(paths).toEqual(expect.arrayContaining(["outlines/keys.svg", "outlines/board.svg"]));
    expect(result.files.find((file) => file.path === "outlines/board.svg")?.content).toContain("<svg");
  });
});
