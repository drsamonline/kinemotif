/* ============================================================
   Motion Studio — render core
   Canvas engine: styles, motifs, scenes, morphing, transitions
   ============================================================ */
(function () {
  'use strict';

  var W = 1920, H = 1080, TAU = Math.PI * 2;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { t = clamp(t, 0, 1); return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function easeOutBack(t) { t = clamp(t, 0, 1); var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }

  var EASES = {
    linear: function (t) { return t; },
    out: function (t) { return easeOut(t); },
    inOut: function (t) { return easeInOut(t); },
    back: function (t) { return easeOutBack(t); },
    expo: function (t) {
      t = clamp(t, 0, 1);
      return t === 0 ? 0 : (t === 1 ? 1 : (t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2));
    },
    elastic: function (t) {
      t = clamp(t, 0, 1);
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1;
    },
    bounce: function (t) {
      t = clamp(t, 0, 1);
      var n1 = 7.5625, d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75; }
      if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375; }
      t -= 2.625 / d1; return n1 * t * t + 0.984375;
    },
    spring: function (t) {
      t = clamp(t, 0, 1);
      return 1 - Math.cos(t * Math.PI * 1.5) * Math.exp(-t * 5);
    }
  };
  var ENTERS = ['rise', 'fade', 'zoom', 'slide', 'slideR', 'drop', 'flip', 'blur', 'pop', 'none'];
  var CAMS = ['in', 'out', 'pan', 'none'];
  function enterEase(sc, t) {
    var fn = EASES[sc.ease || 'back'] || EASES.back;
    return fn(clamp(t / 0.9, 0, 1));
  }
  function cameraFor(sc, t, st) {
    if (window.MS_REDUCE || sc.cam === 'none') return { x: 0, y: 0, z: 1 };
    var dur = Math.max(0.8, sc.dur || 5);
    var e = easeInOut(clamp(t / dur, 0, 1));
    if (sc.cam === 'out') return { x: 0, y: 0, z: 1.07 - 0.07 * e };
    if (sc.cam === 'pan') return { x: lerp(-28, 28, e), y: 0, z: 1.05 };
    return { x: 0, y: 0, z: 1 + 0.07 * e };
  }

  function seeded(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    var h = 2166136261, i;
    s = String(s || '');
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  /* ------------------------------------------------------------
     COLOUR — contrast-safe accents
     Ported from the fleet's colour core: WCAG relative luminance,
     HSL round-trip, and a nudge loop that keeps an accent legible
     against whatever background the style paints.
     ------------------------------------------------------------ */
  function hexToRgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return { r: 255, g: 255, b: 255 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToHex(c) {
    function f(v) { var s = Math.round(clamp(v, 0, 255)).toString(16); return s.length < 2 ? '0' + s : s; }
    return '#' + f(c.r) + f(c.g) + f(c.b);
  }
  function channelLum(v) {
    v = clamp(v, 0, 255) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }
  function relLum(c) { return 0.2126 * channelLum(c.r) + 0.7152 * channelLum(c.g) + 0.0722 * channelLum(c.b); }
  function contrastRatio(a, b) {
    var la = relLum(hexToRgb(a)), lb = relLum(hexToRgb(b));
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  function rgbToHsl(c) {
    var r = c.r / 255, g = c.g / 255, b = c.b / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    var h = 0, s = 0, l = (max + min) / 2;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1) || 1);
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h: h, s: s * 100, l: l * 100 };
  }
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2, p;
    if (h < 60) p = [c, x, 0];
    else if (h < 120) p = [x, c, 0];
    else if (h < 180) p = [0, c, x];
    else if (h < 240) p = [0, x, c];
    else if (h < 300) p = [x, 0, c];
    else p = [c, 0, x];
    return { r: (p[0] + m) * 255, g: (p[1] + m) * 255, b: (p[2] + m) * 255 };
  }
  function ensureContrast(fg, bg, min) {
    min = min || 3;
    if (contrastRatio(fg, bg) >= min) return fg;
    var hsl = rgbToHsl(hexToRgb(fg));
    var darken = relLum(hexToRgb(bg)) > 0.32;
    var out = fg;
    for (var step = 1; step <= 24; step++) {
      var l = clamp(hsl.l + (darken ? -step * 4 : step * 4), 5, 95);
      out = rgbToHex(hslToRgb(hsl.h, hsl.s, l));
      if (contrastRatio(out, bg) >= min) return out;
    }
    return out;
  }

  /* ------------------------------------------------------------
     STYLES
     ------------------------------------------------------------ */
  var STYLES = {
    pixel: {
      id: 'pixel', name: 'Pixel Arcade', blurb: '8-bit blocks, arcade type',
      res: [480, 270], smooth: false, glow: 0,
      pal: { bg: '#150e2e', bg2: '#2a1a5e', ink: '#f7f3e3', dim: '#3d2a78', a: ['#ff4d6d', '#ffd166', '#3ddc97', '#4cc9f0'] },
      font: { d: '"Courier New",ui-monospace,monospace', b: '"Courier New",ui-monospace,monospace', dw: '700', bw: '700', sp: 2 }
    },
    stick: {
      id: 'stick', name: 'Stick Figure', blurb: 'ink on paper, hand-drawn',
      res: [1920, 1080], smooth: true, glow: 0,
      pal: { bg: '#f8f6ef', bg2: '#efece1', ink: '#191b21', dim: '#c9c3b4', a: ['#e0512f', '#2b6cb0', '#c98a00', '#2f8f6f'] },
      font: { d: '"Segoe Print","Bradley Hand","Comic Sans MS",cursive', b: '"Segoe UI",system-ui,sans-serif', dw: '700', bw: '400', sp: 0 }
    },
    neon: {
      id: 'neon', name: 'Neon Night', blurb: 'glowing strokes on black',
      res: [1280, 720], smooth: true, glow: 24,
      pal: { bg: '#05030d', bg2: '#12082b', ink: '#eaf6ff', dim: '#2a1d55', a: ['#ff2d95', '#22d3ee', '#a78bfa', '#facc15'] },
      font: { d: '"Segoe UI",system-ui,sans-serif', b: '"Segoe UI",system-ui,sans-serif', dw: '800', bw: '400', sp: 1 }
    },
    paper: {
      id: 'paper', name: 'Paper Cut', blurb: 'layered cut-outs, warm serif',
      res: [1920, 1080], smooth: true, glow: 0,
      pal: { bg: '#f4ead9', bg2: '#e8dac3', ink: '#2c2419', dim: '#dbc9ad', a: ['#cf5c39', '#3f6f7a', '#c9a227', '#7a8450'] },
      font: { d: 'Georgia,"Times New Roman",serif', b: 'Georgia,serif', dw: '700', bw: '400', sp: 0 }
    },
    cosmic: {
      id: 'cosmic', name: 'Cosmic Dream', blurb: 'deep space gradients, thin type',
      res: [1280, 720], smooth: true, glow: 18,
      pal: { bg: '#080818', bg2: '#1b1040', ink: '#f0f4ff', dim: '#2b2458', a: ['#8b5cf6', '#38bdf8', '#f472b6', '#fbbf24'] },
      font: { d: '"Segoe UI",system-ui,sans-serif', b: '"Segoe UI",system-ui,sans-serif', dw: '300', bw: '300', sp: 3 }
    },
    vhs: {
      id: 'vhs', name: 'VHS Retro', blurb: '80s sunset, chromatic fuzz',
      res: [960, 540], smooth: true, glow: 12,
      pal: { bg: '#12002e', bg2: '#480c53', ink: '#fff3d6', dim: '#63206b', a: ['#ff2e88', '#00e5ff', '#ffb300', '#7cff5a'] },
      font: { d: 'Impact,"Arial Black",sans-serif', b: '"Courier New",monospace', dw: '400', bw: '700', sp: 1 }
    }
  };
  var STYLE_LIST = ['pixel', 'stick', 'neon', 'paper', 'cosmic', 'vhs'].map(function (k) { return STYLES[k]; });

  /* ------------------------------------------------------------
     MOTIFS — every visual is a closed polygon so it can morph
     ------------------------------------------------------------ */
  function circlePts(n, r) {
    var o = [], i;
    n = n || 72; r = r || 1;
    for (i = 0; i < n; i++) { var a = i / n * TAU - Math.PI / 2; o.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); }
    return o;
  }
  function starPts(points, r1, r2, n) {
    var o = [], i, segs = points * 2;
    n = n || 64;
    for (i = 0; i < n; i++) {
      var a = i / n * TAU - Math.PI / 2;
      var k = (i / n) * segs;
      var f = Math.abs(((k % 2) + 1) % 2);
      var rad = lerp(r2, r1, f);
      o.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad });
    }
    return o;
  }
  function polyPts(arr) { return arr.map(function (p) { return { x: p[0], y: p[1] }; }); }
  function blobPts(n, bumps, amp, base) {
    var o = [], i;
    for (i = 0; i < n; i++) {
      var a = i / n * TAU - Math.PI / 2;
      var r = base + amp * Math.cos(bumps * a);
      o.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    return o;
  }
  function heartPts(n) {
    n = n || 72;
    var o = [], i;
    for (i = 0; i < n; i++) {
      var t = i / n * TAU;
      var x = 16 * Math.pow(Math.sin(t), 3);
      var y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      o.push({ x: x / 17, y: y / 17 });
    }
    return o;
  }
  function moonPts(n) {
    n = n || 72;
    var o = circlePts(n), i;
    for (i = 0; i < o.length; i++) {
      var dx = o[i].x - 0.62, dy = o[i].y + 0.18;
      var d = Math.hypot(dx, dy);
      if (d < 0.92) {
        var s = 0.92 / (d || 1e-6);
        o[i] = { x: 0.62 + dx * s, y: -0.18 + dy * s };
      }
    }
    return o;
  }
  function treePts(n) {
    n = n || 72;
    var o = [], i;
    for (i = 0; i < n; i++) {
      var a = i / n * TAU - Math.PI / 2;
      var r = 0.92 + 0.1 * Math.cos(5 * a);
      var y = Math.sin(a) * r;
      var x = Math.cos(a) * r;
      if (y > 0.45) { x *= clamp(1 - (y - 0.45) * 2.6, 0.18, 1); }
      o.push({ x: x, y: y * 0.92 - 0.05 });
    }
    return o;
  }
  function bulbPts(n) {
    n = n || 72;
    var o = circlePts(n), i;
    for (i = 0; i < o.length; i++) {
      if (o[i].y > 0.35) {
        var f = clamp(1 - (o[i].y - 0.35) * 1.9, 0.34, 1);
        o[i] = { x: o[i].x * f, y: o[i].y };
      }
    }
    return o;
  }

  var MOTIFS = {
    sun: { label: 'Sun', pts: function () { return starPts(12, 1, 0.74, 72); } },
    moon: { label: 'Moon', pts: moonPts },
    mountain: { label: 'Mountain', pts: function () { return polyPts([[-1, 1], [-0.62, 0.05], [-0.3, 0.42], [0.05, -0.78], [0.42, 0.1], [0.66, -0.24], [1, 1]]); } },
    tree: { label: 'Tree', pts: treePts },
    city: { label: 'City', pts: function () { return polyPts([[-1, 1], [-1, -0.12], [-0.7, -0.12], [-0.7, -0.62], [-0.38, -0.62], [-0.38, 0.12], [-0.08, 0.12], [-0.08, -0.88], [0.22, -0.88], [0.22, -0.28], [0.54, -0.28], [0.54, -0.56], [0.84, -0.56], [0.84, 0.3], [1, 0.3], [1, 1]]); } },
    wave: {
      label: 'Waves', pts: function () {
        var o = [], i, n = 30;
        for (i = 0; i <= n; i++) { var x = -1 + i / n * 2; o.push({ x: x, y: -0.34 + 0.30 * Math.sin((x + 1) * Math.PI * 1.6) }); }
        for (i = n; i >= 0; i--) { var x2 = -1 + i / n * 2; o.push({ x: x2, y: 0.42 + 0.30 * Math.sin((x2 + 1) * Math.PI * 1.6) }); }
        return o;
      }
    },
    cloud: { label: 'Cloud', pts: function () { return blobPts(64, 5, 0.16, 0.72).map(function (p) { return { x: p.x, y: p.y * 0.78 }; }); } },
    star: { label: 'Star', pts: function () { return starPts(5, 1, 0.42, 72); } },
    rocket: { label: 'Rocket', pts: function () { return polyPts([[0, -1], [0.27, -0.34], [0.29, 0.36], [0.62, 0.62], [0.58, 0.96], [0.18, 0.72], [-0.18, 0.72], [-0.58, 0.96], [-0.62, 0.62], [-0.29, 0.36], [-0.27, -0.34]]); } },
    bulb: { label: 'Idea', pts: bulbPts },
    heart: { label: 'Heart', pts: heartPts },
    book: { label: 'Book', pts: function () { return polyPts([[-1, 0.62], [-1, -0.5], [-0.12, -0.3], [0, -0.26], [0.12, -0.3], [1, -0.5], [1, 0.62], [0.12, 0.4], [0, 0.44], [-0.12, 0.4]]); } },
    planet: { label: 'Planet', pts: function () { return circlePts(64, 0.86); } },
    spiral: {
      label: 'Spiral', pts: function () {
        var o = [], i, n = 80;
        for (i = 0; i < n; i++) {
          var a = i / n * TAU * 2.4;
          var r = 0.12 + (i / n) * 0.9;
          o.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
        }
        for (i = n - 1; i >= 0; i--) {
          var a2 = i / n * TAU * 2.4, r2 = 0.12 + (i / n) * 0.9;
          o.push({ x: Math.cos(a2) * (r2 - 0.11), y: Math.sin(a2) * (r2 - 0.11) });
        }
        return o;
      }
    }
  };
  var MOTIF_LIST = Object.keys(MOTIFS);

  function signedArea(p) {
    var s = 0, i;
    for (i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length]; s += a.x * b.y - b.x * a.y; }
    return s / 2;
  }
  function resample(pts, n) {
    var N = pts.length, cum = [0], total = 0, i;
    for (i = 0; i < N; i++) {
      var a = pts[i], b = pts[(i + 1) % N];
      total += Math.hypot(b.x - a.x, b.y - a.y);
      cum.push(total);
    }
    if (total < 1e-6) { total = 1; cum = cum.map(function (_, k) { return k; }); }
    var out = [], j = 0;
    for (var k = 0; k < n; k++) {
      var target = total * k / n;
      while (j < N - 1 && cum[j + 1] < target) j++;
      var segLen = (cum[j + 1] - cum[j]) || 1e-6;
      var t = (target - cum[j]) / segLen;
      var p0 = pts[j], p1 = pts[(j + 1) % N];
      out.push({ x: lerp(p0.x, p1.x, t), y: lerp(p0.y, p1.y, t) });
    }
    return out;
  }
  function normalizePts(pts, n) {
    var p = pts.slice();
    if (signedArea(p) < 0) p.reverse();
    p = resample(p, n || 96);
    var best = 0, bestY = Infinity, i;
    for (i = 0; i < p.length; i++) { if (p[i].y < bestY - 1e-9) { bestY = p[i].y; best = i; } }
    return p.slice(best).concat(p.slice(0, best));
  }
  var MOTIF_CACHE = {};
  function motifPoints(name, n) {
    n = n || 96;
    var key = name + '|' + n;
    if (!MOTIF_CACHE[key]) {
      var m = MOTIFS[name] || MOTIFS.sun;
      MOTIF_CACHE[key] = normalizePts(m.pts(), n);
    }
    return MOTIF_CACHE[key];
  }
  function morphPoints(a, b, t) {
    var A = motifPoints(a), B = motifPoints(b), o = [], i;
    for (i = 0; i < A.length; i++) o.push({ x: lerp(A[i].x, B[i].x, t), y: lerp(A[i].y, B[i].y, t) });
    return o;
  }

  /* ------------------------------------------------------------
     BACKGROUNDS
     ------------------------------------------------------------ */
  function drawBG(g, sc, t, st) {
    var p = st.pal, i;
    switch (st.id) {
      case 'pixel': {
        var gr = g.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, p.bg2); gr.addColorStop(1, p.bg);
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        var r = seeded(11);
        g.fillStyle = p.ink;
        for (i = 0; i < 34; i++) {
          var x = Math.round(r() * W / 16) * 16, y = Math.round(r() * H * 0.55 / 16) * 16;
          g.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(t * 1.6 + i));
          g.fillRect(x, y, 8, 8);
        }
        g.globalAlpha = 1;
        g.fillStyle = p.dim; g.fillRect(0, H * 0.84, W, H * 0.16);
        g.fillStyle = 'rgba(255,255,255,.06)';
        for (i = 0; i < 26; i++) g.fillRect(i * 80, H * 0.84, 40, 8);
        break;
      }
      case 'stick': {
        g.fillStyle = p.bg; g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(25,27,33,.07)'; g.lineWidth = 2;
        for (i = 1; i < 14; i++) { g.beginPath(); g.moveTo(0, i * 78); g.lineTo(W, i * 78 + 6); g.stroke(); }
        g.strokeStyle = 'rgba(25,27,33,.12)'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(90, 0); g.lineTo(90, H); g.stroke();
        break;
      }
      case 'neon': {
        g.fillStyle = p.bg; g.fillRect(0, 0, W, H);
        var rg = g.createRadialGradient(W * 0.72, H * 0.45, 20, W * 0.72, H * 0.45, 700);
        rg.addColorStop(0, 'rgba(120,60,220,.34)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = rg; g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(120,90,255,.30)'; g.lineWidth = 2;
        for (i = 0; i < 12; i++) {
          var yy = H * 0.62 + Math.pow(i / 11, 2) * H * 0.45;
          g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy); g.stroke();
        }
        for (i = -10; i <= 10; i++) {
          g.beginPath(); g.moveTo(W / 2 + i * 60, H * 0.62); g.lineTo(W / 2 + i * 320, H); g.stroke();
        }
        break;
      }
      case 'paper': {
        g.fillStyle = p.bg; g.fillRect(0, 0, W, H);
        g.fillStyle = p.bg2;
        g.beginPath(); g.arc(W * 0.78, H * 0.2, 420, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,255,255,.35)';
        g.beginPath(); g.moveTo(0, H * 0.86); g.quadraticCurveTo(W * 0.5, H * 0.76, W, H * 0.9); g.lineTo(W, H); g.lineTo(0, H); g.fill();
        var rr = seeded(5);
        g.fillStyle = 'rgba(120,90,60,.055)';
        for (i = 0; i < 300; i++) g.fillRect(rr() * W, rr() * H, 2, 2);
        break;
      }
      case 'cosmic': {
        var cg = g.createRadialGradient(W * 0.3, H * 0.25, 40, W * 0.4, H * 0.5, 1200);
        cg.addColorStop(0, p.bg2); cg.addColorStop(0.55, '#0c0a24'); cg.addColorStop(1, p.bg);
        g.fillStyle = cg; g.fillRect(0, 0, W, H);
        var cr = seeded(23);
        for (i = 0; i < 130; i++) {
          var sx = cr() * W, sy = cr() * H, sr = cr() * 1.8 + 0.4;
          g.globalAlpha = 0.25 + 0.65 * Math.abs(Math.sin(t * 0.9 + i * 0.7));
          g.fillStyle = '#fff';
          g.beginPath(); g.arc(sx, sy, sr, 0, TAU); g.fill();
        }
        g.globalAlpha = 1;
        break;
      }
      case 'vhs': {
        var vg = g.createLinearGradient(0, 0, 0, H * 0.75);
        vg.addColorStop(0, '#1a0140'); vg.addColorStop(0.55, '#7a1266'); vg.addColorStop(1, '#ff7a3d');
        g.fillStyle = vg; g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(255,220,120,.55)';
        g.beginPath(); g.arc(W / 2, H * 0.6, 200, 0, TAU); g.fill();
        g.fillStyle = p.bg; g.fillRect(0, H * 0.72, W, H * 0.28);
        g.strokeStyle = 'rgba(0,229,255,.55)'; g.lineWidth = 2;
        for (i = 0; i < 10; i++) {
          var y2 = H * 0.72 + Math.pow(i / 9, 2) * H * 0.28;
          g.beginPath(); g.moveTo(0, y2); g.lineTo(W, y2); g.stroke();
        }
        for (i = -8; i <= 8; i++) {
          g.beginPath(); g.moveTo(W / 2 + i * 40, H * 0.72); g.lineTo(W / 2 + i * 210, H); g.stroke();
        }
        break;
      }
    }
  }

  /* ------------------------------------------------------------
     MOTIF PAINTING
     ------------------------------------------------------------ */
  function pathFrom(pts, cx, cy, r, rot) {
    var path = new Path2D(), ca = Math.cos(rot || 0), sa = Math.sin(rot || 0), i;
    for (i = 0; i < pts.length; i++) {
      var x = pts[i].x * r, y = pts[i].y * r;
      var px = cx + (x * ca - y * sa), py = cy + (x * sa + y * ca);
      if (i === 0) path.moveTo(px, py); else path.lineTo(px, py);
    }
    path.closePath();
    return path;
  }

  function paintMotif(g, pts, cx, cy, r, rot, st, accent, opts) {
    opts = opts || {};
    var p = st.pal, path = pathFrom(pts, cx, cy, r, rot), i;
    g.save();
    if (opts.alpha != null) g.globalAlpha = opts.alpha;
    switch (st.id) {
      case 'pixel': {
        g.fillStyle = accent; g.fill(path);
        g.fillStyle = 'rgba(255,255,255,.28)';
        g.fill(pathFrom(pts.map(function (q) { return { x: q.x * 0.9 - 0.06, y: q.y * 0.9 - 0.06 }; }), cx, cy, r, rot));
        break;
      }
      case 'stick': {
        var wob = pts.map(function (q) {
          return { x: q.x + Math.sin(q.y * 7 + (opts.phase || 0)) * 0.012, y: q.y + Math.cos(q.x * 7 + (opts.phase || 0)) * 0.012 };
        });
        g.lineJoin = 'round'; g.lineCap = 'round';
        g.strokeStyle = p.ink; g.lineWidth = 8; g.stroke(pathFrom(wob, cx, cy, r, rot));
        g.strokeStyle = accent; g.lineWidth = 8; g.setLineDash([26, 22]); g.lineDashOffset = -(opts.phase || 0) * 12;
        g.stroke(pathFrom(wob, cx, cy, r, rot)); g.setLineDash([]);
        break;
      }
      case 'neon': {
        g.shadowColor = accent; g.shadowBlur = st.glow;
        g.strokeStyle = accent; g.lineWidth = 8; g.stroke(path);
        g.strokeStyle = accent; g.lineWidth = 8; g.stroke(path);
        g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,.92)'; g.lineWidth = 2.4; g.stroke(path);
        break;
      }
      case 'paper': {
        g.shadowColor = 'rgba(70,45,20,.30)'; g.shadowBlur = 22; g.shadowOffsetY = 14;
        g.fillStyle = accent; g.fill(path);
        g.shadowColor = 'transparent';
        g.fillStyle = 'rgba(255,255,255,.18)';
        g.fill(pathFrom(pts.map(function (q) { return { x: q.x * 0.82, y: q.y * 0.82 }; }), cx, cy, r, rot));
        break;
      }
      case 'cosmic': {
        var gr = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        gr.addColorStop(0, accent); gr.addColorStop(1, 'rgba(255,255,255,.10)');
        g.shadowColor = accent; g.shadowBlur = 40;
        g.fillStyle = gr; g.fill(path);
        g.shadowBlur = 0;
        g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.stroke(path);
        break;
      }
      case 'vhs': {
        g.fillStyle = 'rgba(0,229,255,.85)';
        g.fill(pathFrom(pts, cx + 7, cy, r, rot));
        g.fillStyle = 'rgba(255,46,136,.85)';
        g.fill(pathFrom(pts, cx - 7, cy, r, rot));
        g.fillStyle = accent; g.fill(path);
        break;
      }
    }
    g.restore();
  }

  function motifDetail(g, name, cx, cy, r, st, accent, t) {
    var p = st.pal;
    g.save();
    g.strokeStyle = st.id === 'neon' ? accent : p.ink;
    g.fillStyle = st.id === 'neon' ? accent : p.ink;
    g.lineWidth = st.id === 'pixel' ? 8 : 4;
    g.globalAlpha = 0.85;
    if (name === 'planet') {
      g.save(); g.translate(cx, cy); g.rotate(-0.28);
      g.beginPath(); g.ellipse(0, 0, r * 1.5, r * 0.34, 0, 0, TAU); g.stroke();
      g.restore();
    } else if (name === 'sun' || name === 'star') {
      g.globalAlpha = 0.5;
      for (var i = 0; i < 5; i++) {
        var a = t * 0.6 + i * 1.257;
        g.beginPath(); g.arc(cx + Math.cos(a) * r * 1.35, cy + Math.sin(a) * r * 1.35, r * 0.03 + 3, 0, TAU); g.fill();
      }
    } else if (name === 'city') {
      g.globalAlpha = 0.55;
      for (var j = 0; j < 12; j++) {
        var wx = cx + ((j % 4) - 1.5) * r * 0.36, wy = cy - r * 0.1 + Math.floor(j / 4) * r * 0.28;
        g.fillRect(wx, wy, r * 0.12, r * 0.12);
      }
    } else if (name === 'rocket') {
      g.globalAlpha = 0.7;
      var fl = 0.7 + 0.3 * Math.sin(t * 12);
      g.beginPath();
      g.moveTo(cx - r * 0.18, cy + r * 0.72);
      g.lineTo(cx, cy + r * (0.72 + 0.5 * fl));
      g.lineTo(cx + r * 0.18, cy + r * 0.72);
      g.closePath(); g.fill();
    } else if (name === 'book') {
      g.globalAlpha = 0.5;
      g.beginPath(); g.moveTo(cx, cy - r * 0.24); g.lineTo(cx, cy + r * 0.4); g.stroke();
    } else if (name === 'tree') {
      g.globalAlpha = 0.9;
      g.fillRect(cx - r * 0.09, cy + r * 0.5, r * 0.18, r * 0.45);
    }
    g.restore();
  }

  /* ------------------------------------------------------------
     SCENE
     ------------------------------------------------------------ */
  function drawWorld(g, sc, t, st, accent) {
    var p = st.pal, i;
    var center = sc.layout === 'center';
    var cx = center ? W / 2 : 1390;
    var cy = center ? 520 : 560;
    var baseR = center ? 400 : 300;

    var ent = enterEase(sc, t);
    var r = baseR * (0.55 + 0.45 * ent);
    var bob = Math.sin(t * 1.1) * (center ? 10 : 14);
    var rot = Math.sin(t * 0.35) * 0.06 + (sc.spin ? t * 0.25 : 0);

    // ambient small shapes
    var seed = hashStr(sc.title + sc.motif);
    var rr = seeded(seed);
    for (i = 0; i < 4; i++) {
      var ax = 120 + rr() * (W - 240), ay = 120 + rr() * (H - 300);
      var ar = 22 + rr() * 34, asp = 0.3 + rr() * 0.7;
      var drift = Math.sin(t * asp + i * 2) * 46;
      g.save(); g.globalAlpha = center ? 0.16 : 0.28;
      paintMotif(g, motifPoints(['cloud', 'star', 'heart', 'planet'][i % 4]), ax + drift, ay + Math.cos(t * asp) * 26, ar, t * 0.2, st, p.a[(i + 1) % p.a.length]);
      g.restore();
    }

    paintMotif(g, motifPoints(sc.motif), cx, cy + bob, r, rot, st, accent, { alpha: center ? 0.22 : 1, phase: t });
    if (!center) motifDetail(g, sc.motif, cx, cy + bob, r, st, accent, t);

    // stick-style actor walking
    if (st.id === 'stick') drawStickActor(g, t, sc, st);
    if (st.id === 'pixel') {
      g.fillStyle = 'rgba(255,255,255,.10)';
      for (i = 0; i < 8; i++) g.fillRect(140 + i * 30, H * 0.84 - 8 - (i % 3) * 8, 16, 8 + (i % 3) * 8);
    }
  }

  function drawStickActor(g, t, sc, st) {
    var x = 260 + ((t * 60) % 260), y = H - 190;
    var sw = Math.sin(t * 6) * 22;
    g.save();
    g.strokeStyle = st.pal.ink; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.arc(x, y - 150, 26, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(x, y - 122); g.lineTo(x, y - 52); g.stroke();
    g.beginPath(); g.moveTo(x, y - 100); g.lineTo(x - 34, y - 62 + sw * 0.5); g.stroke();
    g.beginPath(); g.moveTo(x, y - 100); g.lineTo(x + 34, y - 62 - sw * 0.5); g.stroke();
    g.beginPath(); g.moveTo(x, y - 52); g.lineTo(x - 26 - sw * 0.4, y + 10); g.stroke();
    g.beginPath(); g.moveTo(x, y - 52); g.lineTo(x + 26 + sw * 0.4, y + 10); g.stroke();
    g.restore();
  }

  function wrapText(g, text, maxW) {
    var words = String(text || '').split(/\s+/).filter(Boolean), lines = [], cur = '', i;
    for (i = 0; i < words.length; i++) {
      var test = cur ? cur + ' ' + words[i] : words[i];
      if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = words[i]; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function setFont(g, st, kind, size) {
    var f = st.font;
    g.font = (kind === 'd' ? f.dw : f.bw) + ' ' + Math.round(size) + 'px ' + (kind === 'd' ? f.d : f.b);
    if ('letterSpacing' in g) g.letterSpacing = ((kind === 'd' ? f.sp : Math.max(0, f.sp - 1)) || 0) + 'px';
  }

  function drawSceneText(g, sc, t, st, accent, alpha) {
    var p = st.pal, i;
    var center = sc.layout === 'center';
    var left = center ? 0 : 130;
    var maxW = center ? 1360 : 820;
    var align = center ? 'center' : 'left';
    var tx = center ? W / 2 : left;

    var title = String(sc.title || '').trim();
    var body = String(sc.body || '').trim();

    var en = (EASES[sc.ease || 'back'] || EASES.back)(clamp((t - 0.04) / 0.85, 0, 1));
    var ax = center ? W / 2 : left + 380;
    var ay = center ? H * 0.5 : 370;
    var fx = { dx: 0, dy: 0, sx: 1, sy: 1, blur: 0 };
    switch (sc.enter || 'rise') {
      case 'fade': break;
      case 'zoom': fx.sx = fx.sy = lerp(1.18, 1, en); break;
      case 'slide': fx.dx = (1 - en) * 150; break;
      case 'slideR': fx.dx = -(1 - en) * 150; break;
      case 'drop': fx.dy = -(1 - en) * 120; break;
      case 'flip': fx.sy = Math.max(0.02, en); break;
      case 'blur': fx.blur = (1 - en) * 16; break;
      case 'pop': fx.sx = fx.sy = lerp(0.62, 1, en); break;
      case 'none': break;
      default: fx.dy = (1 - en) * 52;
    }
    var dy = 0;

    g.save();
    g.translate(ax, ay); g.scale(fx.sx, fx.sy); g.translate(-ax, -ay);
    g.translate(fx.dx, fx.dy);
    if (fx.blur > 0.3) { try { g.filter = 'blur(' + fx.blur.toFixed(1) + 'px)'; } catch (e) { } }
    g.globalAlpha = alpha * clamp(en * 1.6, 0, 1);
    g.textAlign = align;
    g.textBaseline = 'alphabetic';

    // ---- title: shrink to fit 2 lines
    var size = center ? 118 : 96, lines = [];
    for (var guard = 0; guard < 14; guard++) {
      setFont(g, st, 'd', size);
      lines = wrapText(g, title, maxW);
      if (lines.length <= 2 || size <= 46) break;
      size -= 6;
    }
    var lh = size * 1.08;
    var ty = center ? 470 : 330;
    if (center) ty -= (lines.length - 1) * lh / 2;

    for (i = 0; i < lines.length; i++) {
      var y = ty + i * lh + dy;
      if (st.id === 'neon') {
        g.shadowColor = accent; g.shadowBlur = 26;
        g.fillStyle = p.ink; g.fillText(lines[i], tx, y);
        g.shadowBlur = 0;
        g.fillStyle = p.ink; g.fillText(lines[i], tx, y);
      } else if (st.id === 'vhs') {
        g.fillStyle = 'rgba(0,229,255,.55)'; g.fillText(lines[i], tx + 3, y);
        g.fillStyle = 'rgba(255,46,136,.55)'; g.fillText(lines[i], tx - 3, y);
        g.fillStyle = p.ink; g.fillText(lines[i], tx, y);
      } else if (st.id === 'paper') {
        g.fillStyle = 'rgba(70,45,20,.18)'; g.fillText(lines[i], tx + 4, y + 5);
        g.fillStyle = p.ink; g.fillText(lines[i], tx, y);
      } else {
        g.fillStyle = p.ink; g.fillText(lines[i], tx, y);
      }
      // accent underline
      if (i === lines.length - 1 && !center) {
        var uw = Math.min(g.measureText(lines[i]).width, 320) * en;
        g.fillStyle = accent;
        g.fillRect(tx, y + 22, uw, st.id === 'pixel' ? 10 : 6);
      }
    }

    // ---- body: word-by-word reveal
    if (body) {
      var bsize = center ? 40 : 38;
      setFont(g, st, 'b', bsize);
      var blines = wrapText(g, body, center ? 1180 : 780);
      if (blines.length > 5) blines = blines.slice(0, 5);
      var words = [];
      blines.forEach(function (ln, li) {
        ln.split(' ').forEach(function (wd) { words.push({ w: wd, line: li }); });
      });
      var start = center ? 0.55 : 0.62;
      var shown = Math.floor(clamp((t - start) / 0.09, 0, 999));
      var by = (center ? ty + (lines.length - 1) * lh + 128 : ty + (lines.length - 1) * lh + 142);
      var blh = bsize * 1.55;
      var wi = 0;
      for (var li2 = 0; li2 < blines.length; li2++) {
        var text = blines[li2].split(' ');
        var acc = '';
        for (var k = 0; k < text.length; k++) {
          if (wi < shown) { acc += (k ? ' ' : '') + text[k]; wi++; }
          else { wi++; }
        }
        if (acc) {
          g.globalAlpha = alpha * 0.92;
          g.fillStyle = st.id === 'neon' ? 'rgba(234,246,255,.88)' : (st.id === 'pixel' ? p.ink : 'rgba(30,30,40,.86)');
          if (st.id === 'neon' || st.id === 'cosmic' || st.id === 'vhs') g.fillStyle = 'rgba(240,244,255,.86)';
          g.fillText(acc, tx, by + li2 * blh);
        }
      }
    }
    g.restore();
    if ('letterSpacing' in g) g.letterSpacing = '0px';
  }

  function drawPost(g, t, st, sc) {
    var i;
    if (st.id === 'neon' || st.id === 'vhs') {
      g.save(); g.globalAlpha = st.id === 'vhs' ? 0.20 : 0.10; g.fillStyle = '#000';
      for (i = 0; i < H; i += 4) g.fillRect(0, i, W, 2);
      g.restore();
      if (st.id === 'vhs') {
        g.save(); g.globalAlpha = 0.06; g.fillStyle = '#fff';
        for (i = 0; i < 4; i++) g.fillRect(0, (t * 220 + i * 260) % H, W, 3);
        g.restore();
      }
    }
    if (st.id === 'cosmic') {
      var vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
    }
    if (st.id === 'paper' || st.id === 'stick') {
      var vg2 = g.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H);
      vg2.addColorStop(0, 'rgba(0,0,0,0)'); vg2.addColorStop(1, 'rgba(60,40,20,.16)');
      g.fillStyle = vg2; g.fillRect(0, 0, W, H);
    }
  }

  function renderScene(g, sc, t, st) {
    var accent = sc.accent || st.pal.a[0];
    var cam = cameraFor(sc, t, st);
    g.save();
    if (cam.z !== 1 || cam.x || cam.y) {
      g.translate(W / 2 + cam.x, H / 2 + cam.y);
      g.scale(cam.z, cam.z);
      g.translate(-W / 2, -H / 2);
    }
    drawBG(g, sc, t, st);
    drawWorld(g, sc, t, st, accent);
    drawSceneText(g, sc, t, st, accent, 1);
    g.restore();
    drawPost(g, t, st, sc);
  }

  /* ------------------------------------------------------------
     TRANSITIONS
     ------------------------------------------------------------ */
  function morphScene(g, sa, sb, p, st) {
    var e = easeInOut(p);
    var accentA = sa.accent || st.pal.a[0];
    var accentB = sb.accent || st.pal.a[0];
    drawBG(g, sb, 0, st);
    var ca = sa.layout === 'center', cb = sb.layout === 'center';
    var ax = ca ? W / 2 : 1390, bx = cb ? W / 2 : 1390;
    var ay = ca ? 520 : 560, by = cb ? 520 : 560;
    var ar = ca ? 400 : 300, br = cb ? 400 : 300;
    var pts = morphPoints(sa.motif, sb.motif, e);
    var cx = lerp(ax, bx, e), cy = lerp(ay, by, e), r = lerp(ar, br, e);
    var accent = e < 0.5 ? accentA : accentB;
    paintMotif(g, pts, cx, cy + Math.sin(cy) * 0, r, lerp(0, 0.5, e), st, accent, { alpha: ca || cb ? 0.9 : 1, phase: p * 4 });
    drawSceneText(g, sa, 99, st, accentA, clamp(1 - e * 2.1, 0, 1));
    drawSceneText(g, sb, 99, st, accentB, clamp((p - 0.42) * 2.6, 0, 1));
    drawPost(g, 0, st, sb);
  }

  var BUF = {};
  function getBuf(st, slot) {
    var key = st.id + '|' + slot;
    if (!BUF[key]) {
      var c = document.createElement('canvas');
      c.width = st.res[0]; c.height = st.res[1];
      BUF[key] = c;
    }
    return BUF[key];
  }
  function renderInto(buf, sc, t, st) {
    var g = buf.getContext('2d');
    var s = buf.width / W;
    g.setTransform(s, 0, 0, s, 0, 0);
    g.clearRect(0, 0, W, H);
    g.save();
    renderScene(g, sc, t, st);
    g.restore();
  }

  /* draw a frame of the show onto the visible canvas */
  function drawFrame(vis, proj, time) {
    var st = STYLES[proj.style] || STYLES.neon;
    var scenes = proj.scenes || [];
    var g = vis.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, vis.width, vis.height);
    g.imageSmoothingEnabled = !!st.smooth;

    if (!scenes.length) return;

    // locate scene
    var acc = 0, idx = 0, local = 0;
    for (var i = 0; i < scenes.length; i++) {
      var d = Math.max(0.8, scenes[i].dur || 5);
      if (time < acc + d || i === scenes.length - 1) { idx = i; local = clamp(time - acc, 0, d); break; }
      acc += d;
    }
    var sc = scenes[idx], next = scenes[idx + 1];
    var mode = sc.transition || proj.transition || 'morph';
    var trDur = Math.min(0.9, (sc.dur || 5) * 0.45);
    var inTrans = next && mode !== 'none' && local > (sc.dur || 5) - trDur;

    if (inTrans) {
      var p = clamp((local - ((sc.dur || 5) - trDur)) / trDur, 0, 1);
      if (mode === 'morph') {
        var b = getBuf(st, 'A');
        var gg = b.getContext('2d'), s = b.width / W;
        gg.setTransform(s, 0, 0, s, 0, 0);
        gg.clearRect(0, 0, W, H);
        gg.save(); morphScene(gg, sc, next, p, st); gg.restore();
        g.drawImage(b, 0, 0, vis.width, vis.height);
        return;
      }
      var bA = getBuf(st, 'A'), bB = getBuf(st, 'B');
      renderInto(bA, sc, local, st);
      renderInto(bB, next, Math.max(0, local - ((sc.dur || 5) - trDur)), st);
      present(g, bA, bB, mode, p, vis);
      return;
    }

    var buf = getBuf(st, 'A');
    renderInto(buf, sc, local, st);
    g.drawImage(buf, 0, 0, vis.width, vis.height);
  }

  function present(g, bA, bB, mode, p, vis) {
    var e = easeInOut(p), i;
    g.save();
    if (mode === 'fade') {
      g.globalAlpha = 1; g.drawImage(bA, 0, 0, vis.width, vis.height);
      g.globalAlpha = e; g.drawImage(bB, 0, 0, vis.width, vis.height);
    } else if (mode === 'slide') {
      g.drawImage(bA, -e * vis.width, 0, vis.width, vis.height);
      g.drawImage(bB, (1 - e) * vis.width, 0, vis.width, vis.height);
    } else if (mode === 'wipe') {
      g.drawImage(bA, 0, 0, vis.width, vis.height);
      g.save();
      g.beginPath(); g.rect(0, 0, vis.width * e, vis.height); g.clip();
      g.drawImage(bB, 0, 0, vis.width, vis.height);
      g.restore();
    } else if (mode === 'iris') {
      g.drawImage(bA, 0, 0, vis.width, vis.height);
      g.save();
      g.beginPath();
      g.arc(vis.width / 2, vis.height / 2, e * vis.width * 0.78, 0, TAU);
      g.clip();
      g.drawImage(bB, 0, 0, vis.width, vis.height);
      g.restore();
    } else if (mode === 'glitch') {
      var sliceH = vis.height / 14;
      for (i = 0; i < 14; i++) {
        var off = (Math.sin(i * 3.7 + p * 9) * 0.5 + 0.5) * (p < 0.5 ? p : 1 - p) * vis.width * 0.22;
        var src = p > 0.5 ? bB : bA;
        g.drawImage(src, 0, i * (src.height / 14), src.width, src.height / 14, off - vis.width * 0.05, i * sliceH, vis.width * 1.1, sliceH + 1);
      }
      g.globalAlpha = Math.abs(p - 0.5) * 2;
      g.drawImage(p > 0.5 ? bA : bB, 0, 0, vis.width, vis.height);
    } else {
      g.globalAlpha = 1 - e; g.drawImage(bA, 0, 0, vis.width, vis.height);
      g.globalAlpha = e; g.drawImage(bB, 0, 0, vis.width, vis.height);
    }
    g.restore();
  }

  window.MS = {
    W: W, H: H, STYLES: STYLES, STYLE_LIST: STYLE_LIST,
    MOTIFS: MOTIFS, MOTIF_LIST: MOTIF_LIST,
    motifPoints: motifPoints, morphPoints: morphPoints,
    renderScene: renderScene, renderInto: renderInto, drawFrame: drawFrame,
    EASES: EASES, ENTERS: ENTERS, CAMS: CAMS,
    contrastRatio: contrastRatio, ensureContrast: ensureContrast, rgbToHsl: rgbToHsl, hslToRgb: hslToRgb,
    getBuf: getBuf, clamp: clamp, lerp: lerp, easeOut: easeOut, easeInOut: easeInOut,
    hashStr: hashStr, seeded: seeded, wrapText: wrapText, setFont: setFont
  };
})();
