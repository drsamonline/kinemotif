#!/usr/bin/env python3
"""Assemble Kinemotif's single-file studio HTML."""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
OUT = os.path.join(ROOT, "studio", "kinemotif.html")


def read(name):
    with open(os.path.join(SRC, name), "r", encoding="utf-8") as f:
        return f.read()


css = read("style.css")
core = read("core.js")
music = read("music.js")
ui = read("ui.js")

for name, blob in (("core.js", core), ("music.js", music), ("ui.js", ui)):
    if "</scr" + "ipt" in blob:
        raise SystemExit("ERROR: %s contains a closing script tag" % name)

HTML = """<!DOCTYPE html>
<html lang="en" class="mode-wizard">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kinemotif — the HTML animation studio</title>
<meta name="description" content="Turn a paragraph into a moving, scored presentation. One HTML file. No video, no images, no internet.">
<style>
__CSS__
</style>
</head>
<body>

<!-- ===================== WIZARD ===================== -->
<div id="wizard">
  <div class="wiz-inner">
    <header>
      <div class="logo">Kine<span>motif</span></div>
      <h1>Turn a paragraph into a moving, scored presentation.</h1>
      <p class="tag">One HTML file. It draws its own artwork, animates every scene, morphs between them and synthesises an original soundtrack as it plays. No video files, no images, no internet.</p>
    </header>

    <section>
      <h2><i>1</i> Pick a look</h2>
      <div id="styleCards" class="style-cards"></div>
      <div class="pick-row"><span>Styles to mix</span><div id="wizStyles" class="style-picks"></div></div>
      <div id="wizOrder" class="mix-order"></div>
    </section>

    <section>
      <h2><i>2</i> Give it a story</h2>
      <div id="demoChips" class="chips"></div>
      <textarea id="storyInput" placeholder="Paste a paragraph, a script, or just a topic. Each sentence becomes a scene with its own picture, and the scenes morph into each other."></textarea>
    </section>

    <section>
      <h2><i>3</i> Set the mood</h2>
      <div class="row3">
        <label>Music<select id="wizMood"></select></label>
        <label>Pace<select id="wizPace">
          <option value="0.85">Brisk</option>
          <option value="1" selected>Normal</option>
          <option value="1.3">Slow</option>
        </select></label>
        <label>Format<select id="wizAspect"></select></label>
        <label>Scene transition<select id="wizTrans">
          <option value="morph" selected>Morph</option>
          <option value="fade">Fade</option>
          <option value="slide">Slide</option>
          <option value="wipe">Wipe</option>
          <option value="iris">Iris</option>
          <option value="glitch">Glitch</option>
          <option value="none">Hard cut</option>
        </select></label>
      </div>
    </section>

    <div class="wiz-actions">
      <button id="wizGo" class="primary big">Generate my show →</button>
      <button id="wizBlank" class="ghost">Start blank</button>
    </div>

    <div id="reduceNote">Your system asks for reduced motion, so shows will not auto-play here. Everything else works the same.</div>
    <div id="resumeNote" class="resume" style="display:none">
      You have a saved project in this browser. <button id="resumeBtn">Continue editing it</button>
    </div>
  </div>
</div>

<!-- ===================== EDITOR ===================== -->
<div id="editor">
  <header id="topbar">
    <div class="logo small">Kine<span>motif</span></div>
    <input id="projTitle" class="title-input" value="My show" aria-label="Project title">
    <button id="btnUndo" class="iconbtn" title="Undo (Ctrl+Z)">&#8630;</button>
    <button id="btnRedo" class="iconbtn" title="Redo (Ctrl+Shift+Z)">&#8631;</button>
    <div class="spacer"></div>
    <button id="btnOpenJson" class="ghost" title="Open a .kinemotif.json project or an exported show">Open</button>
    <button id="btnSaveJson" class="ghost" title="Save the project as JSON">Save .json</button>
    <button id="btnHelp" class="iconbtn" title="Keyboard shortcuts (?)">?</button>
    <button id="btnNew" class="ghost">New from story</button>
    <button id="btnExport" class="primary">Export HTML show</button>
    <input id="fileInput" type="file" accept=".json,.html,application/json,text/html" hidden>
  </header>

  <aside id="left">
    <div class="pane-head">Scenes <button id="btnAdd" title="Add a scene">+</button></div>
    <div id="sceneList" class="scene-list"></div>
    <div class="pane-head">Format</div>
    <select id="aspectSel" class="full"></select>
    <div class="pane-head">Look</div>
    <div id="styleRow" class="style-row"></div>
    <div class="pane-head">Mix styles</div>
    <div id="mixStyles" class="style-picks"></div>
    <button id="btnMix" class="ghost full">Apply mix to scenes</button>
    <div class="pane-head">Sound</div>
    <select id="moodSel"></select>
    <div class="fldrow">
      <button id="btnMusic" class="ghost" title="Compose a different soundtrack for this show">New music</button>
      <button id="btnMute" class="ghost">Music: on</button>
    </div>
    <div id="musicInfo" class="music-info"></div>
    <label class="toggle"><input type="checkbox" id="reactBeat" checked> Artwork pulses with the beat</label>
  </aside>

  <main id="center">
    <div id="stagewrap"><canvas id="stage" width="1920" height="1080"></canvas></div>
    <div id="transport">
      <button id="btnPrev" class="tbtn" title="Previous scene">&#9198;</button>
      <button id="btnPlay" class="tbtn play" title="Play / pause">&#9654;</button>
      <button id="btnNext" class="tbtn" title="Next scene">&#9197;</button>
      <span id="timeLbl">0:00 / 0:00</span>
      <div class="spacer"></div>
      <label class="mini">Speed<input id="speed" type="range" min="0.5" max="2" step="0.1" value="1"></label>
      <button id="btnLoop" class="tbtn" title="Loop the show">&#8635;</button>
      <button id="btnFull" class="tbtn" title="Fullscreen">&#9974;</button>
    </div>
    <div id="timeline"><div id="track"></div><div id="head"></div></div>
  </main>

  <aside id="right">
    <div class="pane-head">Scene <span id="sceneNum" class="muted"></span></div>
    <label class="fld">Title<input id="fTitle" type="text"></label>
    <label class="fld">Text<textarea id="fBody" rows="4"></textarea></label>
    <div class="fldrow">
      <label class="fld">Style<select id="fStyle"></select></label>
      <label class="fld">Visual<select id="fVisual"></select></label>
    </div>
    <label class="fld">Motif<select id="fMotif"></select></label>
    <div class="fldrow">
      <label class="fld">Entrance<select id="fEnter"></select></label>
      <label class="fld">Easing<select id="fEase"></select></label>
    </div>
    <div class="fldrow">
      <label class="fld">Layout<select id="fLayout">
        <option value="split">Text + visual</option>
        <option value="center">Centered</option>
      </select></label>
      <label class="fld">Camera<select id="fCam"></select></label>
    </div>
    <label class="fld">Duration <span id="fDurLbl" class="muted"></span><input id="fDur" type="range" min="2" max="15" step="0.5" value="5"></label>
    <div class="fldrow">
      <label class="fld">Text effect<select id="fTextFx"></select></label>
      <label class="fld">Transition<select id="fTrans"></select></label>
    </div>
    <label class="fld">Accent<input id="fAccent" type="color" value="#ff2d95"></label>
    <p class="hint">Space plays and pauses. Left and right arrows jump between scenes. Everything you edit is saved in this browser; Export writes a single HTML file that plays on its own.</p>
  </aside>
</div>

<!-- ===================== PLAY-ONLY OVERLAY ===================== -->
<div id="playlayer">
  <button id="bigplay">&#9654;&nbsp; Play the show</button>
  <div class="phint">click to pause &middot; space &middot; m mutes &middot; arrows skip scenes</div>
</div>

<!-- ===================== SHORTCUTS ===================== -->
<div id="help">
  <div class="card">
    <h3>Keyboard shortcuts</h3>
    <table>
      <tr><td><kbd>Space</kbd></td><td>Play / pause</td></tr>
      <tr><td><kbd>&larr;</kbd> <kbd>&rarr;</kbd></td><td>Previous / next scene</td></tr>
      <tr><td><kbd>Ctrl</kbd>+<kbd>Z</kbd></td><td>Undo</td></tr>
      <tr><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd></td><td>Redo</td></tr>
      <tr><td><kbd>E</kbd></td><td>Export the HTML show</td></tr>
      <tr><td><kbd>?</kbd></td><td>This panel</td></tr>
      <tr><td><kbd>Esc</kbd></td><td>Close this panel</td></tr>
    </table>
  </div>
</div>

<!--SHOW_DATA-->

<script>
__CORE__
</script>
<script>
__MUSIC__
</script>
<script>
__UI__
</script>
</body>
</html>
"""

html = (HTML
        .replace("__CSS__", css)
        .replace("__CORE__", core)
        .replace("__MUSIC__", music)
        .replace("__UI__", ui))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)

print("wrote", OUT, len(html), "bytes")
