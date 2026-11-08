"use client";

import Link from "next/link";
import {
  Alert,
  Button,
  ButtonRow,
  ChevronDownIcon,
  ChevronLeftIcon,
  Dialog,
  DialogContent,
  DownloadIcon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Kbd,
  PanelLeftIcon,
  PanelRightIcon,
  PlusIcon,
  SidePanel,
  Spacer,
  StatusBar,
  ThemeToggle,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  Workspace,
  WorkspaceBody,
  WorkspaceMain,
} from "@toyonix/web-kit/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileList } from "@/components/FileList";
import { Preview } from "@/components/Preview";
import { YamlEditor } from "@/components/YamlEditor";
import { ergogenEngine } from "@/engines/ergogen";
import { useDraft } from "@/hooks/use-draft";
import { useGeneration } from "@/hooks/use-generation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePanels } from "@/hooks/use-panels";
import { buildZip, downloadFile, fileName, saveBlob } from "@/lib/download";
import { isReplaceable, type Draft } from "@/lib/draft";
import { readIntent } from "@/lib/intent";
import type { PanelName } from "@/lib/panels";
import { groupFiles, pickSelection } from "@/lib/files";

const engine = ergogenEngine;
// A first visit starts a new object; examples are opened from the home page.
const FALLBACK: Draft = { engine: engine.id, config: engine.starter };
// Configs the app ships: replacing one of these unchanged loses nothing.
const SHIPPED = [engine.starter, ...engine.examples.map((example) => example.config)];

/** A config waiting to replace the draft, once the user agrees. */
interface Replacement {
  label: string;
  config: string;
}

// Ctrl/⌘+B and Ctrl/⌘+Alt+B, like an editor's sidebars. Not Ctrl+[ (CodeMirror's "outdent")
// and not Alt+number (switches tabs in Firefox on Linux and Windows).
const YAML_SHORTCUT = "Ctrl B";
const FILES_SHORTCUT = "Ctrl Alt B";

// The kit's side panels open over the main area below this width, so only one fits at a time.
const NARROW = "(max-width: 760px)";

/**
 * The working area: the YAML config on the left, the selected output in the middle, the
 * generated files on the right. Both side panels can be hidden. The canvas (shapes you edit
 * with the mouse) will take the middle once it exists.
 */
