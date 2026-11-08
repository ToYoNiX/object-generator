import { describe, expect, it } from "vitest";
import { readIntent } from "./intent";

describe("readIntent", () => {
  it.each([
    ["?new", { kind: "new" }],
    ["?new=1", { kind: "new" }],
    ["?example=sblit36", { kind: "example", id: "sblit36" }],
    ["?example=sblit36&new", { kind: "example", id: "sblit36" }],
  ])("reads %s", (search, expected) => {
    // Act
    const intent = readIntent(search);

    // Assert
    expect(intent).toEqual(expected);
  });

  it.each([[""], ["?example="], ["?other=1"]])("continues the draft for %j", (search) => {
    // Act
    const intent = readIntent(search);

    // Assert
    expect(intent).toBeNull();
  });
});
