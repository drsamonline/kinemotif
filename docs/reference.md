# Reference

Every option the studio exposes, in one place.

---

## Styles

Switching style re-renders the whole show and reassigns accent colours from the new palette.

| id | Name | Internal resolution | Palette accents | Character |
|---|---|---|---|---|
| `pixel` | Pixel Arcade | 480 × 270 | `#ff4d6d` `#ffd166` `#3ddc97` `#4cc9f0` | 8-bit blocks, no antialiasing, arcade monospace, star field and ground strip |
| `stick` | Stick Figure | 1920 × 1080 | `#e0512f` `#2b6cb0` `#c98a00` `#2f8f6f` | Ink on cream paper, wobbly hand-drawn outlines, ruled lines, a walking stick actor |
| `neon` | Neon Night | 1280 × 720 | `#ff2d95` `#22d3ee` `#a78bfa` `#facc15` | Glowing strokes, perspective grid floor, scanlines |
| `paper` | Paper Cut | 1920 × 1080 | `#cf5c39` `#3f6f7a` `#c9a227` `#7a8450` | Layered cut-outs with drop shadows, warm serif, paper grain |
| `cosmic` | Cosmic Dream | 1280 × 720 | `#8b5cf6` `#38bdf8` `#f472b6` `#fbbf24` | Radial space gradient, twinkling stars, thin letter-spaced type |
| `blueprint` | Blueprint | 1920 × 1080 | `#7fb3ff` `#ffd166` `#9ef0c8` `#ff9fb2` | Technical drawing: navy field, cyan grid, dashed outlines, mono type |
| `riso` | Riso Print | 1920 × 1080 | `#ff4f4f` `#2f6fdb` `#f5b93f` `#2f8f6f` | Two-ink overprint with a ghost offset, cream paper, heavy grain |
| `chalk` | Chalkboard | 1920 × 1080 | `#f6e58d` `#ff9f9f` `#a8e6cf` `#d5c6e0` | Green board, wobbly chalk strokes, dust |
| `swiss` | Swiss Grid | 1920 × 1080 | `#e8342a` `#111111` `#3a6ff8` `#f2b705` | White space, hard rules, one red, tight sans |
| `vhs` | VHS Retro | 960 × 540 | `#ff2e88` `#00e5ff` `#ffb300` `#7cff5a` | 80s sunset, chromatic split on text, rolling scanlines |

---

## Motifs

Fourteen closed polygons. Any motif can morph into any other.

| id | Label | Reads as |
|---|---|---|
| `sun` | Sun | A twelve-point star |
| `moon` | Moon | A crescent |
| `mountain` | Mountain | A jagged two-peak ridge |
| `tree` | Tree | A rounded crown with a narrowing trunk |
| `city` | City | A stepped skyline with windows |
| `wave` | Waves | A sine ribbon |
| `cloud` | Cloud | A lumpy, flattened blob |
| `star` | Star | A five-point star |
| `rocket` | Rocket | A body with two fins and a flame |
| `bulb` | Idea | A bulb with a narrowed neck |
| `heart` | Heart | A parametric heart |
| `book` | Book | An open book |
| `planet` | Planet | A disc with a ring |
| `spiral` | Spiral | A two-armed coil |
| `eye` | Eye | An almond outline |
| `arrow` | Arrow | A chevron arrow |
| `bolt` | Bolt | A lightning bolt |
| `flower` | Flower | A six-petal rosette |

---

## Visuals

A scene draws either a motif or a diagram. Diagrams are built from the style's own palette, so
a bar chart in Pixel Arcade is not the same object as one in Paper Cut.

| id | What it draws |
|---|---|
| `motif` | One of the fourteen motifs above (default) |
| `bars` | Five bars rising in sequence, one of them accented |
| `flow` | Three nodes joined by arrows; the active node pulses in turn |
| `rings` | Four concentric arcs rotating at different speeds around a core |
| `orbit` | A core with three elliptical orbits and travelling dots |
| `steps` | A four-step staircase that lights up as the scene plays |
| `grid` | An 8×5 dot field with a highlight sweeping across it |
| `timeline` | A track with five nodes and a progress dot that advances |

---

## Text effects

How the body copy arrives. Independent of the entrance preset, which moves the whole block.

| id | Behaviour |
|---|---|
| `reveal` | Word by word (default) |
| `typewriter` | Character by character with a blinking caret |
| `pop` | Each word scales in on its own beat |
| `wave` | Words settle, then bob gently out of phase |
| `glitch` | Chromatic split with a jitter on the title |
| `highlight` | A coloured bar sweeps behind each line as it appears |
| `split` | Lines slide in from alternating sides |
| `kinetic` | Each word flies in, scaled and rotated on its own axis |
| `shutter` | A band sweeps across each line, revealing it like a blind |

---

## Transitions

Set per scene; it plays in the last part of that scene, handing over to the next.

