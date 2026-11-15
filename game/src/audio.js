// Synthesised WebAudio sound effects — no audio files, nothing loads over
// the network. Created lazily on the first user gesture so browsers allow it.
export function createAudio() {
  let ctx = null;
  function ensure() {
    if (ctx) return ctx;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    return ctx;
  }
  function tone(freq, dur, type, vol, slideTo) {
    const c = ensure(); if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur);
  }
  return {
    unlock: ensure,
    shoot: () => tone(720, 0.07, 'square', 0.05, 320),
    hit: () => tone(180, 0.12, 'sawtooth', 0.08, 60),
    kill: () => { tone(520, 0.12, 'triangle', 0.09, 180); tone(260, 0.18, 'triangle', 0.07, 90); },
    pickup: () => tone(880, 0.09, 'sine', 0.08, 1320),
    hurt: () => tone(140, 0.25, 'sawtooth', 0.12, 50),
    wave: () => { tone(440, 0.12, 'sine', 0.07); setTimeout(() => tone(660, 0.16, 'sine', 0.07), 120); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.09), i * 140)),
  };
}
