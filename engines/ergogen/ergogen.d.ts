// Types for the parts of the ergogen fork (ToYoNiX/ergogen-cli) that this app uses.
// The package ships plain CommonJS without type definitions.
declare module "ergogen" {
  interface TwoDee {
    dxf?: string;
    svg?: string;
  }

  interface ErgogenResults {
    demo?: TwoDee;
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
