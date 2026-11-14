# Kinemotif

**Turn a paragraph into a moving, scored presentation — in one HTML file.**

**[▶ Try it live](https://drsamonline.github.io/kinemotif/)** · **[Open the studio](https://drsamonline.github.io/kinemotif/studio/kinemotif.html)**

Kinemotif is a self-contained HTML animation studio. You paste a story, choose an art style,
and it builds a multi-scene presentation that draws its own artwork, morphs between scenes,
and synthesises an original soundtrack while it plays. The finished show exports as a single
`.html` file that runs offline.

**Need a video file instead of a web page?** [Kinemorph](https://github.com/drsamonline/kinemorph)
is the heavy sibling — a PixiJS + React + TypeScript studio with frame-exact MP4 export. This
repository stays deliberately dependency-free: one file, no build, no network.

There are no images, fonts, audio files or dependencies in this repository. Every pixel is
drawn with Canvas 2D and every note is generated with the Web Audio API at runtime.

![The Kinemotif studio](assets/studio.png)

---

## Quick start

```bash
git clone https://github.com/drsamonline/kinemotif.git
cd kinemotif
open studio/kinemotif.html      # or just double-click it
```

No build step, no server, no install. Any current Chrome, Edge, Safari or Firefox will do.

To change the studio itself you need Python and nothing else:

```bash
python3 build.py        # src/*.js + src/style.css → studio/kinemotif.html
```

1. Pick one of six looks.
2. Paste a paragraph — or tap a demo topic.
3. Press **Generate my show**.

Then edit anything you like, and press **Export HTML show** to get a standalone file.

---

## What it does

| | |
|---|---|
| **Styles per scene** | A show can inherit one style, or cycle through whichever styles you pick — with a wipe at the seam instead of a double-exposed dissolve. |
| **Seven diagrams** | Bars, flow, rings, orbit, steps, grid and timeline, drawn from the style's palette. Not everything is a shape. |
| **Beat-reactive artwork** | The score and the picture share a clock: motifs and diagrams scale on each beat, and neon blooms on the accent. Off by default? No — on by default, with a toggle. |
| **Nine text effects** | Reveal, typewriter, pop, wave, glitch, highlight, split, kinetic and shutter — independent of the entrance preset that moves the block. |
| **Four output formats** | Landscape 16:9, portrait 9:16 for phones, square 1:1 and tall 4:5. The layout reflows for each — portrait puts the words up top and the artwork below. |
| **Ten art styles** | Pixel Arcade, Stick Figure, Neon Night, Paper Cut, Cosmic Dream, VHS Retro, Blueprint, Riso Print, Chalkboard, Swiss Grid. Each style carries its own palette, typography, background art, shape painting and post-processing. |
| **Real morphing** | Every motif is a closed polygon resampled to a common point count, so transitions interpolate actual geometry — a wave flows into a cloud into a rocket. |
| **Six bands per seed** | The seed also chooses the instruments: Glass, Warm, Grit, Chiptune, Deep, Bright — different waveforms, filters, drum tuning, reverb size and density. |
| **Procedural score, seeded per show** | Seven moods. Each show carries a `musicSeed` that decides the key, tempo, chord progression, bass shape, arpeggio pattern, drum style and a generated melody line — so two shows never share a soundtrack, and the same show always sounds the same. **New music** re-rolls it. |
| **Styles you choose** | Pick any two to six styles before generating; scenes cycle through them. Every scene also has its own style override. |
| **Story → storyboard** | Sentences become scenes; titles come from the first clause; pictures come from a keyword map over 14 motifs. Everything it produces is an editable form field. |
| **Motion controls** | Ten entrance presets, eight easing curves (including elastic, bounce and spring), three camera moves, seven transition types, per-scene duration. |
| **Legible by construction** | Accent colours are checked against the style's own background with a WCAG contrast pass, and nudged in HSL until they clear 3:1 — so a generated show never puts a pale shape on a pale page. |
| **Export anything** | One-click standalone HTML show, project JSON, or reopen an exported show and keep editing. Undo/redo across all edits. |

---

## Examples

Four exported shows live in [`examples/`](examples/) — each is a single file, each has its own
soundtrack:

| Show | Style | File |
|---|---|---|
| The Water Cycle | Neon Night | [`examples/water-cycle.html`](examples/water-cycle.html) |
| A Seed Becomes a Tree | Paper Cut | [`examples/seed-to-tree.html`](examples/seed-to-tree.html) |
| Why We Ship Fast | Pixel Arcade | [`examples/ship-fast.html`](examples/ship-fast.html) |
| A Night in the City | VHS Retro | [`examples/night-city.html`](examples/night-city.html) |

![The Water Cycle, neon style](assets/water-cycle.png)

---

## Quotations

One example quotes a real person. [`docs/quotations.md`](docs/quotations.md) records exactly what
is quoted, why, how it is attributed, and how to have it removed. The MIT licence covers the code,
not those words.

## Documentation

| Page | What is in it |
|---|---|
| [docs/guide.md](docs/guide.md) | Using the studio: wizard, scenes, mixing styles, export |
| [docs/reference.md](docs/reference.md) | Every style, motif, text effect, transition, mood and format |
| [docs/project-format.md](docs/project-format.md) | The JSON a show is made of |
| [docs/quotations.md](docs/quotations.md) | What the Alan Watts example quotes, and why |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Setup, the build, the checks, releasing |
| [CHANGELOG.md](CHANGELOG.md) | What shipped, per version |

- **[Guide](docs/guide.md)** — the wizard, the editor, every field, export and import.
- **[Reference](docs/reference.md)** — every style, motif, transition, entrance, easing, camera and mood.
- **[Project format](docs/project-format.md)** — the JSON schema and how an exported show works.

---

## How it works

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  your text   │──▶│  story engine│──▶│ scene renderer│──▶│   export     │
│  (sentences) │   │ title · motif│   │ canvas + audio│   │ single .html │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

The renderer keeps one offscreen buffer per style at that style's native resolution — 480×270
for Pixel Arcade, 1280×720 for Neon and Cosmic, full 1920×1080 for the rest — then blits it to
the display canvas with smoothing on or off depending on the style. That single decision is
what makes the pixel look genuinely pixelated and the neon look genuinely smooth.

Export works by serialising the live document, embedding the project JSON as
`window.__SHOW__`, and setting `window.__PLAY__ = 1`. On load, the same player boots into a
full-screen play-only mode. That is why an exported show is the same size as the studio: it
*is* the studio, holding a project.

---

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Play / pause |
| `←` `→` | Previous / next scene |
| `Ctrl`/`Cmd` + `Z` | Undo |
| `Ctrl`/`Cmd` + `Shift` + `Z` | Redo |
| `E` | Export the HTML show |
| `?` | Shortcut panel |

---

## Limitations, stated plainly

- **The story engine is rule-based, not a language model.** It splits sentences, extracts
  titles and matches keywords to motifs. Concrete nouns ("rain", "climb", "team") produce
  better pictures than abstract ones. There is no API call and no key to configure.
- **It exports HTML, not MP4.** A show is a web page. If you need a video file, screen-record
  the full-screen playback, or add a `captureStream` + `MediaRecorder` step.
- **Audio needs one click.** Browsers block sound until the user interacts, so every show
  starts behind a play gate.
- **`prefers-reduced-motion` is respected** by not auto-playing the show. It does not remove
  motion from the animation itself.

---

## Repository layout

The source is four files in `src/` inlined by `build.py` into one HTML document. Layout, the
checks and the house rules live in [CONTRIBUTING.md](CONTRIBUTING.md#repository-layout).

## Credits and prior art

The spring easings are adapted from [motion-kit](https://github.com/drsamonline/motion-kit), the
fleet's zero-dependency motion core. 

Built from scratch, but the design leans on ideas well established in the web-animation world:
the named-entrance catalogue popularised by Animate.css and Animista, the easing-curve
toolbox and JSON state export of visual keyframe editors, the undo/redo and project-file
conventions of timeline tools like Theatre.js and HTML5 Studio, and the "single self-contained
file" discipline of the whole genre.

## Licence

MIT — see [LICENSE](LICENSE).
