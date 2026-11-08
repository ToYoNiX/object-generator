import type { EngineFile } from "@/engines/types";

const folderOf = (path: string) => path.slice(0, Math.max(path.lastIndexOf("/"), 0));
const isPrivate = (path: string) => path.slice(path.lastIndexOf("/") + 1).startsWith("_");

/**
 * Which file to show after a run: the current one if it still exists, otherwise the first
 * outline SVG (skipping "_" helper outlines), then any SVG, then anything.
 */
export function pickSelection(files: EngineFile[], current: string | null): string | null {
  if (current && files.some((file) => file.path === current)) return current;
  const outline = files.find(
    (file) => file.kind === "svg" && folderOf(file.path) === "outlines" && !isPrivate(file.path),
  );
  const svg = files.find((file) => file.kind === "svg");
  return (outline ?? svg ?? files[0])?.path ?? null;
}

export interface FileGroup {
  folder: string;
  files: EngineFile[];
}

/** Groups files by folder ("outlines", "pcbs", …), in the order the engine produced them. */
export function groupFiles(files: EngineFile[]): FileGroup[] {
  const groups = new Map<string, EngineFile[]>();
  for (const file of files) {
    const folder = folderOf(file.path);
    groups.set(folder, [...(groups.get(folder) ?? []), file]);
  }
  return [...groups].map(([folder, grouped]) => ({ folder, files: grouped }));
}
