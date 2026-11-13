# Changelog

All notable changes to Kinemotif. Format follows [Keep a Changelog](https://keepachangelog.com/),
versioning follows [Semantic Versioning](https://semver.org/).

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
