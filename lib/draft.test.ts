import { describe, expect, it } from "vitest";
import { parseDraft } from "./draft";

describe("parseDraft", () => {
  it("accepts a stored draft with an engine and a config", () => {
    // Arrange
    const stored: unknown = { engine: "ergogen", config: "points: {}" };

    // Act
    const draft = parseDraft(stored);

    // Assert
    expect(draft).toEqual({ engine: "ergogen", config: "points: {}" });
  });

  it("keeps an empty config, since clearing the editor is a valid draft", () => {
    // Arrange
    const stored: unknown = { engine: "ergogen", config: "" };

    // Act
    const draft = parseDraft(stored);

    // Assert
    expect(draft).toEqual({ engine: "ergogen", config: "" });
  });

  it.each([
    ["nothing stored", undefined],
    ["a plain string", "points: {}"],
    ["a missing engine", { config: "points: {}" }],
    ["a non-string config", { engine: "ergogen", config: 42 }],
    ["an empty engine id", { engine: "", config: "points: {}" }],
  ])("rejects %s", (_label, stored: unknown) => {
    // Act
    const draft = parseDraft(stored);

    // Assert
    expect(draft).toBeUndefined();
  });

  it("drops unknown fields so they are not written back", () => {
    // Arrange
    const stored: unknown = { engine: "ergogen", config: "a: 1", extra: true };

    // Act
    const draft = parseDraft(stored);

    // Assert
    expect(draft).toEqual({ engine: "ergogen", config: "a: 1" });
  });
});
