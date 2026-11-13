/* ============================================================
   Kinemotif — app: wizard, story engine, editor, player, export
   ============================================================ */
(function () {
  'use strict';

  var MS = window.MS;
  var STYLES = MS.STYLES;
  var $ = function (id) { return document.getElementById(id); };
  var REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  window.MS_REDUCE = REDUCE;

  /* ------------------------------------------------------------
     DEMO STORIES
     ------------------------------------------------------------ */
  var DEMOS = [
    {
      name: 'The Water Cycle',
      text: 'Water is always on the move. The sun warms the sea and water rises as invisible vapour. High in the cold sky it gathers into clouds. When the clouds grow heavy, rain falls back to the ground. Rivers carry it home to the ocean. And the whole journey starts again.'
    },
    {
      name: 'A Seed Becomes a Tree',
      text: 'Every forest begins with one small seed. Buried in the dark soil, it waits for water. Then a root pushes down and a shoot reaches for the light. Years pass and the shoot becomes a trunk. Branches spread and leaves catch the sun. Today the tree gives shade to everything beneath it.'
    },
    {
      name: 'Why We Ship Fast',
      text: 'Big plans move slowly. Small releases move every week. When you ship often, feedback arrives while the idea is still warm. You learn what people actually need instead of what we assumed. Each small release makes the next one cheaper. Speed is not carelessness, it is how we listen.'
    },
    {
      name: 'A Night in the City',
      text: 'The city does not sleep. Neon signs flicker over empty streets. A last train pulls out of the station. Somewhere a kitchen is still open. Dawn arrives quietly over the rooftops. And the city starts again.'
    }
  ];

  /* ------------------------------------------------------------
     STORY → SCENES
     ------------------------------------------------------------ */
  var KW = {
    sun: ['sun', 'light', 'morning', 'bright', 'hope', 'summer', 'warm', 'day', 'shine'],
    moon: ['moon', 'night', 'sleep', 'quiet', 'calm', 'dark', 'dawn'],
    mountain: ['mountain', 'climb', 'challenge', 'goal', 'peak', 'high', 'struggle', 'hard'],
    tree: ['tree', 'seed', 'grow', 'root', 'forest', 'plant', 'soil', 'leaf', 'leaves'],
    city: ['city', 'town', 'office', 'market', 'business', 'team', 'work', 'build', 'street', 'train'],
    wave: ['water', 'sea', 'ocean', 'river', 'flow', 'rain', 'wave', 'liquid', 'drink', 'fall'],
    cloud: ['cloud', 'sky', 'weather', 'vapour', 'vapor', 'air', 'wind', 'float', 'rise'],
    star: ['star', 'space', 'wish', 'magic', 'wonder', 'future', 'dream'],
    rocket: ['rocket', 'launch', 'start', 'fast', 'speed', 'progress', 'ship', 'release'],
    bulb: ['idea', 'think', 'learn', 'know', 'insight', 'understand', 'discover', 'why', 'assume'],
    heart: ['heart', 'love', 'care', 'health', 'feel', 'people', 'friend', 'patient', 'listen'],
    book: ['book', 'story', 'read', 'study', 'lesson', 'write', 'history', 'plan'],
    planet: ['planet', 'world', 'earth', 'global', 'everyone', 'together', 'all of us'],
    spiral: ['change', 'again', 'cycle', 'loop', 'repeat', 'transform', 'journey', 'begins']
  };

  var STOP = { and: 1, the: 1, a: 1, an: 1, of: 1, to: 1, in: 1, it: 1, is: 1, as: 1, that: 1, with: 1, for: 1, on: 1, at: 1, but: 1, or: 1, its: 1, was: 1, were: 1, are: 1, from: 1, by: 1 };

  function titleFrom(txt) {
    var t = String(txt).split(/[,;:—–]/)[0].trim();
    var words = t.split(' ');
    if (words.length > 7) {
      var cut = words.slice(0, 6);
      while (cut.length > 2 && STOP[cut[cut.length - 1].toLowerCase().replace(/[^a-z]/g, '')]) cut.pop();
      t = cut.join(' ');
    }
    t = t.replace(/[.!?]+$/, '').trim();
    if (!t) t = 'Untitled';
    t = t.charAt(0).toUpperCase() + t.slice(1);
    if (t.length > 52) t = t.slice(0, 50).trim() + '…';
    return t;
  }
  function trimBody(txt, max) {
    var t = String(txt).trim();
    max = max || 190;
    if (t.length <= max) return t;
    t = t.slice(0, max);
    t = t.slice(0, Math.max(0, t.lastIndexOf(' ')));
    return t.replace(/[,;:—–]$/, '') + '…';
  }
  function pickMotif(txt, i, prev) {
    var t = String(txt).toLowerCase(), best = null, bestScore = 0;
    Object.keys(KW).forEach(function (k) {
      var sc = 0;
      KW[k].forEach(function (w) { if (t.indexOf(w) >= 0) sc += (w.length > 5 ? 1.6 : 1); });
      if (sc > bestScore) { bestScore = sc; best = k; }
    });
    if (!best) best = MS.MOTIF_LIST[(i * 3 + 2) % MS.MOTIF_LIST.length];
    if (best === prev && bestScore === 0) {
      var list = MS.MOTIF_LIST;
      best = list[(list.indexOf(best) + 3) % list.length];
    }
    return best;
  }
  function accentFor(i, styleId) {
    var st = STYLES[styleId] || STYLES.neon;
    var c = st.pal.a[i % st.pal.a.length];
    /* keep the accent legible on the style's own background */
    return (MS.ensureContrast ? MS.ensureContrast(c, st.pal.bg, 3) : c);
  }

  function expandShort(topic) {
    var t = String(topic).replace(/[.!?]+$/, '').trim() || 'this idea';
    return [
      'Everything starts with ' + t + '.',
      'At first it looks simple, almost too simple to notice.',
      'Then one part begins to move, and the rest follow.',
      'Something small turns into something you can see.',
      'And that is how ' + t + ' actually works.'
    ];
  }

  function generateProject(text, opts) {
    opts = opts || {};
    var style = opts.style || 'neon';
    var pace = opts.pace || 1;
    var s = String(text || '').replace(/\s+/g, ' ').trim();
    var sentences = s.split(/(?<=[.!?])\s+/).filter(function (x) { return x.trim().length > 1; });
    if (sentences.length < 3) sentences = expandShort(s || 'this idea');

    var maxScenes = opts.maxScenes || 12;
    var n = sentences.length <= maxScenes ? sentences.length : maxScenes;
    n = Math.max(3, n);

    var chunks = [], per = sentences.length / n, i;
    for (i = 0; i < n; i++) {
      var a = Math.round(i * per), b = Math.round((i + 1) * per);
      var part = sentences.slice(a, b).join(' ').trim();
      if (part) chunks.push(part);
    }
    if (!chunks.length) chunks = [s];

    var styleSet = (opts.styles && opts.styles.length) ? opts.styles.slice() : [style];
    var scenes = [], prev = null;
    chunks.forEach(function (txt, k) {
      var m = pickMotif(txt, k, prev);
      prev = m;
      var last = k === chunks.length - 1;
      var ttl = titleFrom(txt);
      var bdy = trimBody(txt);
      var clean = ttl.replace(/\u2026$/, '');
      if (clean && bdy.toLowerCase().indexOf(clean.toLowerCase()) === 0) {
        var rest = bdy.slice(clean.length)
          .replace(/^[\s.,;:!?\u2014\u2013-]+/, '')
          .replace(/^(and|but|then|so)\s+/i, '')
          .trim();
        bdy = rest.length > 24 ? rest.charAt(0).toUpperCase() + rest.slice(1) : '';
      }
      var visualCycle = ['motif', 'motif', 'bars', 'flow', 'motif', 'rings', 'timeline', 'orbit', 'steps', 'grid'];
      var fxCycle = ['reveal', 'pop', 'typewriter', 'highlight', 'wave', 'split', 'glitch'];
      var scene = {
        title: ttl,
        body: bdy,
        motif: m,
        visual: visualCycle[k % visualCycle.length],
        textFx: fxCycle[k % fxCycle.length],
        dur: (k === 0 ? 4.5 : 5.5) * pace,
        layout: (k === 0 || (last && chunks.length > 2)) ? 'center' : 'split',
        transition: opts.transition || 'morph',
        accent: accentFor(k, styleSet[k % styleSet.length]),
        enter: k === 0 ? 'zoom' : 'rise',
        ease: 'back',
        cam: k % 3 === 2 ? 'pan' : 'in'
      };
      if (styleSet.length > 1) scene.style = styleSet[k % styleSet.length];
      scenes.push(scene);
    });

    return {
      title: opts.title || titleFrom(s) || 'My show',
      style: styleSet[0],
      musicSeed: Math.floor(Math.random() * 0xFFFFFFFF),
      mood: opts.mood || 'uplifting',
      pace: pace,
      transition: opts.transition || 'morph',
      scenes: scenes
    };
  }

  /* ------------------------------------------------------------
     STATE
     ------------------------------------------------------------ */
  var P = null;
  var sel = 0, playing = false, time = 0, speed = 1, lastTs = 0, dirty = true;
  var loopShow = true, playOnly = false, lastSceneIdx = -1;
  var SAVE_KEY = 'kinemotif.project.v1';
  var hist = [], histIdx = -1, histTimer = null, histLock = false;

  function total() {
    var t = 0;
    (P.scenes || []).forEach(function (s) { t += Math.max(0.8, s.dur || 5); });
    return t || 1;
  }
  function sceneStart(i) {
    var t = 0;
    for (var k = 0; k < i; k++) t += Math.max(0.8, P.scenes[k].dur || 5);
    return t;
  }
  function currentIndex() {
    var acc = 0, i;
    for (i = 0; i < P.scenes.length; i++) {
      var d = Math.max(0.8, P.scenes[i].dur || 5);
      if (time < acc + d || i === P.scenes.length - 1) return i;
      acc += d;
    }
    return 0;
  }

  /* ---------------- history ---------------- */
  function snapshot() {
    if (histLock || playOnly) return;
    clearTimeout(histTimer);
    histTimer = setTimeout(function () {
      var j = JSON.stringify(P);
      if (hist[histIdx] === j) return;
      hist = hist.slice(0, histIdx + 1);
      hist.push(j);
      if (hist.length > 60) hist.shift();
      histIdx = hist.length - 1;
      histButtons();
    }, 450);
  }
  function histButtons() {
    if ($('btnUndo')) $('btnUndo').disabled = histIdx <= 0;
    if ($('btnRedo')) $('btnRedo').disabled = histIdx >= hist.length - 1;
  }
  function resetHistory() {
    hist = [JSON.stringify(P)];
    histIdx = 0;
    histButtons();
  }
  function applySnapshot(j) {
    histLock = true;
    P = JSON.parse(j);
    sel = Math.min(sel, P.scenes.length - 1);
    if (sel < 0) sel = 0;
    buildEditor(); syncControls(); renderSceneList(); renderTimeline(); fillInspector();
    dirty = true;
    histLock = false;
    persist();
  }
  function undo() { if (histIdx > 0) { histIdx--; applySnapshot(hist[histIdx]); histButtons(); } }
  function redo() { if (histIdx < hist.length - 1) { histIdx++; applySnapshot(hist[histIdx]); histButtons(); } }

  var saveTimer = null;
  function persist() {
    if (playOnly) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(P)); } catch (e) { }
    }, 350);
  }
  function save() { snapshot(); persist(); }
  function loadSaved() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      var p = JSON.parse(raw);
      if (p && p.scenes && p.scenes.length) return p;
    } catch (e) { }
    return null;
  }

  /* ------------------------------------------------------------
     RENDER LOOP
     ------------------------------------------------------------ */
  var stage = null;
  function loop(ts) {
    requestAnimationFrame(loop);
    var dt = lastTs ? Math.min(0.06, (ts - lastTs) / 1000) : 0;
    lastTs = ts;
    if (!P) return;
    if (playing) {
      time += dt * speed;
      if (time >= total()) {
        if (loopShow) time = 0;
        else { time = total() - 0.001; pause(); }
      }
      dirty = true;
    }
    if (dirty && stage) {
      MS.drawFrame(stage, P, time);
      dirty = false;
    }
    updateHead();
  }

  function updateHead() {
    if (!P || !$('head')) return;
    var pct = MS.clamp(time / total(), 0, 1) * 100;
    $('head').style.left = pct + '%';
    if (!playOnly) {
      $('timeLbl').textContent = fmt(time) + ' / ' + fmt(total());
      var idx = currentIndex();
      if (idx !== lastSceneIdx) {
        lastSceneIdx = idx;
        var segs = $('track').children;
        for (var i = 0; i < segs.length; i++) segs[i].classList.toggle('now', i === idx);
      }
    }
  }
  function fmt(t) {
    t = Math.max(0, t);
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ------------------------------------------------------------
     PLAYER
     ------------------------------------------------------------ */
  function play() {
    if (!P) return;
    playing = true;
    lastTs = 0;
    window.Music.start();
    var b = $('btnPlay'); if (b) b.textContent = '❚❚';
  }
  function pause() {
    playing = false;
    window.Music.stop();
    var b = $('btnPlay'); if (b) b.textContent = '▶';
  }
  function toggle() { if (playing) pause(); else play(); }
  function seek(t) {
    time = MS.clamp(t, 0, total() - 0.001);
    dirty = true;
    lastSceneIdx = -1;
    updateHead();
  }
  function select(i) {
    sel = MS.clamp(i, 0, P.scenes.length - 1);
    renderSceneList();
    renderTimeline();
    fillInspector();
    dirty = true;
  }

  /* ------------------------------------------------------------
     WIZARD
     ------------------------------------------------------------ */
  var wizardStyle = 'neon';

  function previewStyle(styleId, canvas, sc, t) {
    var st = STYLES[styleId];
    var b = document.createElement('canvas');
    b.width = st.res[0]; b.height = st.res[1];
    MS.renderInto(b, sc, t, st);
    canvas.width = b.width; canvas.height = b.height;
    var g = canvas.getContext('2d');
    g.imageSmoothingEnabled = !!st.smooth;
    g.drawImage(b, 0, 0);
  }

  function buildWizard() {
    var host = $('styleCards');
    host.innerHTML = '';
    var previewScene = { title: 'Hello', body: 'a tiny preview', motif: 'sun', dur: 8, layout: 'split', accent: null, enter: 'none', cam: 'none' };
    MS.STYLE_LIST.forEach(function (st) {
      var card = document.createElement('button');
      card.className = 'style-card' + (st.id === wizardStyle ? ' on' : '');
      card.type = 'button';
      card.innerHTML = '<canvas class="sw"></canvas><div class="sc-name">' + st.name + '</div><div class="sc-blurb">' + st.blurb + '</div>';
      host.appendChild(card);
      var cvs = card.querySelector('canvas');
      var sc = Object.assign({}, previewScene, { accent: st.pal.a[0] });
      try { previewStyle(st.id, cvs, sc, 1.6); } catch (e) { }
      card.onclick = function () {
        wizardStyle = st.id;
        Array.prototype.forEach.call(host.children, function (c) { c.classList.remove('on'); });
        card.classList.add('on');
      };
    });

    var picks = $('wizStyles');
    if (picks) {
      picks.innerHTML = '';
      MS.STYLE_LIST.forEach(function (st) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'pick on';
        b.dataset.style = st.id;
        b.innerHTML = '<i style="background:' + st.pal.a[0] + '"></i>' + st.name.split(' ')[0];
        b.onclick = function () { b.classList.toggle('on'); };
        picks.appendChild(b);
      });
    }

    var chips = $('demoChips');
    chips.innerHTML = '';
    DEMOS.forEach(function (d) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = d.name;
      b.onclick = function () {
        $('storyInput').value = d.text;
        $('storyInput').focus();
      };
      chips.appendChild(b);
    });

    var ms = $('wizMood');
    ms.innerHTML = '';
    window.Music.MOOD_LIST.forEach(function (k) {
      var o = document.createElement('option');
      o.value = k; o.textContent = window.Music.MOODS[k].label;
      ms.appendChild(o);
    });
    ms.value = 'uplifting';
  }

  function startFromWizard() {
    var text = $('storyInput').value.trim();
    if (!text) text = DEMOS[0].text;
    var mood = $('wizMood').value;
    var pace = parseFloat($('wizPace').value) || 1;
    var trans = $('wizTrans').value;
    var picks = [];
    var host = $('wizStyles');
    if (host) {
      Array.prototype.forEach.call(host.children, function (b) {
        if (b.classList.contains('on')) picks.push(b.dataset.style);
      });
    }
    if (!picks.length) picks = [wizardStyle];
    P = generateProject(text, { style: picks[0], styles: picks, mood: mood, pace: pace, transition: trans });
    enterStudio(true);
  }

  function startBlank() {
    P = {
      title: 'Untitled show', style: wizardStyle, mood: ($('wizMood') || {}).value || 'uplifting',
      pace: 1, transition: 'morph',
      scenes: [{
        title: 'Your first slide', body: 'Edit me on the right, then press play.',
        motif: 'sun', dur: 5, layout: 'center', transition: 'morph',
        accent: accentFor(0, wizardStyle), enter: 'zoom', ease: 'back', cam: 'in'
      }]
    };
    enterStudio(true);
  }

  function enterStudio(fresh) {
    document.documentElement.className = 'mode-studio';
    if (P.musicSeed == null) P.musicSeed = Math.floor(Math.random() * 0xFFFFFFFF);
    window.Music.setSeed(P.musicSeed);
    window.Music.setMood(P.mood || 'uplifting');
    updateMusicLabel();
    sel = 0;
    time = 0; lastTs = 0;
    buildEditor();
    syncControls();
    renderSceneList();
    renderTimeline();
    fillInspector();
    dirty = true;
    resetHistory();
    persist();
    if (fresh && !REDUCE) { setTimeout(function () { play(); }, 120); }
  }

  /* ------------------------------------------------------------
     EDITOR
     ------------------------------------------------------------ */
  function buildEditor() {
    var row = $('styleRow');
    if (!row.dataset.built) {
      row.dataset.built = '1';
      MS.STYLE_LIST.forEach(function (st) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'swatch';
        b.dataset.style = st.id;
        b.innerHTML = '<i style="background:' + st.pal.a[0] + '"></i>' + st.name.split(' ')[0];
        b.onclick = function () {
          P.style = st.id;
          P.scenes.forEach(function (sc, i) { sc.accent = accentFor(i, st.id); });
          syncControls(); fillInspector(); dirty = true; save();
        };
        row.appendChild(b);
      });

      var ms = $('moodSel');
      window.Music.MOOD_LIST.forEach(function (k) {
        var o = document.createElement('option');
        o.value = k; o.textContent = window.Music.MOODS[k].label;
        ms.appendChild(o);
      });

      var ts = $('fTrans');
      ['morph', 'fade', 'slide', 'wipe', 'iris', 'glitch', 'none'].forEach(function (t) {
        var o = document.createElement('option'); o.value = t; o.textContent = t; ts.appendChild(o);
      });

      var fm = $('fMotif');
      MS.MOTIF_LIST.forEach(function (m) {
        var o = document.createElement('option'); o.value = m; o.textContent = MS.MOTIFS[m].label; fm.appendChild(o);
      });

      var fs = $('fStyle');
      var o0 = document.createElement('option'); o0.value = ''; o0.textContent = 'Inherit show style'; fs.appendChild(o0);
      MS.STYLE_LIST.forEach(function (st) {
        var o = document.createElement('option'); o.value = st.id; o.textContent = st.name; fs.appendChild(o);
      });

      var fv = $('fVisual');
      MS.VISUALS.forEach(function (v) {
        var o = document.createElement('option'); o.value = v; o.textContent = v; fv.appendChild(o);
      });

      var ffx = $('fTextFx');
      MS.TEXT_FX.forEach(function (v) {
        var o = document.createElement('option'); o.value = v; o.textContent = v; ffx.appendChild(o);
      });

      var fe = $('fEnter');
      ['rise', 'fade', 'zoom', 'slide', 'slideR', 'drop', 'flip', 'blur', 'pop', 'none'].forEach(function (v) {
        var o = document.createElement('option'); o.value = v; o.textContent = v; fe.appendChild(o);
      });

      var fa = $('fEase');
      Object.keys(MS.EASES).forEach(function (v) {
        var o = document.createElement('option'); o.value = v; o.textContent = v; fa.appendChild(o);
      });

      var fc = $('fCam');
      ['in', 'out', 'pan', 'none'].forEach(function (v) {
        var o = document.createElement('option'); o.value = v; o.textContent = v; fc.appendChild(o);
      });
    }
    $('stagewrap').style.display = '';
    stage = $('stage');
  }

  function updateMusicLabel() {
    var el = $('musicInfo');
    if (!el) return;
    var plan = window.Music.plan();
    if (!plan) { el.textContent = ''; return; }
    var names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    el.textContent = names[((plan.root % 12) + 12) % 12] + ' · ' + plan.bpm + ' BPM · seed ' + (plan.seed % 9973);
  }

  function syncControls() {
    $('projTitle').value = P.title || 'My show';
    $('moodSel').value = P.mood || 'uplifting';
    Array.prototype.forEach.call($('styleRow').children, function (b) {
      b.classList.toggle('on', b.dataset.style === P.style);
    });
  }

  function renderSceneList() {
    var host = $('sceneList');
    host.innerHTML = '';
    P.scenes.forEach(function (sc, i) {
      var row = document.createElement('div');
      row.className = 'scene-item' + (i === sel ? ' sel' : '');
      var main = document.createElement('div');
      main.className = 'si-main';
      var t = document.createElement('div');
      t.className = 'si-title'; t.textContent = sc.title || 'Untitled';
      var s = document.createElement('div');
      s.className = 'si-sub';
      var look = (sc.style ? sc.style + ' · ' : '') + (sc.visual && sc.visual !== 'motif' ? sc.visual : sc.motif);
      s.textContent = look + ' · ' + (Math.round((sc.dur || 5) * 10) / 10) + 's · ' + (sc.textFx || 'reveal');
      main.appendChild(t); main.appendChild(s);
      var num = document.createElement('div');
      num.className = 'si-num'; num.textContent = i + 1;
      var tools = document.createElement('div');
      tools.className = 'si-tools';
      [['up', '↑'], ['down', '↓'], ['del', '✕']].forEach(function (pair) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = pair[1]; b.dataset.a = pair[0];
        b.onclick = function (ev) {
          ev.stopPropagation();
          if (pair[0] === 'up' && i > 0) { var x = P.scenes.splice(i, 1)[0]; P.scenes.splice(i - 1, 0, x); select(i - 1); }
          else if (pair[0] === 'down' && i < P.scenes.length - 1) { var y = P.scenes.splice(i, 1)[0]; P.scenes.splice(i + 1, 0, y); select(i + 1); }
          else if (pair[0] === 'del' && P.scenes.length > 1) { P.scenes.splice(i, 1); select(Math.min(i, P.scenes.length - 1)); }
          renderTimeline(); dirty = true; save();
        };
        tools.appendChild(b);
      });
      row.appendChild(num); row.appendChild(main); row.appendChild(tools);
      row.onclick = function () { select(i); seek(sceneStart(i)); };
      host.appendChild(row);
    });
  }

  function renderTimeline() {
    var track = $('track');
    track.innerHTML = '';
    P.scenes.forEach(function (sc, i) {
      var d = document.createElement('div');
      d.className = 'seg' + (i === sel ? ' sel' : '');
      d.style.flexGrow = Math.max(0.7, sc.dur || 5);
      d.innerHTML = '<b>' + (i + 1) + '</b>';
      d.title = sc.title;
      d.onclick = function () { select(i); seek(sceneStart(i)); };
      track.appendChild(d);
    });
    lastSceneIdx = -1;
    dirty = true;
  }

  function fillInspector() {
    var sc = P.scenes[sel];
    if (!sc) return;
    $('sceneNum').textContent = '#' + (sel + 1);
    $('fTitle').value = sc.title || '';
    $('fBody').value = sc.body || '';
    $('fStyle').value = sc.style || '';
    $('fVisual').value = sc.visual || 'motif';
    $('fTextFx').value = sc.textFx || 'reveal';
    $('fMotif').value = sc.motif || 'sun';
    $('fLayout').value = sc.layout || 'split';
    $('fDur').value = sc.dur || 5;
    $('fDurLbl').textContent = (Math.round((sc.dur || 5) * 10) / 10) + 's';
    $('fTrans').value = sc.transition || 'morph';
    $('fEnter').value = sc.enter || 'rise';
    $('fEase').value = sc.ease || 'back';
    $('fCam').value = sc.cam || 'in';
    $('fAccent').value = toHex(sc.accent || '#ff2d95');
  }

  function toHex(c) {
    if (/^#[0-9a-f]{6}$/i.test(c)) return c;
    return '#ff2d95';
  }

  function bindInspector() {
    function upd(fn, extra) {
      return function () {
        var sc = P.scenes[sel];
        if (!sc) return;
        fn(sc);
        renderSceneList(); fillInspector(); dirty = true; save();
        if (extra) extra();
      };
    }
    $('fTitle').oninput = upd(function (sc) { sc.title = $('fTitle').value; });
    $('fBody').oninput = upd(function (sc) { sc.body = $('fBody').value; });
    $('fMotif').onchange = upd(function (sc) { sc.motif = $('fMotif').value; });
    $('fStyle').onchange = upd(function (sc) {
      var v = $('fStyle').value;
      if (v) { sc.style = v; sc.accent = accentFor(0, v); }
      else { delete sc.style; }
    });
    $('fVisual').onchange = upd(function (sc) { sc.visual = $('fVisual').value; });
    $('fTextFx').onchange = upd(function (sc) { sc.textFx = $('fTextFx').value; });
    $('fLayout').onchange = upd(function (sc) { sc.layout = $('fLayout').value; });
    $('fDur').oninput = upd(function (sc) { sc.dur = parseFloat($('fDur').value); }, renderTimeline);
    $('fTrans').onchange = upd(function (sc) { sc.transition = $('fTrans').value; });
    $('fEnter').onchange = upd(function (sc) { sc.enter = $('fEnter').value; });
    $('fEase').onchange = upd(function (sc) { sc.ease = $('fEase').value; });
    $('fCam').onchange = upd(function (sc) { sc.cam = $('fCam').value; });
    $('fAccent').oninput = upd(function (sc) { sc.accent = $('fAccent').value; });
  }

  /* ------------------------------------------------------------
     PROJECT FILES
     ------------------------------------------------------------ */
  function slug(s) {
    return String(s || 'show').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'show';
  }
  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function saveJSON() {
    download(slug(P.title) + '.kinemotif.json', JSON.stringify({ app: 'kinemotif', version: 1, project: P }, null, 2), 'application/json');
  }
  function openFile() { $('fileInput').value = ''; $('fileInput').click(); }
  function importText(txt, name) {
    var proj = null;
    try {
      if (/\.html?$/i.test(name) || txt.indexOf('__SHOW__') >= 0) {
        var m = txt.match(/window\.__SHOW__=([\s\S]*?);window\.__PLAY__/);
        if (m) proj = JSON.parse(m[1]);
      }
      if (!proj) {
        var j = JSON.parse(txt);
        proj = j.project || j;
      }
    } catch (e) { alert('That file could not be read as a Kinemotif project.'); return; }
    if (!proj || !proj.scenes || !proj.scenes.length) { alert('No scenes found in that file.'); return; }
    P = proj;
    if (!P.style || !STYLES[P.style]) P.style = 'neon';
    enterStudio(false);
    seek(0);
  }
  function exportHTML() {
    var MARK = '<' + '!--SHOW_DATA-->';
    var json = JSON.stringify(P).replace(/</g, '\\u003c');
    var data = '<scr' + 'ipt>window.__SHOW__=' + json + ';window.__PLAY__=1;</scr' + 'ipt>';
    var src = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    if (src.indexOf(MARK) < 0) { alert('Export marker missing — cannot package this file.'); return; }
    download(slug(P.title) + '.html', src.replace(MARK, data), 'text/html');
  }

  /* ------------------------------------------------------------
     CHROME
     ------------------------------------------------------------ */
  function bindChrome() {
    $('btnPlay').onclick = toggle;
    $('btnPrev').onclick = function () { var i = Math.max(0, currentIndex() - 1); select(i); seek(sceneStart(i)); };
    $('btnNext').onclick = function () { var i = Math.min(P.scenes.length - 1, currentIndex() + 1); select(i); seek(sceneStart(i)); };
    $('btnAdd').onclick = function () {
      var i = P.scenes.length;
      P.scenes.push({
        title: 'New scene', body: 'Write something here.', motif: MS.MOTIF_LIST[i % MS.MOTIF_LIST.length],
        dur: 5, layout: 'split', transition: 'morph', accent: accentFor(i, P.style),
        visual: 'motif', textFx: 'reveal', enter: 'rise', ease: 'back', cam: 'in'
      });
      select(i); renderTimeline(); save();
    };
    $('btnExport').onclick = exportHTML;
    $('btnSaveJson').onclick = saveJSON;
    $('btnOpenJson').onclick = openFile;
    $('fileInput').onchange = function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () { importText(String(r.result), f.name); };
      r.readAsText(f);
    };
    $('btnUndo').onclick = undo;
    $('btnRedo').onclick = redo;
    $('btnHelp').onclick = function () { $('help').classList.toggle('show'); };
    $('help').onclick = function (e) { if (e.target === $('help')) $('help').classList.remove('show'); };
    $('btnNew').onclick = function () {
      pause();
      document.documentElement.className = 'mode-wizard';
      buildWizard();
    };
    $('projTitle').oninput = function () { P.title = $('projTitle').value || 'My show'; save(); };
    $('moodSel').onchange = function () {
      P.mood = $('moodSel').value;
      window.Music.setSeed(P.musicSeed || 1);
      window.Music.setMood(P.mood);
      updateMusicLabel();
      if (playing) window.Music.start();
      save();
    };
    $('btnMusic').onclick = function () {
      P.musicSeed = window.Music.newSeed();
      updateMusicLabel();
      if (playing) window.Music.start(); else window.Music.stop();
      save();
    };
    $('btnMute').onclick = function () {
      var m = !window.Music.state.muted;
      window.Music.setMuted(m);
      $('btnMute').textContent = m ? 'Music: off' : 'Music: on';
      $('btnMute').classList.toggle('off', m);
    };
    $('speed').oninput = function () { speed = parseFloat($('speed').value) || 1; };
    $('btnLoop').onclick = function () {
      loopShow = !loopShow;
      $('btnLoop').classList.toggle('off', !loopShow);
    };
    $('btnFull').onclick = function () {
      var el = document.documentElement;
      if (!document.fullscreenElement) { if (el.requestFullscreen) el.requestFullscreen(); }
      else if (document.exitFullscreen) document.exitFullscreen();
    };

    document.addEventListener('keydown', function (e) {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (document.documentElement.className !== 'mode-studio') return;
      var meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if (meta && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
      if (e.key === '?') { $('help').classList.toggle('show'); return; }
      if (e.key === 'Escape') { $('help').classList.remove('show'); return; }
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      if (e.code === 'ArrowRight') { e.preventDefault(); var n = Math.min(P.scenes.length - 1, currentIndex() + 1); select(n); seek(sceneStart(n)); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); var p = Math.max(0, currentIndex() - 1); select(p); seek(sceneStart(p)); }
      if (e.key === 'e') exportHTML();
    });
  }

  /* ------------------------------------------------------------
     PLAY-ONLY MODE (exported file)
     ------------------------------------------------------------ */
  function setupPlayOnly() {
    playOnly = true;
    loopShow = true;
    document.documentElement.className = 'mode-play';
    document.title = (P.title || 'Show');
    document.body.appendChild($('stagewrap'));
    stage = $('stage');
    var layer = $('playlayer');
    layer.classList.add('show');
    $('bigplay').onclick = function () {
      layer.classList.remove('show');
      play();
    };
    stage.onclick = function () { toggle(); };
    document.addEventListener('keydown', function (e) {
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      if (e.key === 'm' || e.key === 'M') {
        var m = !window.Music.state.muted;
        window.Music.setMuted(m);
      }
      if (e.code === 'ArrowRight') { seek(sceneStart(Math.min(P.scenes.length - 1, currentIndex() + 1))); }
      if (e.code === 'ArrowLeft') { seek(sceneStart(Math.max(0, currentIndex() - 1))); }
    });
    dirty = true;
  }

  /* ------------------------------------------------------------
     BOOT
     ------------------------------------------------------------ */
  function boot() {
    if (window.__PLAY__ && window.__SHOW__) {
      P = window.__SHOW__;
      if (!P.scenes || !P.scenes.length) P = generateProject(DEMOS[0].text, {});
      setupPlayOnly();
      requestAnimationFrame(loop);
      return;
    }

    var saved = loadSaved();
    P = saved || generateProject(DEMOS[0].text, { style: 'neon', mood: 'uplifting' });

    buildWizard();
    bindInspector();
    bindChrome();
    document.documentElement.className = 'mode-wizard';

    $('wizGo').onclick = startFromWizard;
    $('wizBlank').onclick = startBlank;

    stage = $('stage');
    requestAnimationFrame(loop);

    if (REDUCE) {
      var rn = $('reduceNote');
      if (rn) rn.style.display = 'block';
    }
    if (saved) {
      var note = $('resumeNote');
      if (note) {
        note.style.display = 'block';
        $('resumeBtn').onclick = function () { P = saved; enterStudio(false); };
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.__MS_APP__ = {
    generateProject: generateProject, DEMOS: DEMOS,
    seek: seek, play: play, pause: pause, select: select,
    total: total, sceneStart: sceneStart, undo: undo, redo: redo,
    exportHTML: exportHTML, saveJSON: saveJSON, importText: importText,
    state: function () { return { time: time, total: total(), sel: sel, playing: playing, project: P, hist: hist.length, histIdx: histIdx }; }
  };
})();
