/* WortPapagei — geluidjes als xylofoon, zelf opgewekt met Web Audio (geen bestanden, werkt offline).
   Een staafje = grondtoon + boventoon (±4x, sterft snel uit) + een kort houten tikje bij de aanslag. */
(function () {
  'use strict';
  const KEY = 'wortpapagei.sound';
  let on = true;
  try { on = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* opslag niet beschikbaar */ }
  let ctx = null, master = null, noise = null;

  // iOS: 'ambient' volgt de stilschakelaar en onderbreekt je muziek niet.
  try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) { /* oudere iOS */ }

  function audio() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(ctx.destination);
    noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.03), ctx.sampleRate);
    const ch = noise.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
    return ctx;
  }
  // Safari start audio pas na een tik: maak de context bij de eerste aanraking wakker.
  const unlock = () => { if (!on) return; const a = audio(); if (a && a.state !== 'running') a.resume().catch(() => {}); };
  ['pointerdown', 'touchstart', 'keydown'].forEach(t => window.addEventListener(t, unlock, { passive: true, capture: true }));

  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const freq = n => { const m = n.match(/^([A-G])(#|b)?(\d)$/); const s = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12; return 440 * Math.pow(2, (s - 69) / 12); };

  function bar(note, at, vol = 1, len = 0.5) {
    const f = freq(note), t = at;
    const partial = (mult, gain, decay) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f * mult;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain * vol, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + decay + 0.02);
    };
    partial(1, 0.5, len);
    partial(3.93, 0.16, len * 0.25);
    partial(9.2, 0.05, len * 0.08);
    const n = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    n.buffer = noise; bp.type = 'bandpass'; bp.frequency.value = Math.min(8000, f * 2.5); bp.Q.value = 1.2;
    g.gain.value = 0.12 * vol;
    n.connect(bp); bp.connect(g); g.connect(master); n.start(t);
  }
  // [noot, tijd in seconden, volume, lengte]
  const TUNES = {
    ok: [['C6', 0], ['G6', 0.09]],
    bad: [['E5', 0, 0.8, 0.6], ['C5', 0.14, 0.8, 0.7]],
    streak: [['C6', 0], ['E6', 0.07], ['G6', 0.14], ['C7', 0.21, 0.9, 0.7]],
    finish: [['G5', 0], ['C6', 0.11], ['E6', 0.22], ['G6', 0.33], ['E6', 0.47, 0.6], ['C7', 0.58, 1, 0.9]],
    record: [['C6', 0], ['E6', 0.08], ['G6', 0.16], ['C7', 0.24], ['G6', 0.36], ['C7', 0.44], ['E7', 0.52, 1, 1]],
    canary: [['G6', 0, 0.7, 0.3], ['B6', 0.06, 0.7, 0.3], ['D7', 0.12, 0.7, 0.3], ['G7', 0.18, 0.6, 0.4]],
    raven: [['D5', 0, 0.9, 0.5], ['F5', 0.12, 0.9, 0.5], ['A4', 0.3, 1, 0.8]],
    flip: [['A5', 0, 0.45, 0.25]],
    tap: [['E6', 0, 0.3, 0.15]],
  };
  function play(name) {
    if (!on || !TUNES[name]) return;
    const a = audio(); if (!a) return;
    if (a.state !== 'running') a.resume().catch(() => {});
    const t0 = a.currentTime + 0.02;
    try { TUNES[name].forEach(([n, t, v, l]) => bar(n, t0 + t, v ?? 1, l ?? 0.5)); } catch (e) { /* geen geluid mogelijk */ }
  }
  function set(v) {
    on = v;
    try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch (e) { /* opslag niet beschikbaar */ }
    if (v) { unlock(); play('ok'); }
    draw();
  }
  const ICON_ON = '<path d="M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>';
  const ICON_OFF = '<path d="M4 9v6h4l5 4V5L8 9H4zM17 9.5l5 5M22 9.5l-5 5"/>';
  function draw() {
    const b = document.getElementById('soundBtn'); if (!b) return;
    b.setAttribute('aria-pressed', on);
    b.setAttribute('aria-label', on ? 'Geluid uitzetten' : 'Geluid aanzetten');
    b.innerHTML = `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${on ? ICON_ON : ICON_OFF}</svg>`;
  }
  document.addEventListener('DOMContentLoaded', () => {
    draw();
    const b = document.getElementById('soundBtn'); if (b) b.onclick = () => set(!on);
  });
  window.WortPapageiSound = { play, set, get on() { return on; } };
})();
