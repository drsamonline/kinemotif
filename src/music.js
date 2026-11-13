/* ============================================================
   Motion Studio — procedural music engine (Web Audio)
   Every show carries a seed. The seed decides the key, the tempo,
   the progression, the patterns, the instruments and the melody,
   so two shows never share a soundtrack — and the same show always
   sounds the same, which matters once it is exported.

   Pattern-array approach borrowed from retro-strike's chiptune loop;
   the continuous beat phase is borrowed from dance-fight.
   ============================================================ */
(function () {
  'use strict';

  var MOODS = {
    uplifting: {
      label: 'Uplifting', bpm: 116, root: 57, scale: [0, 2, 4, 7, 9], pad: 0.55, arp: 1, swing: 0,
      progs: [[0, 2, 4], [3, 5, 7], [4, 6, 1], [3, 5, 0], [0, 2, 5], [2, 4, 6], [5, 0, 2], [1, 3, 5]],
      drums: ['four', 'four', 'big']
    },
    calm: {
      label: 'Calm', bpm: 74, root: 53, scale: [0, 2, 4, 7, 9], pad: 0.75, arp: 0.7, swing: 0,
      progs: [[0, 2, 4], [3, 5, 0], [1, 3, 5], [4, 6, 1], [0, 4, 2], [2, 5, 0]],
      drums: ['none', 'soft']
    },
    epic: {
      label: 'Epic', bpm: 96, root: 50, scale: [0, 2, 3, 5, 7, 8, 10], pad: 0.6, arp: 1, swing: 0,
      progs: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [4, 6, 1], [0, 3, 5], [2, 4, 6], [4, 0, 2]],
      drums: ['big', 'big', 'four']
    },
    playful: {
      label: 'Playful', bpm: 132, root: 60, scale: [0, 2, 4, 7, 9], pad: 0.4, arp: 1.2, swing: 0.1,
      progs: [[0, 2, 4], [4, 6, 1], [3, 5, 0], [4, 6, 3], [5, 0, 2], [2, 4, 0], [1, 3, 5]],
      drums: ['four', 'four', 'soft']
    },
    tense: {
      label: 'Tense', bpm: 104, root: 45, scale: [0, 1, 4, 5, 7, 8], pad: 0.7, arp: 0.6, swing: 0,
      progs: [[0, 2, 4], [0, 3, 5], [1, 3, 5], [0, 2, 4], [2, 4, 0], [3, 5, 1]],
      drums: ['sparse', 'big']
    },
    lofi: {
      label: 'Lo-fi', bpm: 84, root: 55, scale: [0, 2, 3, 5, 7, 9, 10], pad: 0.6, arp: 0.9, swing: 0.16,
      progs: [[0, 2, 4], [3, 5, 0], [5, 0, 2], [3, 5, 0], [1, 4, 6], [4, 6, 1], [2, 4, 0]],
      drums: ['soft', 'soft', 'sparse']
    },
    none: { label: 'Silent', bpm: 0, root: 57, scale: [0, 2, 4, 7, 9], pad: 0, arp: 0, swing: 0, progs: [[0, 2, 4]], drums: ['none'] }
  };
  var MOOD_LIST = ['uplifting', 'calm', 'epic', 'playful', 'tense', 'lofi', 'none'];

  var A = {
    ctx: null, master: null, rev: null, revGain: null, ana: null, noise: null,
    mood: 'uplifting', muted: false, volume: 0.55,
    playing: false, step: 0, nextTime: 0, timer: null,
    seed: 1, plan: null, startedAt: 0
  };

  /* ---- deterministic RNG ---------------------------------------------- */
  function mulberry(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(str) {
    var h = 2166136261, i;
    str = String(str || '');
    for (i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function pick(rng, list) { return list[Math.floor(rng() * list.length) % list.length]; }
  function pickInt(rng, lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); }

  /* ---- the plan: everything the seed decides --------------------------- */
  function buildPlan(seed, moodId) {
    var mood = MOODS[moodId] || MOODS.uplifting;
    var rng = mulberry(seed ^ hashString(moodId));

    /* the pool holds chords; a progression is four of them, walked so the
       changes feel related instead of random */
    function makeProgression(r) {
      var prog = [], idx = pickInt(r, 0, mood.progs.length - 1);
      for (var i = 0; i < 4; i++) {
        prog.push(mood.progs[idx]);
        idx = (idx + pickInt(r, 1, 2)) % mood.progs.length;
      }
      return prog;
    }
    var progression = makeProgression(rng);
    var progressionB = makeProgression(rng);

    var drumStyle = pick(rng, mood.drums);
    var arpShapes = [
      [0, 1, 2, 1, 2, 0, 1, 2],
      [0, 2, 1, 2, 0, 1, 2, 1],
      [2, 1, 0, 1, 2, 0, 1, 0],
      [0, 1, 2, 0, 2, 1, 0, 2],
      [1, 2, 0, 2, 1, 0, 2, 1]
    ];
    var arpShape = pick(rng, arpShapes);
    var arpShapeB = pick(rng, arpShapes);

    /* a melody: scale degrees walked with a bias toward small steps */
    var melody = [];
    var deg = pickInt(rng, 2, 5);
    for (var bar = 0; bar < 8; bar++) {
      var notes = pickInt(rng, 2, 4);
      for (var n = 0; n < notes; n++) {
        deg += pick(rng, [-2, -1, -1, 1, 1, 2, 0]);
        deg = Math.max(0, Math.min(9, deg));
        melody.push({ bar: bar, step: pickInt(rng, 0, 15), deg: deg, len: pick(rng, [2, 3, 4]) });
      }
    }

    return {
      mood: moodId,
      seed: seed,
      root: mood.root + pick(rng, [0, 0, 0, 2, -3, 5]),
      bpm: Math.round(mood.bpm * (0.94 + rng() * 0.12)),
      swing: mood.swing * (0.6 + rng() * 0.8),
      scale: mood.scale,
      padLevel: mood.pad,
      arpLevel: mood.arp * (0.7 + rng() * 0.6),
      drums: drumStyle,
      progression: progression,
      progressionB: progressionB,
      arpShape: arpShape,
      arpShapeB: arpShapeB,
      bassShape: pick(rng, [[0, 6, 8, 14], [0, 4, 8, 12], [0, 7, 10, 14], [0, 6, 10, 12]]),
      melody: melody,
      voices: {
        pad: true,
        bass: true,
        arp: true,
        melody: rng() > 0.25,
        drums: drumStyle !== 'none'
      },
      /* one of the two progressions per section, so the middle of a show moves */
      sectionBars: 8
    };
  }

  function midiOf(root, scale, degree) {
    var len = scale.length;
    var oct = Math.floor(degree / len);
    var i = ((degree % len) + len) % len;
    return root + 12 * oct + scale[i];
  }
  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  function makeImpulse(sec, decay) {
    var rate = A.ctx.sampleRate, len = Math.floor(rate * sec);
    var buf = A.ctx.createBuffer(2, len, rate), ch, i;
    for (ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
  function makeNoise() {
    var rate = A.ctx.sampleRate, len = Math.floor(rate * 1.2);
    var buf = A.ctx.createBuffer(1, len, rate), d = buf.getChannelData(0), i;
    for (i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function init() {
    if (A.ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    A.ctx = new AC();
    A.master = A.ctx.createGain();
    A.master.gain.value = A.muted ? 0 : A.volume;
    var comp = A.ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
    A.ana = A.ctx.createAnalyser();
    A.ana.fftSize = 256;
    A.rev = A.ctx.createConvolver();
    A.rev.buffer = makeImpulse(2.4, 2.8);
    A.revGain = A.ctx.createGain();
    A.revGain.gain.value = 0.34;
    A.rev.connect(A.revGain);
    A.revGain.connect(A.master);
    A.master.connect(comp);
    comp.connect(A.ana);
    A.ana.connect(A.ctx.destination);
    A.noise = makeNoise();
    return true;
  }

  function send(node, amt) {
    if (!amt) return;
    var g = A.ctx.createGain();
    g.gain.value = amt;
    node.connect(g); g.connect(A.rev);
  }

  function pad(t, freqs, dur, level) {
    freqs.forEach(function (f, idx) {
      [0, 1].forEach(function (k) {
        var o = A.ctx.createOscillator();
        o.type = k ? 'sawtooth' : 'triangle';
        o.frequency.value = midi(f);
        o.detune.value = (k ? 7 : -6) + idx * 2;
        var f1 = A.ctx.createBiquadFilter();
        f1.type = 'lowpass'; f1.frequency.value = 900 + idx * 120; f1.Q.value = 0.7;
        var g = A.ctx.createGain();
        var peak = 0.034 * (level || 0.5);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + 0.9);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(f1); f1.connect(g); g.connect(A.master);
        send(g, 0.6);
        o.start(t); o.stop(t + dur + 0.1);
      });
    });
  }

  function pluck(t, freq, dur, gain) {
    var o = A.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = midi(freq);
    var f1 = A.ctx.createBiquadFilter();
    f1.type = 'lowpass'; f1.frequency.value = 4200;
    var g = A.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.07, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f1); f1.connect(g); g.connect(A.master);
    send(g, 0.5);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function lead(t, freq, dur, gain) {
    var o = A.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = midi(freq);
    var vib = A.ctx.createOscillator();
    vib.frequency.value = 5.2;
    var vibGain = A.ctx.createGain();
    vibGain.gain.value = 3.5;
    vib.connect(vibGain); vibGain.connect(o.frequency);
    var g = A.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(A.master);
    send(g, 0.7);
    o.start(t); o.stop(t + dur + 0.05);
    vib.start(t); vib.stop(t + dur + 0.05);
  }

  function bass(t, freq, dur) {
    var o = A.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = midi(freq - 12);
    var f1 = A.ctx.createBiquadFilter();
    f1.type = 'lowpass'; f1.frequency.value = 320;
    var g = A.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f1); f1.connect(g); g.connect(A.master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function kick(t) {
    var o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.13);
    g.gain.setValueAtTime(0.42, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(A.master);
    o.start(t); o.stop(t + 0.25);
  }

  function hat(t, lvl) {
    var s = A.ctx.createBufferSource();
    s.buffer = A.noise;
    var f = A.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 8200;
    var g = A.ctx.createGain();
    g.gain.setValueAtTime(lvl, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(f); f.connect(g); g.connect(A.master);
    s.start(t); s.stop(t + 0.08);
  }

  function snare(t, lvl) {
    var s = A.ctx.createBufferSource();
    s.buffer = A.noise;
    var f = A.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.8;
    var g = A.ctx.createGain();
    g.gain.setValueAtTime(lvl || 0.10, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    s.connect(f); f.connect(g); g.connect(A.master);
    send(g, 0.4);
    s.start(t); s.stop(t + 0.2);
  }

  function scheduleStep(step, when) {
    var plan = A.plan;
    if (!plan) return;
    var bar = Math.floor(step / 16);
    var s = step % 16;
    var section = Math.floor(bar / plan.sectionBars);
    var prog = section % 2 === 0 ? plan.progression : plan.progressionB;
    var chordDeg = prog[Math.floor(bar / 2) % prog.length];
    var chord = chordDeg.map(function (d) { return midiOf(plan.root, plan.scale, d); });
    var beat = 60 / plan.bpm;
    var shape = section % 2 === 0 ? plan.arpShape : plan.arpShapeB;

    if (s === 0) pad(when, chord, beat * 8, plan.padLevel);

    if (plan.voices.bass) {
      for (var bi = 0; bi < plan.bassShape.length; bi++) {
        if (plan.bassShape[bi] === s) {
          bass(when, chord[0] + (bi === 3 ? 12 : 0), beat * 0.7);
          break;
        }
      }
    }

    if (plan.voices.arp && s % 2 === 0) {
      var idx = shape[(step / 2) % shape.length];
      pluck(when, chord[idx % chord.length] + 12, beat * 0.9, 0.045 * plan.arpLevel);
    }

    if (plan.voices.melody) {
      for (var m = 0; m < plan.melody.length; m++) {
        var ev = plan.melody[m];
        if (ev.bar % 8 === bar % 8 && ev.step === s) {
          lead(when, midiOf(plan.root, plan.scale, ev.deg) + 12, beat * ev.len * 0.5, 0.05);
        }
      }
    }

    if (plan.voices.drums) {
      var drums = plan.drums;
      if (drums === 'four') {
        if (s % 4 === 0) kick(when);
        if (s % 4 === 2) hat(when, 0.045);
        if (s === 4 || s === 12) snare(when);
        if (bar % 4 === 3 && s > 12) snare(when, 0.06);
      } else if (drums === 'big') {
        if (s === 0 || s === 8 || s === 11) kick(when);
        if (s === 4 || s === 12) snare(when, 0.12);
        if (s % 4 === 2) hat(when, 0.05);
        if (bar % 8 === 7 && s >= 12) snare(when, 0.09);
      } else if (drums === 'soft') {
        if (s === 0 || s === 10) kick(when);
        if (s === 8) snare(when, 0.09);
        if (s % 4 === 2) hat(when, 0.03);
      } else if (drums === 'sparse') {
        if (s === 0) kick(when);
        if (s === 12) hat(when, 0.035);
      }
    }
  }

  function scheduler() {
    if (!A.playing || !A.ctx || !A.plan) return;
    var stepDur = 60 / A.plan.bpm / 4;
    while (A.nextTime < A.ctx.currentTime + 0.15) {
      var swing = (A.step % 2 === 1) ? stepDur * A.plan.swing : 0;
      scheduleStep(A.step, A.nextTime + swing);
      A.nextTime += stepDur;
      A.step++;
    }
  }

  function start() {
    if (!init()) return;
    if (A.ctx.state === 'suspended') A.ctx.resume();
    if (A.mood === 'none' || A.muted) return;
    if (A.playing) return;
    if (!A.plan) A.plan = buildPlan(A.seed, A.mood);
    A.playing = true;
    A.step = 0;
    A.startedAt = A.ctx.currentTime;
    A.nextTime = A.ctx.currentTime + 0.08;
    if (A.timer) clearInterval(A.timer);
    A.timer = setInterval(scheduler, 25);
    scheduler();
  }

  function stop() {
    A.playing = false;
    if (A.timer) { clearInterval(A.timer); A.timer = null; }
  }

  function restart() { stop(); start(); }

  /** Give the show a new soundtrack. Same seed always sounds the same. */
  function setSeed(seed) {
    A.seed = (seed >>> 0) || 1;
    A.plan = buildPlan(A.seed, A.mood);
    if (A.playing) restart();
    return A.plan;
  }
  function newSeed() {
    var next = Math.floor(Math.random() * 0xFFFFFFFF);
    setSeed(next);
    return next;
  }
  function setMood(m) {
    A.mood = m || 'uplifting';
    A.plan = buildPlan(A.seed, A.mood);
    if (A.playing) restart();
  }
  function setMuted(v) {
    A.muted = !!v;
    if (A.master) A.master.gain.setTargetAtTime(A.muted ? 0 : A.volume, A.ctx.currentTime, 0.05);
    if (!A.muted && !A.playing) start();
    if (A.muted) stop();
  }
  function level() {
    if (!A.ana || !A.playing) return 0;
    var arr = new Uint8Array(A.ana.frequencyBinCount);
    A.ana.getByteTimeDomainData(arr);
    var sum = 0, i;
    for (i = 0; i < arr.length; i++) { var v = (arr[i] - 128) / 128; sum += v * v; }
    return Math.sqrt(sum / arr.length);
  }
  /** 0..1 through the current beat — for visuals that want to breathe. */
  function beatPhase() {
    if (!A.plan || !A.playing || !A.ctx) return 0;
    var beat = 60 / A.plan.bpm;
    return ((A.ctx.currentTime - A.startedAt) % beat) / beat;
  }

  window.Music = {
    MOODS: MOODS, MOOD_LIST: MOOD_LIST, init: init, start: start, stop: stop,
    restart: restart, setMood: setMood, setMuted: setMuted, level: level,
    setSeed: setSeed, newSeed: newSeed, beatPhase: beatPhase,
    plan: function () { return A.plan; },
    state: A
  };
})();
