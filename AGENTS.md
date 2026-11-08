# AGENTS.md

Read this before changing anything. It explains what this repo is, the platform rules it must
follow, and (at the bottom) what this particular app does.

## What this repo is

One app in the **toyonix** platform: a family of static sites that look and behave as one.

- It is deployed to GitHub Pages at `https://toyonix.github.io/<repo-name>/`. **The repo name
  is the URL and the app id.** Renaming the repo changes the URL and breaks links.
  (`toyonix.github.io` itself is the root site at `/`.)
- It is a **Next.js App Router site, statically exported**. There is no server.
- The look, the shared header/nav/footer, the theme, storage, and all lint/format/TS configs
  come from the npm package **`@toyonix/web-kit`**. The deploy and CI steps come from
  reusable workflows in the `ToYoNiX/web-kit` repo.
- It was created from the `web-starter` template. Template files were copied once and are
  never synced, which is why almost everything lives in the kit instead.

## Hard constraints (static export on GitHub Pages)

Not available: API routes / route handlers with request-time logic, server actions,
middleware/proxy, ISR, `cookies()` / `headers()`, `rewrites` / `redirects` / `headers` in
next.config, dynamic routes without `generateStaticParams`, next/image optimization.

Anything dynamic happens in the browser, against an external service if needed.

## Where code belongs

- **Shared look and behavior go in the kit, not here.** Never copy or fork kit components or
  styles into this repo. If something reusable is missing, it should be added to
  `@toyonix/web-kit` (a PR to `ToYoNiX/web-kit`), then used here.
- App-specific pages, components, and logic live in this repo.

## Using the kit

- **Layout:** `app/layout.tsx` wraps every page in `<AppShell>` and puts `<ThemeScript>` in
  `<head>`. Keep both. Pass app-local links through `AppShell`'s `nav` prop.
- **Components:** import from `@toyonix/web-kit/react` (`Button`, `Card`, `CardGrid`,
  `Display`, `Prose`, `Field`, `Input`, `Dialog`, `Tabs`, …). Only import from the
  documented entry points; deep imports into the kit are lint errors.
- **Colors and fonts:** use the kit's tokens only, via Tailwind (`bg-surface`, `text-text-muted`,
  `text-accent-text`, `border-border`, `font-serif`, `font-mono`) or CSS variables
  (`var(--tx-accent)`). Tailwind's default palette is removed on purpose; don't hard-code
  colors.
- **Links:** in-app links use `next/link` (basePath is handled). Links to other toyonix
  apps use `<AppLink app="gen">` or `appHref("gen")`, never `next/link`. Raw in-app URLs
  (`fetch`, `<a href>`, assets in `public/`) go through `withBasePath()`.
- **Storage:** all toyonix apps share one origin. Use `storage` from
  `@toyonix/web-kit/storage` (`storage.app`, `storage.session`); IndexedDB names via
  `dbName()`; cookies with `Path=cookiePath()`. Direct `localStorage`, `sessionStorage`,
  `indexedDB`, and `document.cookie` are lint errors. Never store secrets in the browser.
