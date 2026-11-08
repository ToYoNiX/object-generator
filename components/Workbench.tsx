"use client";

import { Alert, Button, ButtonRow, CodeBlock, Field, Select } from "@toyonix/web-kit/react";
import { useMemo, useState } from "react";
import { ergogenEngine } from "@/engines/ergogen";
import { YamlEditor } from "@/components/YamlEditor";
import { useDraft } from "@/hooks/use-draft";
import { useGeneration } from "@/hooks/use-generation";
import { buildZip, downloadFile, saveBlob } from "@/lib/download";
import type { Draft } from "@/lib/draft";
import { groupFiles, pickSelection } from "@/lib/files";
import { prepareSvg } from "@/lib/svg";

/*
 * A deliberately plain page that wires the editor logic together so it can be tried in the
 * browser. It is NOT the app's design: the real workspace layout is decided separately and
 * will replace this component.
 */

const engine = ergogenEngine;
const [firstExample] = engine.examples;
const FALLBACK: Draft = { engine: engine.id, config: firstExample?.config ?? "" };

export function Workbench() {
  const { draft, setConfig, setDraft, saveFailed } = useDraft(FALLBACK);
  const { files, error, running, runNow } = useGeneration(engine.run, draft?.config ?? null);
  const [chosen, setChosen] = useState<string | null>(null);

  const selectedPath = pickSelection(files, chosen);
  const selected = files.find((file) => file.path === selectedPath);
  const groups = useMemo(() => groupFiles(files), [files]);
  const svg = useMemo(() => (selected?.kind === "svg" ? prepareSvg(selected.content) : null), [selected]);

  const loadExample = (id: string) => {
    const example = engine.examples.find((candidate) => candidate.id === id);
    if (example) setDraft({ engine: engine.id, config: example.config });
  };

  const downloadAll = async () => {
    if (draft) saveBlob(await buildZip(files, draft.config), "object-generator.zip");
  };

  return (
    <div className="grid gap-6 px-6 py-6 lg:grid-cols-2">
      <section aria-label="Config" className="flex min-w-0 flex-col gap-3">
        <ButtonRow>
          <Button onClick={runNow} disabled={!draft}>
            Generate <kbd className="font-mono text-sm">Ctrl/⌘ Enter</kbd>
          </Button>
          <Field label="Load example">
            <Select value="" onChange={(event) => loadExample(event.target.value)}>
              <option value="" disabled>
                Choose…
              </option>
              {engine.examples.map((example) => (
                <option key={example.id} value={example.id}>
                  {example.label} by {example.author}
                </option>
              ))}
            </Select>
          </Field>
        </ButtonRow>
        {saveFailed ? (
          <Alert tone="warning" title="Your draft isn't being saved">
            Browser storage is full or turned off. Download your config to keep it.
          </Alert>
        ) : null}
        {draft ? (
          <YamlEditor
            aria-label="YAML config"
            className="h-[70vh] overflow-hidden"
            value={draft.config}
            onChange={setConfig}
            onRun={runNow}
          />
        ) : (
          <p className="text-text-muted">Loading your draft…</p>
        )}
      </section>

      <section aria-label="Output" className="flex min-w-0 flex-col gap-3">
        <ButtonRow>
          <Field label="File">
            <Select
              value={selectedPath ?? ""}
              onChange={(event) => setChosen(event.target.value)}
              disabled={files.length === 0}
            >
              {groups.map((group) => (
                <optgroup key={group.folder} label={group.folder}>
                  {group.files.map((file) => (
                    <option key={file.path} value={file.path}>
                      {file.path.slice(group.folder.length + 1)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          <Button variant="secondary" disabled={!selected} onClick={() => selected && downloadFile(selected)}>
            Download file
          </Button>
          <Button variant="secondary" disabled={files.length === 0} onClick={() => void downloadAll()}>
            Download all (.zip)
          </Button>
        </ButtonRow>
        <p role="status" className="text-sm text-text-muted">
          {running ? "Generating…" : files.length > 0 ? `${files.length} files` : "No output yet"}
        </p>
        {error ? (
          <Alert tone="danger" title="Generation failed">
            <span className="font-mono text-sm whitespace-pre-wrap">{error}</span>
          </Alert>
        ) : null}
        {svg ? (
          <div
            data-testid="svg-preview"
            aria-label={`Preview of ${selected?.path ?? ""}`}
            role="img"
            className="h-[60vh] border border-border p-4 text-text"
            // Safe: prepareSvg rebuilds the SVG from an allowlist of drawing elements.
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : selected ? (
          <CodeBlock className="max-h-[60vh] overflow-auto text-xs">{selected.content}</CodeBlock>
        ) : null}
      </section>
    </div>
  );
}