export function WorkspaceView() {
  const { draft, setConfig, setDraft, saveFailed } = useDraft(FALLBACK);
  const { files, error, running, runNow } = useGeneration(engine.run, draft?.config ?? null);
  const { panels, setPanel } = usePanels();
  const narrow = useMediaQuery(NARROW);
  // On a narrow screen the YAML wins if both were left open (e.g. on a wider screen).
  const open = { yaml: panels.yaml, files: panels.files && !(narrow && panels.yaml) };
  const showPanel = (name: PanelName, show: boolean) => {
    if (show && narrow) setPanel(name === "yaml" ? "files" : "yaml", false);
    setPanel(name, show);
  };
  const [chosen, setChosen] = useState<string | null>(null);

  const selectedPath = pickSelection(files, chosen);
  const selected = files.find((file) => file.path === selectedPath);
  const groups = useMemo(() => groupFiles(files), [files]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.key.toLowerCase() !== "b") return;
      event.preventDefault();
      const name = event.altKey ? "files" : "yaml";
      showPanel(name, !open[name]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // There is one draft (several projects need IndexedDB, not built yet), so "New" and opening an
  // example replace it. Ask first when it holds the user's own changes.
  const [pending, setPending] = useState<Replacement | null>(null);
  const replaceDraft = (next: Replacement) => {
    setPending(null);
    setChosen(null);
    setDraft({ engine: engine.id, config: next.config });
  };
  const requestReplace = (next: Replacement) => {
    if (!draft || draft.config === next.config || isReplaceable(draft.config, SHIPPED)) replaceDraft(next);
    else setPending(next);
  };

  // Links from the home page: /workspace/?new or /workspace/?example=<id>. Handled once the
  // saved draft is loaded, then removed from the URL so a reload just continues.
  const intentHandled = useRef(false);
  useEffect(() => {
    if (!draft || intentHandled.current) return;
    intentHandled.current = true;
    const intent = readIntent(window.location.search);
    if (!intent) return;
    window.history.replaceState(null, "", window.location.pathname);
    const example =
      intent.kind === "example" ? engine.examples.find((candidate) => candidate.id === intent.id) : undefined;
    const next =
      intent.kind === "new"
        ? { label: "a new object", config: engine.starter }
        : example && { label: `the ${example.label} example`, config: example.config };
    // The URL is only readable in the browser, after the saved draft has loaded: a one-time sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (next) requestReplace(next);
  });

  const downloadAll = async () => {
    if (draft) saveBlob(await buildZip(files, draft.config), "object-generator.zip");
  };

  const downloadConfig = () => {
    if (draft) saveBlob(new Blob([draft.config], { type: "application/yaml" }), "config.yaml");
  };

  const status = running
    ? "Generating…"
    : error
      ? "Generation failed"
      : files.length > 0
        ? `${files.length} files`
        : "nothing generated yet";

  return (
    <Workspace>
      <Toolbar aria-label="Workspace">
        <ToolbarButton asChild>
          <IconButton
            label="Show or hide the YAML"
            shortcut={YAML_SHORTCUT}
            pressed={open.yaml}
            onClick={() => showPanel("yaml", !open.yaml)}
          >
            <PanelLeftIcon />
          </IconButton>
        </ToolbarButton>
        <ToolbarButton asChild>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ChevronLeftIcon />
              Object Generator
            </Link>
          </Button>
        </ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton
          disabled={!draft}
          onClick={() => requestReplace({ label: "a new object", config: engine.starter })}
        >
          <PlusIcon />
          New
        </ToolbarButton>
        <ToolbarButton variant="primary" onClick={runNow} disabled={!draft}>
          Generate <Kbd>Ctrl ⏎</Kbd>
        </ToolbarButton>
        <Spacer />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ToolbarButton disabled={!draft}>
              <DownloadIcon />
              Export
              <ChevronDownIcon />
            </ToolbarButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuItem
              disabled={!selected}
              description={selected?.path}
              onSelect={() => selected && downloadFile(selected)}
            >
              {selected ? `Download ${fileName(selected.path)}` : "Download the selected file"}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={files.length === 0}
              description="every file, plus config.yaml"
              onSelect={() => void downloadAll()}
            >
              Download all (.zip)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={downloadConfig}>Download config.yaml</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle />
        <ToolbarButton asChild>
          <IconButton
            label="Show or hide the files"
            shortcut={FILES_SHORTCUT}
            pressed={open.files}
            onClick={() => showPanel("files", !open.files)}
          >
            <PanelRightIcon />
          </IconButton>
        </ToolbarButton>
      </Toolbar>

      <WorkspaceBody>
        <SidePanel
          side="left"
          title="YAML"
          width={440}
          open={open.yaml}
          onOpenChange={(show) => showPanel("yaml", show)}
          shortcut={YAML_SHORTCUT}
        >
          <div className="flex h-full flex-col">
            {saveFailed ? (
              <Alert tone="warning" title="Your draft isn't being saved" className="m-3">
                Browser storage is full or turned off. Export your config to keep it.
              </Alert>
            ) : null}
            {draft ? (
              <YamlEditor
                aria-label="YAML config"
                className="min-h-0 flex-1 overflow-hidden"
                value={draft.config}
                onChange={setConfig}
                onRun={runNow}
              />
            ) : (
              <p className="px-3.5 text-sm text-text-muted">Loading your draft…</p>
            )}
          </div>
        </SidePanel>

        <WorkspaceMain aria-label="Output">
          {error ? (
            <Alert tone="danger" title="Generation failed" className="m-4 mb-0 max-h-48 overflow-auto">
              <span className="font-mono text-sm whitespace-pre-wrap">{error}</span>
            </Alert>
          ) : null}
          <Preview file={selected} />
        </WorkspaceMain>

        <SidePanel
          side="right"
          title="Files"
          width={280}
          open={open.files}
          onOpenChange={(show) => showPanel("files", show)}
          shortcut={FILES_SHORTCUT}
        >
          <FileList groups={groups} selected={selectedPath} onSelect={setChosen} />
        </SidePanel>
      </WorkspaceBody>

      <StatusBar>
        <span role="status">{status}</span>
        {selected ? <span>{selected.path}</span> : null}
        <Spacer />
        <span className={saveFailed ? "text-danger" : undefined}>
          {saveFailed ? "draft NOT saved: storage full" : "draft saved in this browser"}
        </span>
        <span>{engine.label}</span>
      </StatusBar>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        {pending ? (
          <DialogContent
            title={`Replace your draft with ${pending.label}?`}
            description="Your current config only lives in this browser. Once replaced, it's gone after a reload."
          >
            <ButtonRow>
              <Button
                onClick={() => {
                  downloadConfig();
                  replaceDraft(pending);
                }}
              >
                <DownloadIcon /> Download it, then replace
              </Button>
              <Button variant="danger" onClick={() => replaceDraft(pending)}>
                Replace
              </Button>
              <Button variant="ghost" onClick={() => setPending(null)}>
                Keep my draft
              </Button>
            </ButtonRow>
          </DialogContent>
        ) : null}
      </Dialog>
    </Workspace>
  );
}
