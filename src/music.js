/* ============================================================
   Motion Studio — procedural music engine (Web Audio)
   Generates an original soundtrack per mood. No files, no samples.
   ============================================================ */
(function () {
  'use strict';

  var MOODS = {
    uplifting: { label: 'Uplifting', bpm: 116, root: 57, scale: [0, 2, 4, 7, 9], prog: [[0, 2, 4], [3, 5, 7], [4, 6, 1], [3, 5, 0]], drums: 'four', arp: 1, pad: 0.55, swing: 0 },
    calm: { label: 'Calm', bpm: 74, root: 53, scale: [0, 2, 4, 7, 9], prog: [[0, 2, 4], [3, 5, 0], [1, 3, 5], [3, 5, 0]], drums: 'none', arp: 0.7, pad: 0.75, swing: 0 },
    epic: { label: 'Epic', bpm: 96, root: 50, scale: [0, 2, 3, 5, 7, 8, 10], prog: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [4, 6, 1]], drums: 'big', arp: 1, pad: 0.6, swing: 0 },
    playful: { label: 'Playful', bpm: 132, root: 60, scale: [0, 2, 4, 7, 9], prog: [[0, 2, 4], [4, 6, 1], [3, 5, 0], [4, 6, 3]], drums: 'four', arp: 1.2, pad: 0.4, swing: 0.1 },
    tense: { label: 'Tense', bpm: 104, root: 45, scale: [0, 1, 4, 5, 7, 8], prog: [[0, 2, 4], [0, 3, 5], [1, 3, 5], [0, 2, 4]], drums: 'sparse', arp: 0.6, pad: 0.7, swing: 0 },
    lofi: { label: 'Lo-fi', bpm: 84, root: 55, scale: [0, 2, 3, 5, 7, 9, 10], prog: [[0, 2, 4], [3, 5, 0], [5, 0, 2], [3, 5, 0]], drums: 'soft', arp: 0.9, pad: 0.6, swing: 0.16 },
    none: { label: 'Silent', bpm: 0, root: 57, scale: [0, 2, 4, 7, 9], prog: [[0, 2, 4]], drums: 'none', arp: 0, pad: 0, swing: 0 }
  };
  var MOOD_LIST = ['uplifting', 'calm', 'epic', 'playful', 'tense', 'lofi', 'none'];

  var A = {
    ctx: null, master: null, rev: null, revGain: null, ana: null, noise: null,
    mood: 'uplifting', muted: false, volume: 0.55,
    playing: false, step: 0, nextTime: 0, timer: null, seed: 1
  };

  function rnd() {
    A.seed = (A.seed * 1664525 + 1013904223) % 4294967296;
    return A.seed / 4294967296;
  }
  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function deg(root, scale, d) {
    var len = scale.length;
    var oct = Math.floor(d / len);
    var i = ((d % len) + len) % len;
    return root + 12 * oct + scale[i];
  }

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

  function pad(t, freqs, dur) {
    var m = MOODS[A.mood];
    freqs.forEach(function (f, idx) {
      [0, 1].forEach(function (k) {
        var o = A.ctx.createOscillator();
        o.type = k ? 'sawtooth' : 'triangle';
        o.frequency.value = midi(f);
        o.detune.value = (k ? 7 : -6) + idx * 2;
        var f1 = A.ctx.createBiquadFilter();
        f1.type = 'lowpass'; f1.frequency.value = 900 + idx * 120; f1.Q.value = 0.7;
        var g = A.ctx.createGain();
        var peak = 0.034 * (m.pad || 0.5);
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

  function snare(t) {
    var s = A.ctx.createBufferSource();
    s.buffer = A.noise;
    var f = A.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.8;
    var g = A.ctx.createGain();
    g.gain.setValueAtTime(0.10, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    s.connect(f); f.connect(g); g.connect(A.master);
    send(g, 0.4);
    s.start(t); s.stop(t + 0.2);
  }

  function scheduleStep(step, when) {
    var m = MOODS[A.mood];
    if (!m || m.bpm === 0) return;
    var bar = Math.floor(step / 16);
    var s = step % 16;
    var chordIdx = Math.floor(bar / 2) % m.prog.length;
    var chordDeg = m.prog[chordIdx];
    var chord = chordDeg.map(function (d) { return deg(m.root, m.scale, d); });
    var beat = 60 / m.bpm;

    if (s === 0) pad(when, chord, beat * 8);

    if (s === 0 || s === 6 || s === 8 || s === 14) bass(when, chord[0], beat * 0.7);

    // arpeggio / melody
    if (m.arp > 0 && s % 2 === 0) {
      var seq = [0, 1, 2, 1, 2, 0, 1, 2];
      var idx = seq[(step / 2) % seq.length];
      var note = chord[idx % chord.length] + (s % 8 === 0 ? 12 : 12);
      pluck(when, note, beat * 0.9, 0.045 * m.arp);
      if (s % 4 === 0 && rnd() > 0.55) pluck(when, chord[0] + 24, beat * 0.6, 0.022);
    }

    // drums
    if (m.drums === 'four') {
      if (s % 4 === 0) kick(when);
      if (s % 4 === 2) hat(when, 0.045);
      if (s === 4 || s === 12) snare(when);
    } else if (m.drums === 'big') {
      if (s === 0 || s === 8 || s === 11) kick(when);
      if (s === 4 || s === 12) snare(when);
      if (s % 4 === 2) hat(when, 0.05);
    } else if (m.drums === 'soft') {
      if (s === 0 || s === 10) kick(when);
      if (s === 8) snare(when);
      if (s % 4 === 2) hat(when, 0.03);
    } else if (m.drums === 'sparse') {
      if (s === 0) kick(when);
      if (s === 12) hat(when, 0.035);
    }
  }

  function scheduler() {
    if (!A.playing || !A.ctx) return;
    var m = MOODS[A.mood];
    if (!m || m.bpm === 0) return;
    var stepDur = 60 / m.bpm / 4;
    while (A.nextTime < A.ctx.currentTime + 0.15) {
      var swing = (A.step % 2 === 1) ? stepDur * (m.swing || 0) : 0;
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
    A.playing = true;
    A.step = 0;
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

  function setMood(m) {
    A.mood = m || 'uplifting';
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

  window.Music = {
    MOODS: MOODS, MOOD_LIST: MOOD_LIST, init: init, start: start, stop: stop,
    restart: restart, setMood: setMood, setMuted: setMuted, level: level,
    state: A
  };
})();
