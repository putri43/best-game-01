// All drawing, no rules: paints the starfield, ships, bullets, shards and
// the HUD / screens. The canvas is scaled to a fixed 1280x720 logical area.
import { ENEMY, FIELD, FONT, PALETTE, WAVES } from './config.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;
export const SCREEN_WIN = 4;

function poly(ctx, x, y, r, points, angle) {
  ctx.beginPath();
  for (let i = 0; i < points.length; i += 1) {
    const px = x + Math.cos(angle + points[i][0]) * points[i][1] * r;
    const py = y + Math.sin(angle + points[i][0]) * points[i][1] * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function fit() {
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    ctx.setTransform(scale, 0, 0, scale, (canvas.width - FIELD.width * scale) / 2, (canvas.height - FIELD.height * scale) / 2);
  }
  function drawShip(x, y, angle, color, scale) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.fillStyle = color; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20 * scale, 0); ctx.lineTo(-14 * scale, 12 * scale); ctx.lineTo(-7 * scale, 0); ctx.lineTo(-14 * scale, -12 * scale);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(4 * scale, 0, 3.5 * scale, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  function panel(x, y, w, h) {
    ctx.fillStyle = PALETTE.panel; ctx.strokeStyle = 'rgba(160,180,255,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.stroke();
  }
  function draw(state, screen, best) {
    fit();
    // background
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    g.addColorStop(0, PALETTE.bg1); g.addColorStop(1, PALETTE.bg0);
    ctx.fillStyle = g; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.nebulaA; ctx.globalAlpha = 0.16;
    ctx.beginPath(); ctx.ellipse(300, 180, 320, 130, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.nebulaB;
    ctx.beginPath(); ctx.ellipse(980, 560, 340, 140, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    const t = performance.now() / 1000;
    for (const s of state.stars) {
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t + s.tw));
      ctx.fillStyle = '#dfe8ff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (screen === SCREEN_TITLE) {
      // ambient backdrop: rocks drifting, ship parked centre
      for (const r of state.rocks) {
        ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.rot);
        ctx.fillStyle = '#5a6478'; ctx.strokeStyle = '#8b96ab'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 7; i += 1) { const a = (i / 7) * Math.PI * 2; const rr = r.r * (0.8 + ((i * 37) % 10) / 40); const px = Math.cos(a) * rr; const py = Math.sin(a) * rr; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      drawShip(FIELD.width / 2, 430, -Math.PI / 2, PALETTE.cyan, 1.6);
      ctx.textAlign = 'center'; ctx.fillStyle = PALETTE.text;
      ctx.font = `800 64px ${FONT}`; ctx.fillText('STARFALL SALVAGE', FIELD.width / 2, 180);
      ctx.font = `500 22px ${FONT}`; ctx.fillStyle = PALETTE.gold;
      ctx.fillText('Salvage the shards. Survive 5 waves. Kill the Harvester.', FIELD.width / 2, 225);
      ctx.fillStyle = PALETTE.muted; ctx.font = `400 18px ${FONT}`;
      ctx.fillText('WASD / Arrows — fly    Mouse — aim    Click / Space — shoot', FIELD.width / 2, 520);
      ctx.fillText('Shift — dash    P — pause    R — restart    Enter — start', FIELD.width / 2, 550);
      ctx.fillStyle = PALETTE.cyan; ctx.font = `700 22px ${FONT}`;
      ctx.fillText('PRESS ENTER OR CLICK TO START', FIELD.width / 2, 610);
      ctx.fillStyle = PALETTE.muted; ctx.font = `400 15px ${FONT}`;
      ctx.fillText(`Best score: ${best}`, FIELD.width / 2, 650);
      return;
    }

    // shards
    for (const s of state.shards) {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.t * 2);
      ctx.fillStyle = PALETTE.gold; ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 0); ctx.lineTo(0, 9); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    // pickups
    for (const u of state.pickups) {
      ctx.save(); ctx.translate(u.x, u.y + Math.sin(u.t * 3) * 3);
      ctx.fillStyle = u.kind === 'cell' ? PALETTE.green : PALETTE.orange;
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#06101f'; ctx.font = `800 16px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(u.kind === 'cell' ? '+' : '⚡', 0, 1); ctx.restore();
    }
    // rocks
    for (const r of state.rocks) {
      ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.rot);
      ctx.fillStyle = '#5a6478'; ctx.strokeStyle = '#8b96ab'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 7; i += 1) { const a = (i / 7) * Math.PI * 2; const rr = r.r * (0.8 + ((i * 37) % 10) / 40); const px = Math.cos(a) * rr; const py = Math.sin(a) * rr; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    // enemies
    for (const e of state.enemies) {
      if (e.kind === 'drone') {
        drawShip(e.x, e.y, e.angle, PALETTE.red, 1);
        ctx.fillStyle = '#ff8a93'; ctx.beginPath(); ctx.arc(e.x + Math.cos(e.angle) * 6, e.y + Math.sin(e.angle) * 6, 3, 0, Math.PI * 2); ctx.fill();
      } else if (e.kind === 'spinner') {
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.angle);
        ctx.fillStyle = '#b06bf7'; ctx.strokeStyle = '#e2c6ff'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i += 1) { const a = (i / 6) * Math.PI * 2; const px = Math.cos(a) * 17; const py = Math.sin(a) * 17; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      } else if (e.kind === 'boss') {
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.angle + Math.PI / 2);
        ctx.fillStyle = '#7a1f2b'; ctx.strokeStyle = '#ff5d6c'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(0, 52); ctx.lineTo(44, -30); ctx.lineTo(18, -44); ctx.lineTo(-18, -44); ctx.lineTo(-44, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = PALETTE.orange; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // boss hull bar
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - 55, e.y - 78, 110, 8);
        ctx.fillStyle = PALETTE.red; ctx.fillRect(e.x - 55, e.y - 78, 110 * Math.max(0, e.hull / ENEMY.boss.hull), 8);
        ctx.fillStyle = PALETTE.text; ctx.font = `700 13px ${FONT}`; ctx.textAlign = 'center';
        ctx.fillText('THE HARVESTER', e.x, e.y - 84);
      }
      // enemy hull pips
      if (e.kind !== 'boss' && e.hull < ENEMY[e.kind].hull) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - 14, e.y - ENEMY[e.kind].radius - 10, 28, 4);
        ctx.fillStyle = PALETTE.red; ctx.fillRect(e.x - 14, e.y - ENEMY[e.kind].radius - 10, 28 * (e.hull / ENEMY[e.kind].hull), 4);
      }
    }
    // bullets
    ctx.fillStyle = '#aef3ff';
    for (const b of state.bullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ff8a93';
    for (const b of state.ebullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 5, 0, Math.PI * 2); ctx.fill(); }
    // player
    const p = state.player;
    if (p && !(p.invuln > 0 && Math.floor(t * 12) % 2 === 0)) {
      // dash trail + thruster
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(-14, 6); ctx.lineTo(-26 - Math.random() * 8, 0); ctx.lineTo(-14, -6); ctx.closePath(); ctx.fill();
      ctx.restore();
      drawShip(p.x, p.y, p.angle, p.overcharge > 0 ? PALETTE.orange : PALETTE.cyan, 1);
    }
    // particles
    for (const pt of state.particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.max);
      ctx.fillStyle = pt.color; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // floaters
    ctx.textAlign = 'center'; ctx.font = `700 16px ${FONT}`;
    for (const f of state.floaters) { ctx.globalAlpha = Math.max(0, f.life); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y); }
    ctx.globalAlpha = 1;

    // HUD
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    panel(16, 14, 300, 86);
    ctx.fillStyle = PALETTE.text; ctx.font = `700 20px ${FONT}`;
    ctx.fillText(`SCORE  ${state.score}`, 30, 42);
    ctx.font = `500 15px ${FONT}`; ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`WAVE ${Math.max(1, state.wave)} / ${WAVES.length}    KILLS ${state.kills}    SHARDS ${state.shardsCollected}`, 30, 66);
    ctx.fillStyle = state.combo > 1 ? PALETTE.gold : PALETTE.muted;
    ctx.fillText(`COMBO x${state.combo}`, 30, 88);
    // hull bar
    panel(16, 110, 300, 34);
    ctx.fillStyle = '#2a3040'; ctx.fillRect(30, 120, 220, 14);
    ctx.fillStyle = p.hull > 40 ? PALETTE.green : PALETTE.red;
    ctx.fillRect(30, 120, 220 * Math.max(0, p.hull / p.maxHull), 14);
    ctx.fillStyle = PALETTE.text; ctx.font = `700 13px ${FONT}`;
    ctx.fillText(`HULL ${Math.ceil(p.hull)}`, 258, 132);
    // dash + overcharge
    ctx.fillStyle = PALETTE.muted; ctx.font = `500 14px ${FONT}`;
    ctx.fillText(p.dashCd <= 0 ? 'DASH READY (Shift)' : `DASH ${p.dashCd.toFixed(1)}s`, 30, 166);
    if (p.overcharge > 0) { ctx.fillStyle = PALETTE.orange; ctx.fillText(`OVERCHARGE ${p.overcharge.toFixed(0)}s`, 170, 166); }
    // wave banner
    if (state.bannerTimer > 0) {
      ctx.globalAlpha = Math.min(1, state.bannerTimer);
      ctx.textAlign = 'center'; ctx.fillStyle = PALETTE.gold; ctx.font = `800 40px ${FONT}`;
      ctx.fillText(state.banner, FIELD.width / 2, 200); ctx.globalAlpha = 1;
    }

    if (screen === SCREEN_PAUSED) {
      ctx.fillStyle = 'rgba(3,5,12,0.7)'; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.textAlign = 'center'; ctx.fillStyle = PALETTE.text; ctx.font = `800 52px ${FONT}`;
      ctx.fillText('PAUSED', FIELD.width / 2, 340);
      ctx.font = `400 20px ${FONT}`; ctx.fillStyle = PALETTE.muted;
      ctx.fillText('Press P or Enter to continue — R to restart', FIELD.width / 2, 385);
    }
    if (screen === SCREEN_OVER || screen === SCREEN_WIN) {
      ctx.fillStyle = 'rgba(3,5,12,0.72)'; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.textAlign = 'center';
      ctx.fillStyle = screen === SCREEN_WIN ? PALETTE.gold : PALETTE.red;
      ctx.font = `800 56px ${FONT}`;
      ctx.fillText(screen === SCREEN_WIN ? 'SALVAGE COMPLETE!' : 'SHIP DESTROYED', FIELD.width / 2, 300);
      ctx.fillStyle = PALETTE.text; ctx.font = `500 22px ${FONT}`;
      ctx.fillText(screen === SCREEN_WIN ? 'The Harvester is scrap. The field is yours.' : `You fell on wave ${Math.max(1, state.wave)}.`, FIELD.width / 2, 345);
      ctx.font = `700 26px ${FONT}`;
      ctx.fillText(`Score ${state.score}   •   Kills ${state.kills}   •   Shards ${state.shardsCollected}`, FIELD.width / 2, 395);
      ctx.fillStyle = PALETTE.muted; ctx.font = `400 18px ${FONT}`;
      ctx.fillText(`Best ${Math.max(best, state.score)}   —   Press Enter or click to play again (R to restart)`, FIELD.width / 2, 435);
    }
  }
  return { draw };
}
