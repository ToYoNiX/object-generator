import JSZip from "jszip";
import type { EngineFile, EngineFileKind } from "@/engines/types";

const MIME_TYPES: Record<EngineFileKind, string> = {
  svg: "image/svg+xml",
  dxf: "application/dxf",
  kicad_pcb: "text/plain",
  jscad: "text/javascript",
  yaml: "application/yaml",
};

export function mimeType(kind: EngineFileKind): string {
  return MIME_TYPES[kind];
}

/** "outlines/board.svg" → "board.svg" */
export function fileName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

/** A zip of every generated file at its path, plus the config that produced them. */
export async function buildZip(files: EngineFile[], config: string): Promise<Blob> {
  const zip = new JSZip();
  zip.file("config.yaml", config);
  for (const file of files) zip.file(file.path, file.content);
  return zip.generateAsync({ type: "blob" });
}

/** Asks the browser to save a blob under `name`. */
export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // Give the browser a moment to start the download before the URL is released.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadFile(file: EngineFile): void {
  saveBlob(new Blob([file.content], { type: mimeType(file.kind) }), fileName(file.path));
}
