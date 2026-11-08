"use client";

import { CodeBlock } from "@toyonix/web-kit/react";
import { useMemo } from "react";
import type { EngineFile } from "@/engines/types";
import { prepareSvg } from "@/lib/svg";

/** The selected file, drawn (SVG) or as text (everything else). Fills its container. */
export function Preview({ file }: { file: EngineFile | undefined }) {
  const svg = useMemo(() => (file?.kind === "svg" ? prepareSvg(file.content) : null), [file]);
  if (!file) {
    return (
      <div className="grid flex-1 place-items-center p-6 text-text-muted">
        Generate the config to see its output here.
      </div>
    );
  }
  if (svg) {
    return (
      <div
        data-testid="svg-preview"
        role="img"
        aria-label={`Preview of ${file.path}`}
        className="min-h-0 flex-1 p-8 text-text"
        // Safe: prepareSvg rebuilds the SVG from an allowlist of drawing elements.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  return (
    <div className="min-h-0 flex-1 overflow-auto p-4">
      <CodeBlock className="m-0 text-xs">{file.content}</CodeBlock>
    </div>
  );
}
