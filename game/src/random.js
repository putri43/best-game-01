// Small seeded RNG (mulberry32) so a seed always gives the same run, which
// keeps the staged screenshots reproducible.
export function createRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function randRange(random, min, max) { return min + random() * (max - min); }
export function pick(random, arr) { return arr[Math.floor(random() * arr.length)]; }
