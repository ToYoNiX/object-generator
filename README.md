# Object Generator

Make objects in your browser: shape them with the mouse or write their config, then download the
real files (outlines, PCBs and cases). Served at
<https://toyonix.github.io/object-generator/>.

Describing shapes in YAML is precise, but tuning them by editing numbers is slow. Object
Generator keeps the YAML as the source of truth and adds direct manipulation on top:

- a palette of ready-made shapes you click to add to the config;
- a canvas where you select, move, resize, and round shapes (all corners or just one) like in a
  drawing program, with a right-click menu, and every change written back into the YAML;
- live previews of the result.

Inspired by [Ergogen GUI](https://github.com/ergogen/ergogen-gui), the web editor for the
[Ergogen](https://github.com/ergogen/ergogen) keyboard generator. Built on the toyonix platform
([`@toyonix/web-kit`](https://github.com/ToYoNiX/web-kit)).

## Development

```sh
npm ci
npm run dev     # http://localhost:3000/object-generator/
npm run check   # format, lint, typecheck, build (what CI runs)
```

Read [AGENTS.md](AGENTS.md) for the platform rules and how this app is put together.

## Credits and license

MIT, see [LICENSE](LICENSE). See [CREDITS.md](CREDITS.md) for the projects this one draws on.
