# Credits

Object Generator is written from scratch, but its ideas come from the projects below. If code,
configs, or assets are ever carried over from another project, the file that uses them says so
in a comment and the project is listed here with what was taken and its license.

## Ergogen GUI (inspiration)

The web editor for Ergogen: a YAML editor with live previews of the generated outlines, PCBs
and cases. Object Generator grew out of wanting to edit those shapes with the mouse instead of
by hand-tuning numbers.

- Project: <https://github.com/ergogen/ergogen-gui>
- Authors: Michael van Eerd (original author), Marco Massarelli (maintainer), and contributors
- License: declared MIT in the project's `package.json` and `README.md`
- Carried over: nothing.

## Ergogen (engine)

The keyboard generator behind the Ergogen engine (points, outlines, cases, KiCad PCBs). Used
as a library through the owner's fork <https://github.com/ToYoNiX/ergogen-cli>, which keeps
the same license.

- Project: <https://github.com/ergogen/ergogen>
- Author: Bán Dénes and contributors
- License: MIT, Copyright (c) 2018 Bán Dénes

## Example configs

- **Sblit36** by ToYoNiX: `engines/ergogen/examples/sblit36.ts` is a copy of `config.yaml` from
  <https://github.com/ToYoNiX/sblit36> (MIT, Copyright (c) 2026 Assem Mohamed).
