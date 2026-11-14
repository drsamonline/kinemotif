# Contributing

Kinemotif is deliberately small: about 2,400 lines of plain JavaScript, one CSS file and a
90-line build script. There is no framework, no bundler and no dependency tree. Please keep it
that way — the single-file property is the product.

## Getting set up

```bash
git clone https://github.com/drsamonline/kinemotif.git
cd kinemotif
python3 build.py          # writes studio/kinemotif.html
```

Open `studio/kinemotif.html` in a browser. There is no dev server; the build is a concatenation,
so a rebuild plus a refresh is the whole loop.

## Where things live

```
src/core.js     render engine — styles, motifs, scenes, transitions, colour
src/music.js    procedural soundtrack (Web Audio)
src/ui.js       wizard, story engine, editor, player, export
src/style.css   editor chrome
build.py        inlines everything into studio/kinemotif.html
```

`studio/kinemotif.html` is generated. Never hand-edit it — edit `src/` and rebuild, or the next
build will silently undo your change.

## House rules

1. **No runtime dependencies.** No CDN links, no `import` from a package, no web fonts. The
   studio must work from `file://` with the network off. `tools/check-links.mjs` fails the build
   if a page references anything external.
2. **No build tooling beyond Python.** `build.py` is a string replace and a file write. If a
   change needs a bundler, the change is probably too big.
3. **Everything is drawn, nothing is loaded.** New art belongs in `MOTIFS` as a point generator,
   not as an image.
4. **Determinism.** Any randomness must be seeded from project data (`MS.seeded`,
   `MS.hashStr`) so the same project always renders the same frame.
5. **No silent failures.** If a preset cannot render, it should be absent from the list, not
   quietly draw nothing.
6. **Accessibility.** Respect `prefers-reduced-motion`. Keep the keyboard path working
   (`Space`, arrows, undo/redo).

## Adding a motif

```js
// src/core.js, inside MOTIFS
compass: {
  label: 'Compass',
  pts: function () {
    // Return a closed polygon in unit space, roughly -1..1 on both axes.
    // Any point count is fine; the morph system resamples to 96.
    return polyPts([[-1, 0], [0, -1], [1, 0], [0, 1]]);
  }
}
```

That is all that is required — it appears in the inspector dropdown, in the keyword map if you
add keywords, and it morphs against every other motif automatically.

## Adding a style

A style is an entry in `STYLES` with a palette, fonts, an internal resolution, a `drawBG` case in
`drawBG()`, a case in `paintMotif()`, and optionally post-processing in `drawPost()`. Keep the
internal resolution small if the look is meant to be chunky; that one number is what makes
Pixel Arcade read as 8-bit.

## Before opening a pull request

```bash
python3 build.py
node tools/check-links.mjs
node tools/check-syntax.mjs
node tools/manifest.mjs          # update the file inventory
```

Then check the studio by hand in at least two styles and one transition, because no automated
test can tell you whether a frame looks right.

## Commit messages

Conventional Commits: `feat:`, `fix:`, `docs:`, `perf:`, `refactor:`, `chore:`. One logical
change per commit.

## Guards against the bugs we actually had

| Check | Catches |
|---|---|
| `node tools/check-version.mjs` (in CI) | The built studio, the changelog and the newest tag disagreeing |
| `node tools/render-check.mjs` | An exception inside the draw loop, which leaves a silent blank canvas — it renders all nine text effects and asserts the frame has ink and the clock advanced; it also asserts a cross-style transition draws both palettes |
| `node tools/release-notes.mjs <v>` | Tagging a release the changelog never recorded |

`render-check.mjs` needs a browser, so it is not in CI. Run it before shipping a change to
`src/core.js`. It was written after a typo in the typewriter branch threw inside the draw loop and
produced a blank frame with no visible error.

## Releasing

A release is a changelog entry, a tag, and nothing else.

1. Add the version's section to `CHANGELOG.md` — user-facing, in the past tense, no invented
   entries. If it is not in the changelog, it did not ship.
2. `node tools/release-notes.mjs 1.6.0` prints that section. It exits non-zero if the section is
   missing, which is the point: you cannot tag a version the changelog never recorded.
3. Tag and push:

   ```bash
   git tag -a v1.6.0 -m "v1.6.0"
   git push origin v1.6.0
   ```

4. The `Release` workflow publishes a GitHub release whose body is that changelog section. Nothing
   is written by hand at publish time.

Current version: **1.6.0**.

## Repository layout

```
src/core.js               render engine — styles, motifs, scenes, transitions, colour
src/music.js              procedural soundtrack (Web Audio)
src/ui.js                 wizard, story engine, editor, player, export
src/style.css             editor chrome
build.py                  inlines the four files into one HTML document
studio/kinemotif.html     the build output — never edit this by hand
examples/*.html           four exported shows, each with its project baked in
index.html                landing page
assets/                   screenshots used by the README and the landing page
docs/                     guide, reference, project format
tools/                    link checker, syntax checker, manifest writer
```

`studio/kinemotif.html` is generated from `src/`. Editing it directly works until the next
build, which will overwrite you.

## Repository conventions

This repository follows the same house rules as the rest of the fleet:

| File | Purpose |
|---|---|
| `PAGES.json` | Declares every published page, its path and its title. The link checker validates it. |
| `MANIFEST.json` | Inventory of every tracked file with a SHA-256 and a class (`source`, `generated`, `asset`, `tooling`, `hand`). |
| `tools/check-links.mjs` | Fails if a local `href`/`src` is broken, if `PAGES.json` points at nothing, if an example has no embedded project, or if the studio references anything external. |
| `tools/check-syntax.mjs` | Parses every inline script in every published page. |
| `tools/manifest.mjs` | Rewrites `MANIFEST.json`; `--check` fails on unlisted or missing files. |
| `.github/workflows/ci.yml` | Runs all three on every push. |

```bash
node tools/check-links.mjs
node tools/check-syntax.mjs
node tools/manifest.mjs --check
```

The self-containment check is the important one: it is what stops a CDN link, a web font or an
`<img src="https://…">` from quietly breaking the offline promise.
