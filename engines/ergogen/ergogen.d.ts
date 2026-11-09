// Types for the parts of the ergogen fork (ToYoNiX/ergogen-cli) that this app uses.
// The package ships plain CommonJS without type definitions.
declare module "ergogen" {
  interface TwoDee {
    dxf?: string;
    svg?: string;
  }

  interface ShapePlacement {
    point: string | null;
    x: number;
    y: number;
    r: number;
    mirrored: boolean;
    /** Undefined when nothing of the part is left to draw (makerjs gives no path data then). */
    path: string | undefined;
  }

  interface ShapeOutline {
    extents: { low: [number, number]; high: [number, number] } | null;
    parts: { name: string; what: string; operation: string; placements: ShapePlacement[] }[];
  }

  interface ErgogenPoint {
    x: number;
    y: number;
    r: number;
    meta: { width?: number; height?: number; [key: string]: unknown };
  }

  interface ErgogenResults {
    demo?: TwoDee;
    /** With `debug`: every point (key) by name. */
    points?: Record<string, ErgogenPoint>;
    /** With the `shapes` option: where each outline part is placed. */
    shapes?: Record<string, ShapeOutline>;
    outlines?: Record<string, TwoDee>;
    cases?: Record<string, { jscad?: string }>;
    pcbs?: Record<string, string>;
    [key: string]: unknown;
  }

  interface ProcessOptions {
    /** Also return points, units, the canonical config, the demo drawing, and "_" outlines. */
    debug?: boolean;
    /** Also export SVG next to DXF for every 2D output. */
    svg?: boolean;
    /** Also report where each outline part is placed (results.shapes). */
    shapes?: boolean;
  }

  const ergogen: {
    version: string;
    process(
      raw: string,
      options?: ProcessOptions,
      logger?: (message: string) => void,
    ): Promise<ErgogenResults>;
    inject(type: string, name: string, value: unknown): void;
  };

  export default ergogen;
}
