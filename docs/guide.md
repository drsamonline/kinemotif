# Guide

Everything you need to make a show, start to finish. Ten minutes.

---

## 1. Opening the studio

Open `studio/kinemotif.html` in a browser. That is the whole install.

You will land on the wizard. It has three steps and one button.

**Pick a look.** Six cards, each showing a live mini-render of that style — not a screenshot,
a real scene drawn by the same engine you are about to use. Click one.

**Give it a story.** Either tap a demo chip to load a sample story, or paste your own text into
the box. Anything works: a paragraph, a script, bullet points, a topic. Each sentence becomes a
scene. If your text is shorter than three sentences, Kinemotif expands it into a five-beat arc
so you still get a show.

**Set the mood.** Choose a soundtrack mood, a pace (Brisk / Normal / Slow) and the default
scene transition. Then press **Generate my show**.

The show starts playing immediately, with music, and drops you into the editor.

> If your operating system is set to *reduce motion*, the show will not auto-play. That is
> deliberate. Press play when you are ready.

---

## 2. The editor

```
┌───────────────────────── top bar ─────────────────────────┐
│ title · undo · redo · open · save · help · export          │
├──────────┬──────────────────────────────┬─────────────────┤
│ scenes   │                              │ inspector       │
│ list     │           stage              │ (selected scene)│
│          │                              │                 │
│ look     ├──────────────────────────────┤                 │
│ sound    │ transport · timeline         │                 │
└──────────┴──────────────────────────────┴─────────────────┘
```

### Scenes list (left)

Every scene in order, with its motif, duration, entrance and transition. Click to select and
jump to it. Hover a row for three buttons:

- **↑ / ↓** move the scene earlier or later
- **✕** delete it (you cannot delete the last one)

The **+** in the panel header appends a new blank scene.

### Stage and timeline (centre)

The canvas is the real thing — 1920×1080, letterboxed to fit. Below it:

- **⏮ / ▶ / ⏭** previous scene, play-pause, next scene
- **Speed** 0.5× to 2×, which does not affect the exported show's timing
- **↻** loop the whole show
- **⛶** fullscreen

The strip at the bottom is the timeline. Each block is a scene, sized by its duration, and the
cyan line is the playhead. Click any block to select and seek to it.

### Inspector (right)

Everything about the selected scene.

| Field | What it does |
|---|---|
| **Title** | The large type. Auto-shrinks to fit two lines. |
| **Text** | The body copy, revealed word by word. Five lines maximum. |
| **Visual** | Which motif is drawn — see the [reference](reference.md) for all fourteen. |
| **Entrance** | How the text arrives: rise, fade, zoom, slide, slideR, drop, flip, blur, pop, none. |
| **Easing** | The curve driving that entrance: linear, out, inOut, back, expo, elastic, bounce, spring. |
| **Layout** | *Text + visual* puts type on the left and the motif on the right. *Centered* is a title card with the motif ghosted behind. |
| **Camera** | A slow move across the scene: in (push), out (pull), pan (drift sideways), none. |
| **Duration** | 2–15 seconds for this scene. |
| **Transition** | How this scene hands over to the next one. |
| **Accent** | The colour used for the motif, the title underline and the glow. |

### Sound

**New music** gives the show a different soundtrack — a new seed means a new key, tempo, chord
progression, bass line, arpeggio, drum style and melody. The line underneath reads the result:
`A · 118 BPM · seed 3417`. The seed is saved with the project, so a show keeps its music and an
exported show always sounds the same.

### Look and sound (left, below scenes)

Ten style swatches — clicking one restyles the entire show and reassigns accent colours from the
new palette.

**Mix styles** is the interesting one: tick any combination of styles, press **Apply mix to
scenes**, and every scene takes the next style in your list. Tick two and the show alternates;
tick all ten and it walks the whole range. The per-scene Style field in the inspector still
overrides the mix for that one scene.

Below that, the soundtrack mood, **New music**, a mute toggle, and the live key/tempo/seed
readout.

### Top bar

| Button | Action |
|---|---|
| **↶ ↷** | Undo and redo. Every edit is snapshotted. |
| **Open** | Load a `.kinemotif.json` project — or an exported `.html` show, which reopens as editable. |
| **Save .json** | Download the project file. |
| **?** | Keyboard shortcuts. |
| **New from story** | Back to the wizard. Your current project stays in the browser. |
| **Export HTML show** | Writes the standalone file. |

---

## 3. Exporting

**Export HTML show** produces one file named after your project title. It contains the player,
the renderer, the music engine and your project data — nothing else. Open it anywhere, offline.

It opens to a play gate: one click starts the show and the sound. Then:

- click the picture or press `Space` to pause
- `M` mutes
- `←` `→` skip scenes

That file is also editable again: bring it back into the studio with **Open**.

---

## 4. Working habits that help

**Write in concrete sentences.** The motif picker matches keywords — *rain*, *river*, *sea*,
*climb*, *team*, *train*, *seed*. A sentence about "synergy" will get a generic shape; a
sentence about "a river carrying silt to the sea" gets water.

**One idea per sentence.** One sentence, one scene. Long sentences get a title cut from their
first clause, which reads well when the sentence has a clear subject.

**Pick the style before you fine-tune.** Changing style rewrites every accent colour from the
new palette, so any accent you set by hand will be replaced.

**Use Centered sparingly.** It is a title card: big type, motif ghosted behind. Two or three
per show — open, a beat in the middle, close — reads better than all of them.

**Match the camera to the pace.** `in` for most scenes, `pan` for a change of subject, `out`
for a closing scene.

---

## 5. Keyboard

| Key | Action |
|---|---|
| `Space` | Play / pause |
| `←` `→` | Previous / next scene |
| `Ctrl`/`Cmd` + `Z` | Undo |
| `Ctrl`/`Cmd` + `Shift` + `Z` | Redo |
| `E` | Export |
| `?` | Shortcut panel |
| `Esc` | Close the panel |

---

## 6. Troubleshooting

**There is no sound.** Browsers require a user gesture before audio can start. Press play. If
the mute button says *Music: off*, click it. Selecting the *Silent* mood produces no music by
design.

**The show stutters.** Lower the style to Pixel Arcade or VHS Retro — both render at a smaller
internal resolution. Close other GPU-heavy tabs.

**My work disappeared.** Projects live in `localStorage` for that browser and that file
location. Moving the file, using private mode, or clearing site data loses it. Export or
**Save .json** for anything you care about.

**An export shows the wrong thing.** The export captures the document as it stands, including
the current project. If you have two tabs open, export from the one you have been editing.
