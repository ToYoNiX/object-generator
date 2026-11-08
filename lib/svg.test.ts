// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { prepareSvg } from "./svg";

const ERGOGEN_SVG =
  '<svg width="119mm" height="100mm" viewBox="0 0 119 100" xmlns="http://www.w3.org/2000/svg">' +
  '<g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" stroke="#000" stroke-width="0.25mm" fill="none" ' +
  'style="stroke:#000;stroke-width:0.25mm;fill:none">' +
  '<path d="M 0 0 L 10 0" vector-effect="non-scaling-stroke"/></g></svg>';

const parse = (svg: string) => new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;

describe("prepareSvg", () => {
  it("makes the drawing fill its container and keeps its coordinate system", () => {
    // Act
    const root = parse(prepareSvg(ERGOGEN_SVG)!);

    // Assert
    expect(root.getAttribute("width")).toBe("100%");
    expect(root.getAttribute("height")).toBe("100%");
    expect(root.getAttribute("viewBox")).toBe("0 0 119 100");
  });

  it("draws strokes in the current text color so it follows the theme", () => {
    // Act
    const root = parse(prepareSvg(ERGOGEN_SVG)!);
    const group = root.querySelector("g")!;

    // Assert
    expect(group.getAttribute("stroke")).toBe("currentColor");
    expect(group.hasAttribute("style")).toBe(false);
    expect(group.getAttribute("fill")).toBe("none");
    expect(root.querySelector("path")?.getAttribute("d")).toBe("M 0 0 L 10 0");
  });

  it("removes anything that could run code or load other content", () => {
    // Arrange
    const hostile =
      '<svg viewBox="0 0 1 1" xmlns="http://www.w3.org/2000/svg" onload="alert(1)">' +
      "<script>alert(2)</script><foreignObject><div>x</div></foreignObject>" +
      '<a href="javascript:alert(3)"><path d="M0 0"/></a>' +
      '<path d="M0 0" onclick="alert(4)"/><use href="#x"/></svg>';

    // Act
    const prepared = prepareSvg(hostile)!;

    // Assert
    expect(prepared).not.toMatch(/script|foreignObject|onload|onclick|javascript|<a|<use|href/i);
    expect(parse(prepared).querySelectorAll("path")).toHaveLength(1);
  });

  it("returns null for text that is not an SVG", () => {
    // Act
    const prepared = prepareSvg("not <svg");

    // Assert
    expect(prepared).toBeNull();
  });
});
