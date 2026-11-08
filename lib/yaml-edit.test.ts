import { describe, expect, it } from "vitest";
import { formatNumber, readValue, setScalar, updateDocument } from "./yaml-edit";

const CONFIG = `# my keyboard
outlines:
  board:
    - what: rectangle # the outer edge
      adjust:
        shift: [  0,     -3.175 ]   # aligned on purpose
      size: [119, 100]
`;

describe("formatNumber", () => {
  it.each([
    [3.5, "3.5"],
    [-40.5, "-40.5"],
    [0.1 + 0.2, "0.3"],
    [12.000049, "12"],
    [-0, "0"],
  ])("writes %s as %s", (value, expected) => {
    // Act / Assert
    expect(formatNumber(value)).toBe(expected);
  });
});

describe("readValue", () => {
  it("reads the value at a path, or undefined", () => {
    // Act / Assert
    expect(readValue(CONFIG, ["outlines", "board", 0, "size"])).toEqual([119, 100]);
    expect(readValue(CONFIG, ["outlines", "board", 0, "corner"])).toBeUndefined();
  });
});

describe("setScalar", () => {
  it("replaces only that value's text, keeping comments and spacing everywhere else", () => {
    // Act
    const edited = setScalar(CONFIG, ["outlines", "board", 0, "adjust", "shift", 1], -1.5);

    // Assert
    expect(edited).toBe(CONFIG.replace("-3.175", "-1.5"));
  });

  it("writes a formula as plain text", () => {
    // Act
    const edited = setScalar(CONFIG, ["outlines", "board", 0, "size", 0], "kx - 1");

    // Assert
    expect(edited).toContain("size: [kx - 1, 100]");
  });

  it("adds a missing key, keeping the comments", () => {
    // Act
    const edited = setScalar(CONFIG, ["outlines", "board", 0, "corner"], 2);

    // Assert
    expect(readValue(edited, ["outlines", "board", 0, "corner"])).toBe(2);
    expect(edited).toContain("# my keyboard");
    expect(edited).toContain("# the outer edge");
    expect(edited).toContain("# aligned on purpose");
  });
});

describe("updateDocument", () => {
  it("applies a structural change and keeps the comments", () => {
    // Act
    const edited = updateDocument(CONFIG, (doc) => {
      doc.addIn(["outlines", "board"], { what: "circle", radius: 2 });
    });

    // Assert
    expect(readValue(edited, ["outlines", "board", 1])).toEqual({ what: "circle", radius: 2 });
    expect(edited).toContain("# the outer edge");
    expect(edited).toContain("size: [119, 100]");
  });

  it("throws on a config it can't parse, instead of writing over it", () => {
    // Act / Assert
    expect(() => updateDocument("a: [1, 2\n", () => {})).toThrow();
  });
});
