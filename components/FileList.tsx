"use client";

import { DownloadIcon, IconButton } from "@toyonix/web-kit/react";
import type { EngineFile } from "@/engines/types";
import { downloadFile, fileName } from "@/lib/download";
import type { FileGroup } from "@/lib/files";

interface FileListProps {
  groups: FileGroup[];
  selected: string | null;
  onSelect: (path: string) => void;
}

/** The generated files, grouped by folder. Click one to preview it. */
export function FileList({ groups, selected, onSelect }: FileListProps) {
  if (groups.length === 0)
    return <p className="px-3.5 py-3 text-sm text-text-muted">Nothing generated yet.</p>;
  return (
    <nav aria-label="Generated files" className="grid gap-3 py-3">
      {groups.map((group) => (
        <section key={group.folder} aria-label={group.folder || "files"}>
          <h3 className="m-0 px-3.5 pb-1 font-mono text-xs tracking-wider text-text-muted uppercase">
            {group.folder || "files"}
          </h3>
          <ul className="m-0 list-none p-0">
            {group.files.map((file) => (
              <FileRow key={file.path} file={file} current={file.path === selected} onSelect={onSelect} />
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}

function FileRow({
  file,
  current,
  onSelect,
}: {
  file: EngineFile;
  current: boolean;
  onSelect: (path: string) => void;
}) {
  const name = fileName(file.path);
  return (
    <li className="group flex items-center gap-1 pr-2">
      <button
        type="button"
        aria-current={current ? "true" : undefined}
        onClick={() => onSelect(file.path)}
        className="min-w-0 flex-1 cursor-pointer truncate border-0 bg-transparent px-3.5 py-1.5 text-left font-mono text-[13px] text-text hover:bg-surface-2 aria-[current]:bg-accent aria-[current]:text-accent-contrast"
      >
        {name}
      </button>
      <IconButton size="sm" label={`Download ${name}`} tooltipSide="left" onClick={() => downloadFile(file)}>
        <DownloadIcon />
      </IconButton>
    </li>
  );
}
