// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findRange } from "@/lib/yaml-edit";
import { YamlEditor } from "./YamlEditor";

afterEach(cleanup);

const CONFIG = `outlines:
  board:
    - what: rectangle
      size: [20, 10]
    - what: rectangle
      size: [5, 5]
      corner: 2
`;

const highlighted = (container: HTMLElement) =>
  Array.from(container.querySelectorAll(".og-yaml-highlight")).map((line) => line.textContent?.trim());

describe("YamlEditor highlight", () => {
  it("marks the lines of the highlighted range, and follows a new range", () => {
    // Arrange
    const first = findRange(CONFIG, ["outlines", "board", 0]);
    const second = findRange(CONFIG, ["outlines", "board", 1]);
    const props = { value: CONFIG, onChange: vi.fn(), "aria-label": "YAML" };

    // Act
    const { container, rerender } = render(<YamlEditor {...props} highlight={first} highlightKey="0" />);
    const before = highlighted(container);
    rerender(<YamlEditor {...props} highlight={second} highlightKey="1" />);

    // Assert
    expect(before).toEqual(["- what: rectangle", "size: [20, 10]"]);
    expect(highlighted(container)).toEqual(["- what: rectangle", "size: [5, 5]", "corner: 2"]);
  });

  it("marks nothing without a range", () => {
    // Act
    const { container } = render(
      <YamlEditor value={CONFIG} onChange={vi.fn()} aria-label="YAML" highlight={null} highlightKey={null} />,
    );

    // Assert
    expect(highlighted(container)).toEqual([]);
  });
});
