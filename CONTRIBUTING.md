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
