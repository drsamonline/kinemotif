# Project format

A Kinemotif project is a small JSON document. This page describes it, and explains what is
inside an exported show.

---

## The project object

```json
{
  "title": "Water is always on the move",
  "style": "neon",
  "mood": "uplifting",
  "pace": 1,
  "transition": "morph",
  "scenes": [
    {
      "title": "Water is always on the move",
      "body": "",
      "motif": "wave",
      "dur": 4.5,
      "layout": "center",
      "transition": "morph",
      "accent": "#ff2d95",
      "enter": "zoom",
      "ease": "back",
      "cam": "in"
    }
  ]
}
```

| Key | Type | Notes |
|---|---|---|
| `title` | string | Shown in the top bar and used as the export filename. |
| `style` | string | `pixel` · `stick` · `neon` · `paper` · `cosmic` · `vhs` |
| `mood` | string | `uplifting` · `calm` · `epic` · `playful` · `tense` · `lofi` · `none` |
| `pace` | number | Duration multiplier used when generating scenes. |
| `transition` | string | Default transition for new scenes. |
| `scenes` | array | One or more scene objects. |

A scene's fields are documented in the [reference](reference.md#scene-fields).

Unknown keys are ignored, so you can add your own metadata without breaking anything.

---

## The saved project file

**Save .json** wraps the project so the studio can recognise the file:

```json
{
  "app": "kinemotif",
  "version": 1,
  "project": { "...": "the project object above" }
}
```

**Open** accepts either form: the wrapper, or a bare project object.

---

## What is inside an exported show

An exported `.html` file is the studio itself, with the project baked in. Three things change:

1. The project is written into the page as `window.__SHOW__`.
2. A flag `window.__PLAY__ = 1` is set.
3. The editor markup is still present but hidden by CSS.

On load, the player reads `window.__SHOW__`, switches the document into play-only mode, moves
the canvas to fill the viewport, and starts a request-animation-frame loop against the embedded
project. That is the whole trick — there is no separate runtime, so the export can never drift
out of sync with the studio.

### Reopening an export

Because the project is embedded in plain sight, **Open** can read an exported show back in. The
studio looks for this pattern in the file:

```
window.__SHOW__={...};window.__PLAY__=1;
```

parses the JSON, and loads it as an editable project. So an exported show is also its own
source file.

### Size

An export is roughly the size of the studio (about 95 KB) plus the project data. A six-scene
project adds 2–3 KB. There are no assets to bundle.

---

## Embedding a show in your own page

```html
<iframe src="examples/water-cycle.html"
        style="width:100%;aspect-ratio:16/9;border:0"
        title="A Kinemotif show"></iframe>
```

The show fills whatever frame it is given, letterboxed to 16:9, and asks for one click before
it plays — browsers require a gesture before audio can start.

---

## Using the renderer directly

The studio exposes its render core on `window.MS` for anyone who wants the engine without the
UI:

```js
const canvas = document.getElementById('stage');   // 1920×1080
const style  = MS.STYLES.neon;
const scene  = {
  title: 'Hello', body: 'from the render core',
  motif: 'sun', dur: 6, layout: 'split',
  accent: '#ff2d95', enter: 'pop', ease: 'spring', cam: 'in'
};

// draw a single frame at t = 2.4 seconds
MS.renderInto(canvas, scene, 2.4, style);

// or drive a whole project
MS.drawFrame(canvas, project, 12.5);
```

Useful members:

| Member | Purpose |
|---|---|
| `MS.STYLES` / `MS.STYLE_LIST` | The six styles |
| `MS.MOTIFS` / `MS.MOTIF_LIST` | The fourteen motifs |
| `MS.motifPoints(name)` | The normalised point array for a motif |
| `MS.morphPoints(a, b, t)` | Interpolated points between two motifs |
| `MS.EASES` / `MS.ENTERS` / `MS.CAMS` | Easing functions and option lists |
| `MS.renderScene(ctx, scene, t, style)` | Draw one scene into a context |
| `MS.renderInto(canvas, scene, t, style)` | Same, with the right resolution and scaling |
| `MS.drawFrame(canvas, project, time)` | Draw a full project at a global time |

The music engine is separate, on `window.Music`:

```js
Music.init();            // must follow a user gesture
Music.setMood('epic');
Music.start();
Music.setMuted(true);
Music.level();           // 0–1 RMS, for reactive visuals
```