- **Site identity:** title and description live in the `"toyonix"` field of `package.json`
  (read by `site.ts` and by the root site's nav). `status` is `live`, `beta`, or `archived`.

## Commands

```sh
npm ci
npm run dev          # http://localhost:3000/<repo-name>/
npm run check        # format, lint, typecheck, build: what CI runs
npm run preview      # serve the static export from ./out
npm run kit:update   # pull the newest compatible @toyonix/web-kit
```

## Dependencies and deploys

- `package-lock.json` is committed, so everything is reproducible, except `@toyonix/web-kit`,
  which CI and deploys float to the newest version in range (`npm update @toyonix/web-kit`).
  A kit release redeploys every site.
- Pushing to `main` deploys. PRs run CI (format, lint, typecheck, build).
- A failed deploy leaves the previous version live.

## Do not modify

- `.github/workflows/deploy.yml` (its file name is how the kit redeploys this site) and
  `ci.yml`, beyond what the kit's docs say.
- The `withWebKit()` call in `next.config.ts`: never set `output`, `basePath`, or
  `trailingSlash` yourself.
- `eslint.config.mjs`, `prettier.config.mjs`, and the `extends` in `tsconfig.json`. To change
  a rule for every site, change the kit. Disable a rule locally only with a comment
  explaining why.

---

## This app

<!-- Keep this current: it's what agents read first. -->

- **Purpose:** design objects from a YAML config and shape them with the mouse. The YAML is the
  source of truth; a ready-made shape palette and a drawing-program-style canvas (select, move,
  resize, round all or single corners, right-click menu) edit that YAML for you.
- **Users:** the owner first; anyone who finds hand-tuning shape numbers in YAML slow.
- **Data:** everything runs in the browser. No backend, no external API yet. See "Storage"
  below.
- **Key decisions:**
  - Inspired by Ergogen GUI (<https://github.com/ergogen/ergogen-gui>), but written from
    scratch. Anything ever ported from another project must be credited in `CREDITS.md` and in
    a comment in the file that uses it.
  - Canvas edits must preserve the user's YAML comments and formatting: edit the YAML document
    in place, never re-dump it.
- **Status:** beta (keep in sync with package.json).

### Engines

The app is engine-agnostic. An engine turns a YAML config into files; the editor, previews and
canvas only use the `Engine` interface in `engines/types.ts`, so engines for things other than
keyboards can be added later.

- `engines/types.ts`: `Engine`, `EngineResult` (never thrown, failures are `ok: false`),
  `EngineFile` (`path` like `outlines/board_edge.svg`, `kind` picks the preview), and
  `shapes`: per outline, the size of its SVG drawing and its parts in config order, each with
  its placements (point, x, y, r, mirrored, and `path`: the part's outline in the coordinates
  of that outline's SVG, so the canvas can draw selections over it).
- `engines/worker-runner.ts`: turns a Web Worker into `run(config)`. Creates the worker lazily
  (never during prerendering), matches replies by id, replaces a crashed worker.
- `engines/ergogen/`: the first engine. `run.ts` calls Ergogen and flattens its results
  (tested in Node), `worker.ts` is the worker entry, `index.ts` exports `ergogenEngine`,
  `examples/` holds bundled configs (only the owner's Sblit36).
- **The Ergogen dependency** is the owner's fork, installed from a **commit tarball**
  (`https://codeload.github.com/ToYoNiX/ergogen-cli/tar.gz/<sha>`), not a `github:` URL. A git
  URL makes npm clone the fork and install all its dev tools, which takes minutes and times
  out. To pick up fork changes, `npm install ergogen@<tarball URL of the new sha>`. Fork
  changes this app needs (per-shape placement data, per-corner radii) go to
  `ToYoNiX/ergogen-cli` first.
- The `shapes` option comes from fork PR ToYoNiX/ergogen-cli#4. Until it's merged, the app is
  pinned to that PR's commit (`ef5988d`); once it's on `develop`, pin the merged commit.

### Storage

All toyonix apps share the `toyonix.github.io` origin, so they share browser storage and its
~5 MB localStorage quota.

- Small app state (the current YAML draft, settings) goes in `storage.app` (keys become
  `toyonix:object-generator:<key>`). Validate what `get()` returns. `set()` returns `false`
  when storage is full or disabled: tell the user, never drop their work silently.
- Never store generated files (SVG, DXF, PCB, STL): they're regenerated from the config.
- Larger data (many projects, custom footprints) belongs in IndexedDB named with `dbName()`.
  The kit has no IndexedDB helper yet; add one to `@toyonix/web-kit` rather than here.
- Never store secrets (e.g. a GitHub token): every toyonix app can read this storage.

### Editor logic

Tested building blocks; the UI composes them.

- `hooks/use-draft.ts` + `lib/draft.ts`: the draft (`{ engine, config }`) in `storage.app`
  under `draft`. Saved when typing pauses and on `pagehide`/hidden; reports refused saves.
- `hooks/use-generation.ts`: debounced engine runs, `runNow`, newest run wins, last good
  files kept on error.
- `lib/svg.ts`: `prepareSvg` rebuilds engine SVG from an allowlist before it's inlined (the
  only HTML injection in the app; keep it that way) and draws strokes in `currentColor`.
- `lib/files.ts`, `lib/download.ts`: file selection/grouping, single download, zip of all.
- `lib/text-diff.ts`: `minimalChange` for updating the editor without losing cursor/undo.
  Any programmatic edit of the YAML (examples now, the canvas later) goes through it.
- `components/YamlEditor.tsx`: CodeMirror 6 YAML editor with the kit's `toyonixTheme`
  (`@toyonix/web-kit/codemirror`), Ctrl/Cmd+Enter runs.
- `lib/yaml-edit.ts`: edits that keep the user's file as written (the `yaml` package).
  `setScalar` changes an existing value by replacing only its characters in the source;
  `updateDocument` makes structural changes through the document model (keeps comments, may
  normalize what it re-prints). Both throw on YAML that doesn't parse, rather than overwrite it.
- `engines/ergogen/edits.ts`: canvas edits in Ergogen terms: `moveShape` (`adjust.shift`, in
  the placement point's rotated/mirrored frame), `resizeShape` (`size`, or `radius` for
  circles), `setCornerRadius` (`corner`), `addPart`, `deletePart`, `movePart` (order matters:
  it decides what's added or cut first). Formulas are kept and get an offset (`kx - 1` plus 2
  is `kx + 1`). Distances are Ergogen's (mm, y up).
- `lib/panels.ts` + `hooks/use-panels.ts`: which side panels are open, in `storage.app` under
  `panels`.

### Pages

Two routes, each with its own `AppShell` in a route-group layout (the root layout has none):

- `app/(home)/`: the home page, a normal page with the shared header.
- `app/workspace/`: the working area, `<AppShell layout="app" header={false}>`: the whole
  window, no shared header. `components/WorkspaceView.tsx` builds it from the kit's
  `Workspace`, `Toolbar`, `SidePanel` and `StatusBar`: YAML on the left, the preview
  (`Preview.tsx`) in the middle, the files (`FileList.tsx`) on the right. The canvas will take
  the middle.
- One local project for now (a single draft in `storage.app`; several projects wait for an
  IndexedDB helper in the kit). A first visit starts from the engine's `starter`. Examples live
  on the home page and link to `/workspace/?example=<id>`; "New" is `/workspace/?new` or the
  toolbar button (`lib/intent.ts`). Replacing a draft that holds the user's own changes asks
  first and offers to download it (`isReplaceable` in `lib/draft.ts`).
- Panel shortcuts are Ctrl/Cmd+B (YAML) and Ctrl/Cmd+Alt+B (files). Not Ctrl+[ (CodeMirror's
  outdent) and not Alt+number (switches tabs in Firefox). On screens under 760px the panels
  open over the preview, so only one is open at a time.
- Tool UI pieces that other apps could use belong in the kit, not here (see "Where code
  belongs"); this app composes them.

### Tests

`npm test` runs Vitest. Pure logic runs in Node; files that need a DOM start with
`// @vitest-environment jsdom`. `npm run check` runs the tests too, but the shared CI workflow
(`site-ci.yml` in web-kit) doesn't run tests yet, so run `npm run check` before pushing.
Tests follow Arrange / Act / Assert.

The kit's lint rules are strict about promises in tests: give sync `act()` callbacks a block
body (`act(() => { … })`, no `await`), and `await act(async () => …)` only for async work.

To check the real static export in a browser: `npm run build`, copy `out/` to
`<dir>/object-generator/`, serve `<dir>` with any static server, and open
`/object-generator/`. A 404 for `/registry.json` is expected locally (the root site serves
it on Pages).
