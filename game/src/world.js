// STARFALL SALVAGE rules and state, with no drawing and no browser in it.
// The player salvages star shards in an asteroid field while waves of
// rogue drones attack. Clear wave 5's boss to win; hull 0 loses the run.
// step() advances one fixed step and returns what happened as bit flags.
import { ENEMY, FIELD, PICKUP, PLAYER, STEP, WAVES } from './config.js';
import { randRange } from './random.js';

export const EVENT_HIT = 1;
export const EVENT_KILL = 2;
export const EVENT_PICKUP = 4;
export const EVENT_WAVE = 8;
export const EVENT_WIN = 16;
export const EVENT_OVER = 32;

function dist2(a, b) { const dx = a.x - b.x; const dy = a.y - b.y; return dx * dx + dy * dy; }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

export function createWorld(random) {
  const stars = [];
  for (let i = 0; i < 130; i += 1) stars.push({ x: random() * FIELD.width, y: random() * FIELD.height, r: 0.6 + random() * 1.8, tw: random() * Math.PI * 2 });

  const state = {
    stars, player: null, bullets: [], ebullets: [], enemies: [], rocks: [],
    shards: [], pickups: [], particles: [], floaters: [],
    score: 0, combo: 1, comboTimer: 0, kills: 0, shardsCollected: 0,
    wave: 0, waveState: 'intro', waveTimer: 0, elapsed: 0, won: false, over: false,
    banner: '', bannerTimer: 0,
  };

  function freshPlayer() {
    return {
      x: FIELD.width / 2, y: FIELD.height / 2, vx: 0, vy: 0, angle: -Math.PI / 2,
      hull: PLAYER.hull, maxHull: PLAYER.hull, fireTimer: 0, dashTimer: 0,
      dashCd: 0, invuln: 0, overcharge: 0,
    };
  }
  function reset() {
    state.player = freshPlayer();
    state.bullets = []; state.ebullets = []; state.enemies = []; state.rocks = [];
    state.shards = []; state.pickups = []; state.particles = []; state.floaters = [];
    state.score = 0; state.combo = 1; state.comboTimer = 0; state.kills = 0;
    state.shardsCollected = 0; state.wave = 0; state.waveState = 'intro';
    state.waveTimer = 1.2; state.elapsed = 0; state.won = false; state.over = false;
    state.banner = 'WAVE 1 INCOMING'; state.bannerTimer = 2;
  }

  function spawnAtEdge(kind) {
    const side = Math.floor(random() * 4);
    let x = 0; let y = 0;
    if (side === 0) { x = randRange(random, 60, FIELD.width - 60); y = -40; }
    if (side === 1) { x = randRange(random, 60, FIELD.width - 60); y = FIELD.height + 40; }
    if (side === 2) { x = -40; y = randRange(random, 60, FIELD.height - 60); }
    if (side === 3) { x = FIELD.width + 40; y = randRange(random, 60, FIELD.height - 60); }
    return { kind, x, y, vx: 0, vy: 0, angle: random() * Math.PI * 2, hull: ENEMY[kind].hull, fireTimer: randRange(random, 1, 2.5), spin: randRange(random, -1, 1), t: 0 };
  }
  function spawnRock() {
    const r = randRange(random, 14, 30);
    return { x: randRange(random, 40, FIELD.width - 40), y: randRange(random, -80, -30), vx: randRange(random, -30, 30), vy: randRange(random, 30, 80), r, hull: 3, rot: random() * Math.PI * 2, vr: randRange(random, -0.8, 0.8) };
  }
  function spawnWave(n) {
    const w = WAVES[n - 1];
    state.wave = n; state.waveState = 'active'; state.banner = `WAVE ${n}`; state.bannerTimer = 2;
    for (let i = 0; i < w.drones; i += 1) state.enemies.push(spawnAtEdge('drone'));
    for (let i = 0; i < w.spinners; i += 1) state.enemies.push(spawnAtEdge('spinner'));
    for (let i = 0; i < w.rocks; i += 1) state.rocks.push(spawnRock());
    if (w.boss) {
      state.enemies.push({ kind: 'boss', x: FIELD.width / 2, y: -80, vx: 0, vy: 0, angle: Math.PI / 2, hull: ENEMY.boss.hull, fireTimer: 2, spin: 0, t: 0 });
      state.banner = 'WAVE 5 — THE HARVESTER';
    }
  }
  function burst(x, y, color, n, speed) {
    for (let i = 0; i < n; i += 1) {
      const a = random() * Math.PI * 2; const s = randRange(random, speed * 0.3, speed);
      state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: randRange(random, 0.3, 0.8), max: 0.8, color, r: randRange(random, 1.5, 3.5) });
    }
  }
  function floater(x, y, text, color) { state.floaters.push({ x, y, text, color, life: 1 }); }
  function dropShards(x, y, n) {
    for (let i = 0; i < n; i += 1) {
      const a = random() * Math.PI * 2;
      state.shards.push({ x, y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, t: random() * Math.PI * 2 });
    }
  }
  function addScore(base, x, y) {
    const pts = base * state.combo;
    state.score += pts;
    state.comboTimer = 4;
    floater(x, y, `+${pts}`, '#f2c94c');
  }

  function step(dt, input, harmless) {
    let events = 0;
    if (state.won || state.over) return events;
    state.elapsed += dt;
    const p = state.player;
    if (state.bannerTimer > 0) state.bannerTimer -= dt;
    if (state.comboTimer > 0) { state.comboTimer -= dt; if (state.comboTimer <= 0) state.combo = 1; }

    // --- waves ---
    if (state.waveState === 'intro') {
      state.waveTimer -= dt;
      if (state.waveTimer <= 0) { spawnWave(state.wave + 1); events |= EVENT_WAVE; }
    } else if (state.waveState === 'active' && state.enemies.length === 0 && state.rocks.length === 0) {
      if (state.wave >= WAVES.length) { state.won = true; events |= EVENT_WIN; return events; }
      state.waveState = 'intro'; state.waveTimer = 1.6;
      state.banner = `WAVE ${state.wave + 1} INCOMING`; state.bannerTimer = 2;
      events |= EVENT_WAVE;
    }

    // --- player ---
    const mv = input.move || { x: 0, y: 0 };
    if (p.dashTimer > 0) p.dashTimer -= dt;
    if (p.dashCd > 0) p.dashCd -= dt;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.overcharge > 0) p.overcharge -= dt;
    if (input.dash && p.dashCd <= 0 && (mv.x !== 0 || mv.y !== 0)) {
      p.dashTimer = PLAYER.dashTime; p.dashCd = PLAYER.dashCooldown;
      p.vx = mv.x * PLAYER.dashSpeed; p.vy = mv.y * PLAYER.dashSpeed;
      burst(p.x, p.y, '#4fd8f7', 10, 200);
    }
    if (p.dashTimer <= 0) {
      p.vx += mv.x * PLAYER.accel * dt; p.vy += mv.y * PLAYER.accel * dt;
      p.vx *= Math.pow(PLAYER.drag, dt * 60); p.vy *= Math.pow(PLAYER.drag, dt * 60);
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > PLAYER.maxSpeed) { p.vx *= PLAYER.maxSpeed / sp; p.vy *= PLAYER.maxSpeed / sp; }
    }
    p.x = clamp(p.x + p.vx * dt, 18, FIELD.width - 18);
    p.y = clamp(p.y + p.vy * dt, 18, FIELD.height - 18);
    if (input.aim) p.angle = Math.atan2(input.aim.y - p.y, input.aim.x - p.x);
    p.fireTimer -= dt;
    if (input.firing && p.fireTimer <= 0 && !harmless) {
      p.fireTimer = p.overcharge > 0 ? PLAYER.fireInterval * 0.45 : PLAYER.fireInterval;
      const spread = p.overcharge > 0 ? 0.09 : 0.03;
      const n = p.overcharge > 0 ? 3 : 1;
      for (let i = 0; i < n; i += 1) {
        const a = p.angle + (i - (n - 1) / 2) * spread;
        state.bullets.push({ x: p.x + Math.cos(a) * 22, y: p.y + Math.sin(a) * 22, vx: Math.cos(a) * PLAYER.bulletSpeed, vy: Math.sin(a) * PLAYER.bulletSpeed, damage: PLAYER.bulletDamage, life: 1.1 });
      }
    }

    // --- enemies ---
    for (const e of state.enemies) {
      e.t += dt;
      const dx = p.x - e.x; const dy = p.y - e.y; const d = Math.hypot(dx, dy) || 1;
      if (e.kind === 'drone') {
        e.vx += (dx / d) * 260 * dt; e.vy += (dy / d) * 260 * dt;
        const s = Math.hypot(e.vx, e.vy); const cap = ENEMY.drone.speed + state.wave * 8;
        if (s > cap) { e.vx *= cap / s; e.vy *= cap / s; }
        e.angle = Math.atan2(e.vy, e.vx);
      } else if (e.kind === 'spinner') {
        const orbit = Math.atan2(dy, dx) + Math.PI / 2;
        e.vx = Math.cos(orbit) * ENEMY.spinner.speed + (dx / d) * 40;
        e.vy = Math.sin(orbit) * ENEMY.spinner.speed + (dy / d) * 40;
        e.angle += e.spin * dt * 2;
        e.fireTimer -= dt;
        if (e.fireTimer <= 0 && d < 520 && !harmless) {
          e.fireTimer = ENEMY.spinner.fireInterval;
          const a = Math.atan2(dy, dx);
          state.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * ENEMY.spinner.bulletSpeed, vy: Math.sin(a) * ENEMY.spinner.bulletSpeed, life: 3 });
        }
      } else if (e.kind === 'boss') {
        e.y = Math.min(e.y + 40 * dt, 130);
        e.x += Math.sin(e.t * 0.7) * 60 * dt;
        e.angle = Math.atan2(dy, dx);
        e.fireTimer -= dt;
        if (e.fireTimer <= 0 && !harmless) {
          e.fireTimer = 1.1;
          for (let i = -1; i <= 1; i += 1) {
            const a = Math.atan2(dy, dx) + i * 0.22;
            state.ebullets.push({ x: e.x, y: e.y + 30, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, life: 3.5 });
          }
          if (Math.floor(e.t) % 3 === 0) state.rocks.push(spawnRock());
        }
      }
      e.x += e.vx * dt; e.y += e.vy * dt;
      e.x = clamp(e.x, -60, FIELD.width + 60); e.y = clamp(e.y, -60, FIELD.height + 60);
    }

    // --- rocks ---
    for (const r of state.rocks) {
      r.x += r.vx * dt; r.y += r.vy * dt; r.rot += r.vr * dt;
      if (r.y > FIELD.height + 40) { r.y = -40; r.x = randRange(random, 40, FIELD.width - 40); }
    }

    // --- bullets ---
    for (const b of state.bullets) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; }
    state.bullets = state.bullets.filter((b) => b.life > 0 && b.x > -20 && b.x < FIELD.width + 20 && b.y > -20 && b.y < FIELD.height + 20);
    for (const b of state.ebullets) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; }
    state.ebullets = state.ebullets.filter((b) => b.life > 0 && b.x > -20 && b.x < FIELD.width + 20 && b.y > -20 && b.y < FIELD.height + 20);

    // --- bullet vs enemy / rock ---
    for (const b of state.bullets) {
      for (const e of state.enemies) {
        const rr = ENEMY[e.kind].radius + 4;
        if (dist2(b, e) < rr * rr) {
          b.life = 0; e.hull -= b.damage; burst(b.x, b.y, '#ffd166', 4, 140);
          if (e.hull <= 0) {
            e.dead = true; state.kills += 1; state.combo = Math.min(8, state.combo + 1);
            addScore(ENEMY[e.kind].score, e.x, e.y);
            burst(e.x, e.y, e.kind === 'boss' ? '#ff9f43' : '#ff5d6c', e.kind === 'boss' ? 40 : 16, 260);
            dropShards(e.x, e.y, ENEMY[e.kind].shards);
            if (e.kind !== 'boss' && random() < 0.12) state.pickups.push({ kind: random() < 0.5 ? 'cell' : 'over', x: e.x, y: e.y, t: 0 });
            events |= EVENT_KILL;
          }
          break;
        }
      }
      if (b.life <= 0) continue;
      for (const r of state.rocks) {
        if (dist2(b, r) < (r.r + 4) * (r.r + 4)) {
          b.life = 0; r.hull -= b.damage; burst(b.x, b.y, '#c9d4e8', 4, 120);
          if (r.hull <= 0) { r.dead = true; state.kills += 1; addScore(ENEMY.rock.score, r.x, r.y); burst(r.x, r.y, '#c9d4e8', 14, 220); dropShards(r.x, r.y, 1); events |= EVENT_KILL; }
          break;
        }
      }
    }
    state.enemies = state.enemies.filter((e) => !e.dead);
    state.rocks = state.rocks.filter((r) => !r.dead);
    state.bullets = state.bullets.filter((b) => b.life > 0);

    // --- enemy / rock / ebullet vs player ---
    if (!harmless && p.invuln <= 0 && p.dashTimer <= 0) {
      for (const e of state.enemies) {
        const rr = ENEMY[e.kind].radius + PLAYER.radius - 4;
        if (dist2(p, e) < rr * rr) { hurt(e.kind === 'boss' ? 25 : 12, e); break; }
      }
      if (p.invuln <= 0) {
        for (const r of state.rocks) {
          if (dist2(p, r) < (r.r + PLAYER.radius - 4) * (r.r + PLAYER.radius - 4)) { hurt(10, r); r.dead = true; burst(r.x, r.y, '#c9d4e8', 10, 180); break; }
        }
      }
      if (p.invuln <= 0) {
        for (const b of state.ebullets) {
          if (dist2(p, b) < (PLAYER.radius + 5) * (PLAYER.radius + 5)) { b.life = 0; hurt(8, b); break; }
        }
      }
    }
    function hurt(dmg, src) {
      p.hull -= dmg; p.invuln = PLAYER.invulnerable; events |= EVENT_HIT;
      burst(p.x, p.y, '#ff5d6c', 14, 240);
      if (src && src.x !== undefined && src.kind !== undefined) { /* enemy keeps coming */ }
      if (p.hull <= 0) { p.hull = 0; state.over = true; events |= EVENT_OVER; burst(p.x, p.y, '#ff5d6c', 50, 320); }
    }
    state.rocks = state.rocks.filter((r) => !r.dead);
    state.ebullets = state.ebullets.filter((b) => b.life > 0);

    // --- shards & pickups (magnet toward player) ---
    for (const s of state.shards) {
      s.t += dt;
      const d = Math.hypot(p.x - s.x, p.y - s.y) || 1;
      if (d < 170) { s.vx += ((p.x - s.x) / d) * 900 * dt; s.vy += ((p.y - s.y) / d) * 900 * dt; }
      s.vx *= 0.94; s.vy *= 0.94; s.x += s.vx * dt; s.y += s.vy * dt;
      if (d < PLAYER.radius + 12) {
        s.dead = true; state.shardsCollected += 1; state.score += PICKUP.shardScore;
        floater(s.x, s.y, `+${PICKUP.shardScore}`, '#4fd8f7'); events |= EVENT_PICKUP;
      }
    }
    state.shards = state.shards.filter((s) => !s.dead);
    for (const u of state.pickups) {
      u.t += dt;
      if (Math.hypot(p.x - u.x, p.y - u.y) < PLAYER.radius + 16) {
        u.dead = true; events |= EVENT_PICKUP;
        if (u.kind === 'cell') { p.hull = Math.min(p.maxHull, p.hull + PICKUP.cellHeal); floater(p.x, p.y - 24, `+${PICKUP.cellHeal} HULL`, '#5be584'); }
        else { p.overcharge = PICKUP.overchargeTime; floater(p.x, p.y - 24, 'OVERCHARGE!', '#ff9f43'); }
      }
    }
    state.pickups = state.pickups.filter((u) => !u.dead);

    // --- particles / floaters ---
    for (const pt of state.particles) { pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt; }
    state.particles = state.particles.filter((pt) => pt.life > 0);
    for (const f of state.floaters) { f.y -= 34 * dt; f.life -= dt; }
    state.floaters = state.floaters.filter((f) => f.life > 0);
    return events;
  }

  reset();
  return { state, reset, step, spawnWave, forceVictory() { state.won = true; state.enemies = []; state.rocks = []; } };
}
