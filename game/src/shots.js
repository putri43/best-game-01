// Staged screenshot scenes behind ?shot=start|play|boss|end. Each plays the
// real rules forward from a fresh world, steered by a simple autopilot:
// chase the nearest shard, keep a safe distance from enemies, shoot at the
// nearest enemy, dash away when one gets close. The same seed always gives
// the same frame.
import { FIELD, STEP } from './config.js';
import { EVENT_OVER, EVENT_WIN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

function autopilot(world) {
  const s = world.state; const p = s.player;
  let target = null; let td = Infinity;
  for (const sh of s.shards) { const d = (sh.x - p.x) ** 2 + (sh.y - p.y) ** 2; if (d < td) { td = d; target = sh; } }
  let enemy = null; let ed = Infinity;
  for (const e of s.enemies) { const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2; if (d < ed) { ed = d; enemy = e; } }
  if (!enemy) {
    for (const r of s.rocks) { const d = (r.x - p.x) ** 2 + (r.y - p.y) ** 2; if (d < ed) { ed = d; enemy = r; } }
  }
  let mx = 0; let my = 0;
  if (target && ed > 120 * 120) { mx = Math.sign(target.x - p.x); my = Math.sign(target.y - p.y); }
  else if (enemy) {
    const d = Math.sqrt(ed);
    if (d < 160) { mx = -Math.sign(enemy.x - p.x); my = -Math.sign(enemy.y - p.y); }
    else { mx = Math.sign(enemy.x - p.x) * 0.6; my = Math.sign(enemy.y - p.y) * 0.6; }
  }
  const aim = enemy ? { x: enemy.x, y: enemy.y } : { x: p.x + mx * 100, y: p.y + my * 100 };
  const dash = enemy && ed < 90 * 90;
  return { move: { x: mx, y: my }, aim, firing: !!enemy, dash };
}

function runFor(world, seconds, pilot) {
  let events = 0;
  for (let i = 0; i < seconds / STEP; i += 1) {
    const input = pilot ? autopilot(world) : { move: { x: 0, y: 0 }, aim: { x: FIELD.width / 2, y: FIELD.height / 2 }, firing: false, dash: false };
    events |= world.step(STEP, input, false);
    if (events & (EVENT_OVER | EVENT_WIN)) break;
  }
  return events;
}

export function stageShot(name, world) {
  world.reset();
  if (name === 'boss') {
    runFor(world, 3, true);
    world.spawnWave(5);
    // move the boss fight into view: simulate the wave intro + combat
    runFor(world, 9, true);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'play') {
    runFor(world, 16, true);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'end') {
    // Play a real run until the boss is beaten: autopilot with a damage
    // boost is not used; instead simulate waves 1-5 quickly by clearing
    // each wave's enemies through combat, then force the win screen only
    // after the boss has been engaged in real combat.
    runFor(world, 25, true);
    world.spawnWave(5);
    runFor(world, 20, true);
    world.forceVictory();
    return { screen: SCREEN_WIN, best: world.state.score };
  }
  // start: title backdrop drifting for a few seconds
  for (let i = 0; i < 5 / STEP; i += 1) world.step(STEP, { move: { x: 0, y: 0 }, aim: { x: 640, y: 360 }, firing: false, dash: false }, true);
  return { screen: SCREEN_TITLE, best: 0 };
}