| id | Effect |
|---|---|
| `morph` | Motif geometry interpolates into the next scene's motif while the text crossfades. The default. |
| `fade` | Straight dissolve between rendered frames. |
| `slide` | The next scene pushes in from the right. |
| `wipe` | A left-to-right reveal. |
| `iris` | A circular reveal from the centre. |
| `glitch` | Horizontal slices tear between the two scenes. |
| `zoom` | The next scene scales up from 82% as it fades in |
| `blinds` | Nine horizontal bands reveal the next scene in sequence |
| `none` | Hard cut. |

A transition between two scenes that use **different styles** wipes rather than dissolves: a
cross-fade would put both texts on screen at once. Morph also falls back to a wipe across styles,
because a morph has no single native resolution to interpolate in.

---

## Entrances

How the text block arrives at the start of a scene.

| id | Motion |
|---|---|
| `rise` | Drifts up into place (default) |
| `fade` | Opacity only |
| `zoom` | Scales down from 118% |
| `slide` | Slides in from the right |
| `slideR` | Slides in from the left |
| `drop` | Falls from above |
| `flip` | Vertical squash from flat |
| `blur` | Arrives out of focus |
| `pop` | Springs up from 62% |
| `none` | Already there |

---

## Easings

| id | Curve |
|---|---|
| `linear` | Constant |
| `out` | Cubic ease-out |
| `inOut` | Cubic ease-in-out |
| `back` | Overshoots then settles (default) |
| `expo` | Very fast start, long settle |
| `elastic` | Oscillates around the target |
| `bounce` | Bounces to a stop |
| `spring` | Damped spring, no overshoot spike |

---

## Cameras

A slow move across the whole scene, applied to background, motif and text together.

| id | Move |
|---|---|
| `in` | 1.00 → 1.07 zoom, pushing in (default) |
| `out` | 1.07 → 1.00 zoom, pulling back |
| `pan` | 5% zoom with a horizontal drift |
| `none` | Locked off |

---

## Moods

The soundtrack generator. A mood supplies the character — scale, tempo range, chord pool, drum
palette — and the show's `musicSeed` decides everything else: the key, the exact tempo, which four
chords make the progression, the bass shape, the arpeggio pattern, the drum style, and a melody
line walked through the scale. Change the seed and the same mood sounds like a different piece.

| id | Label | Tempo | Character |
|---|---|---|---|
| `uplifting` | Uplifting | 116 BPM | Major pentatonic, four-on-the-floor, bright arpeggio |
| `calm` | Calm | 74 BPM | No drums, long pads, gentle arpeggio |
| `epic` | Epic | 96 BPM | Natural minor, big kick pattern, wide pads |
| `playful` | Playful | 132 BPM | Fast, swung, busy arpeggio |
| `tense` | Tense | 104 BPM | Minor second in the scale, sparse drums |
| `lofi` | Lo-fi | 84 BPM | Dorian, soft drums, swung 16ths |
| `cinematic` | Cinematic | 68 BPM | Natural minor, long pads, sparse big drums |
| `dreamy` | Dreamy | 88 BPM | Lydian colour, no drums or soft only, wide pads |
| `groove` | Groove | 108 BPM | Dorian, syncopated bass, swung 16ths |
| `none` | Silent | — | No music at all |

### Bands (timbres)

The seed also picks the band — the instruments, not just the notes.

| id | Character |
|---|---|
| `glass` | Sine pads, airy plucks, long reverb |
| `warm` | Triangle pads, saw bass, medium room |
| `grit` | Saw pads, square arp, short bright reverb, busier |
| `chip` | Square everything, no reverb, tight and fast |
| `deep` | Low sine bass, slow saw pads, long dark reverb, sparse |
| `bright` | High cutoffs, saw arp, plucky lead |

### What the seed decides

| Parameter | Range |
|---|---|
| Key | Mood root transposed by 0, +2, −3 or +5 semitones |
| Tempo | Mood tempo ±6% |
| Progression | Four chords walked through a pool of 6–8, plus a second progression for the middle section |
| Bass shape | One of four 16th-note patterns |
| Arpeggio | One of five 8-step shapes, alternating between sections |
| Drums | One of the mood's three styles |
| Melody | 2–4 notes per bar over 8 bars, degree walk biased to small steps |
| Swing | Mood swing × 0.6–1.4 |
| Band | One of six timbres above — waveforms, filters, drum tuning, reverb, density |

Two sections alternate every 8 bars, so a long show changes rather than looping.

---

## Scene fields

The complete shape of a scene object. See [project-format.md](project-format.md) for the file.

| Field | Type | Values |
|---|---|---|
| `title` | string | Any text. Auto-fitted to two lines. |
| `body` | string | Any text, trimmed to five lines. May be empty. |
| `motif` | string | One of the fourteen motif ids |
| `dur` | number | Seconds, 2–15 |
| `layout` | string | `split` or `center` |
| `transition` | string | One of the seven transition ids |
| `enter` | string | One of the ten entrance ids |
| `ease` | string | One of the eight easing ids |
| `cam` | string | One of the four camera ids |
| `accent` | string | Hex colour, `#rrggbb` |
| `style` | string | Optional per-scene style override. Omit to inherit the show's style |
| `visual` | string | One of the eight visual ids. Defaults to `motif` |
| `textFx` | string | One of the seven text-effect ids. Defaults to `reveal` |
