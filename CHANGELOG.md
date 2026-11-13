# Changelog

All notable changes to Kinemotif. Format follows [Keep a Changelog](https://keepachangelog.com/),
versioning follows [Semantic Versioning](https://semver.org/).

## [1.4.1] — 2026-11-13

### Fixed
- **Two scores playing at once.** Changing the mood or the seed while a show was playing left the
  previous run's oscillators scheduled on the audio graph, so the old score rang on underneath the
  new one for several seconds — the "double music" that made shows feel wrong. Every run now gets
  its own gain bus (`Music.start()` creates one, `Music.stop()` fades it out in 60 ms and detaches
  it), so a restart is silent at the seam.
- Pausing now silences immediately instead of letting pads decay for up to eight beats.

### Changed
- Voices route through the run bus into a single reverb send; the per-voice send levels are gone.
- `Music.debug()` reports `runs`, `playing` and the current bus gain, for exactly this kind of check.

## [1.4.0] — 2026-11-13

### Added
- **The artwork reacts to the score.** The motif and the diagrams scale on each beat
  (`Music.beatPhase()`, a 0–1 ramp through the beat, from dance-fight's rhythm grid), and the neon
  style blooms briefly on the accent. Toggle it with *Artwork pulses with the beat* in the Sound
  panel; the choice is saved with the project.
- `scene.react: false` opts a single scene out.

## [1.3.0] — 2026-11-13

### Added
- **Seeded score generation.** Every show carries a `musicSeed`. It decides the key, tempo,
  chord progression, bass shape, arpeggio pattern, drum style and a generated melody line, and it
  alternates two sections every eight bars so a long show changes instead of looping. Two shows
  never share a soundtrack; the same show always sounds the same, including after export.
- **New music** button in the studio re-rolls the seed, with a live readout of key, tempo and seed.
- **Style picker** in the wizard: choose any two to six styles and the show cycles through them.
  The per-scene Style override in the inspector still wins.

### Changed
- The score is no longer one fixed progression per mood. Pools of 6–8 chords, five arpeggio shapes,
  four bass patterns and three drum styles per mood, all selected by the seed.
- Pattern-array sequencing follows retro-strike's chiptune loop; the beat-phase readout follows
  dance-fight's rhythm grid (`Music.beatPhase()` returns 0–1 through the current beat).
- Dropped the redundant "one style / mix all six" select; the chips replace it.

### Fixed
- `Music.newSeed()` returned the whole plan instead of the seed.
- A progression was being built from single chords, so the scheduler received a chord where it
  expected a list of chords.

## [1.2.0] — 2026-11-13

### Added
- **Per-scene styles.** `scene.style` overrides the show's style, so one show can walk through all
  six. The wizard gains a *Styles: one / mix all six* choice. Transitions between two different
  styles wipe instead of dissolving — a cross-fade put both texts on screen at once, which read as
  a double exposure.
- **Seven diagrams** beside the fourteen motifs: `bars`, `flow`, `rings`, `orbit`, `steps`, `grid`,
  `timeline`. Each is drawn from the style's palette, so the same diagram looks like a different
  object in every style.
- **Seven text effects**: `reveal`, `typewriter`, `pop`, `wave`, `glitch`, `highlight`, `split`.
  Independent of the entrance preset, which still moves the whole block.
- **`examples/six-styles.html`** — a twelve-scene show that uses all six styles twice, every
  diagram, and most of the text effects.

### Changed
- Scene cap raised from 9 to 12 so a twelve-sentence paragraph keeps one sentence per scene.
- Ambient decoration no longer lands in the type column on split layouts.
- The grid diagram was nearly invisible on light styles; dots are larger and the sweep uses the
  accent.

## [1.1.0] — 2026-11-13

### Added
- **Contrast-safe accents** — every generated accent colour is checked against the style's
  background using WCAG relative luminance and nudged in HSL until it clears 3:1. Ported from
  the fleet's colour core. Paper Cut and Stick Figure shows are noticeably more legible.
- **Sources in the repository** — `src/` and `build.py` now ship alongside the build output, so
  the studio can be edited and rebuilt without reverse-engineering the bundle.
- **`PAGES.json`** — declares every published page, its path and its title.
- **`MANIFEST.json`** — inventory of every tracked file with SHA-256 and class.
- **`tools/check-links.mjs`** — validates local references, the PAGES.json map, that every
  example carries an embedded project, and that the studio references nothing external.
- **`tools/check-syntax.mjs`** — parses every inline script in every published page.
- **`tools/manifest.mjs`** — writes and verifies the manifest.
- **GitHub Actions CI** — runs the three checks on every push and pull request.
- **`SECURITY.md`, `PRIVACY.md`, `CONTRIBUTING.md`** — scope, data handling and house rules.
- **`404.html`, `favicon.svg`, `manifest.webmanifest`, `robots.txt`, `sitemap.xml`** — the
  site is now installable, indexable and has a real not-found page.

### Changed
- Landing page head: favicon, web manifest and theme colour.

## [1.0.0] — 2026-11-13

First public release.

### Added
- **Wizard** — pick one of six art styles, paste a story, choose mood, pace and transition,
  then generate a show and start playing it.
- **Story engine** — sentence splitting, clause-based title extraction, keyword mapping over
  fourteen motifs, and a five-beat expansion for very short inputs.
- **Six art styles** — Pixel Arcade, Stick Figure, Neon Night, Paper Cut, Cosmic Dream,
  VHS Retro. Each has its own palette, typography, background art, shape painting, internal
  render resolution and post-processing.
- **Fourteen morphable motifs** — closed polygons resampled to a common point count, so any
  motif can interpolate into any other.
- **Seven transitions** — morph, fade, slide, wipe, iris, glitch, hard cut.
- **Ten text entrances** — rise, fade, zoom, slide, slideR, drop, flip, blur, pop, none.
- **Eight easing curves** — linear, out, inOut, back, expo, elastic, bounce, spring.
- **Three camera moves** — push in, pull out, pan.
- **Procedural soundtrack** — seven moods with their own tempo, root, scale, chord progression,
  drum pattern and reverb, synthesised live with the Web Audio API.
- **Editor** — scene list with reorder and delete, proportional timeline, transport with speed
  and loop, per-scene inspector, live style switching.
- **Undo and redo** across every edit, with a sixty-step history.
- **Project files** — save and open `.kinemotif.json`, or reopen an exported show and keep
  editing it.
- **Export** — a standalone, offline, single-file HTML show with its own soundtrack.
- **Accessibility** — respects `prefers-reduced-motion` by not auto-playing.
- **Documentation** — guide, reference, project format, landing page and four example shows.

### Known limitations
- The story engine is rule-based, not a language model.
- Shows export as HTML, not video.
- Audio requires a click before it can start, per browser autoplay policy.
