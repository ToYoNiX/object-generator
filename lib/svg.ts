/**
 * Prepares an engine's SVG output to be inlined in the page.
 *
 * Engine output is built from the user's config, and configs get shared, so the SVG is parsed
 * and rebuilt from an allowlist instead of trusted: only drawing elements and presentation
 * attributes survive, so nothing in it can run code or load other content.
 *
 * It also makes the drawing fill its container (keeping its viewBox) and draws every stroke
 * in `currentColor`, so outlines follow the theme's text color in light and dark mode.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

const ALLOWED_ELEMENTS = new Set([
  "svg",
  "g",
  "path",
  "line",
  "polyline",
  "polygon",
  "rect",
  "circle",
  "ellipse",
  "text",
  "tspan",
]);

const ALLOWED_ATTRIBUTES = new Set([
  "viewBox",
  "preserveAspectRatio",
  "id",
  "d",
  "points",
  "x",
  "y",
  "x1",
  "y1",
  "x2",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "width",
  "height",
  "transform",
  "fill",
  "fill-rule",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "vector-effect",
  "font-size",
  "text-anchor",
]);

export function prepareSvg(svg: string): string | null {
  const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
  const root = parsed.documentElement;
  if (root.localName !== "svg" || root.namespaceURI !== SVG_NS || parsed.querySelector("parsererror")) {
    return null;
  }

  const clean = copyAllowed(root, document.implementation.createDocument(SVG_NS, null));
  if (!clean) return null;
  clean.setAttribute("width", "100%");
  clean.setAttribute("height", "100%");
  return new XMLSerializer().serializeToString(clean);
}

/** Copies an element and its allowed descendants into `target`; null if it isn't allowed. */
function copyAllowed(source: Element, target: XMLDocument): Element | null {
  if (source.namespaceURI !== SVG_NS || !ALLOWED_ELEMENTS.has(source.localName)) return null;

  const copy = target.createElementNS(SVG_NS, source.localName);
  for (const { name, value } of Array.from(source.attributes)) {
    if (!ALLOWED_ATTRIBUTES.has(name)) continue;
    // Any explicit stroke color is replaced so the drawing follows the theme.
    copy.setAttribute(name, name === "stroke" && value !== "none" ? "currentColor" : value);
  }

  for (const child of Array.from(source.childNodes)) {
    if (child.nodeType === child.TEXT_NODE) {
      copy.appendChild(target.createTextNode(child.textContent ?? ""));
    } else if (child.nodeType === child.ELEMENT_NODE) {
      const cleanChild = copyAllowed(child as Element, target);
      if (cleanChild) copy.appendChild(cleanChild);
    }
  }
  return copy;
}
