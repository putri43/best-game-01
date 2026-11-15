// Tuning numbers and colours for STARFALL SALVAGE. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule
// below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const BEST_KEY = 'starfall-salvage.best';

export const PLAYER = {
  radius: 16,
  accel: 1500,
  maxSpeed: 340,
  drag: 0.86,
  hull: 100,
  fireInterval: 0.16,
  bulletSpeed: 720,
  bulletDamage: 1,
  dashSpeed: 820,
  dashTime: 0.16,
  dashCooldown: 1.4,
  invulnerable: 1.2,
};

export const WAVES = [
  { drones: 4, spinners: 0, rocks: 5, boss: false },
  { drones: 6, spinners: 2, rocks: 6, boss: false },
  { drones: 8, spinners: 3, rocks: 7, boss: false },
  { drones: 9, spinners: 5, rocks: 8, boss: false },
  { drones: 6, spinners: 4, rocks: 6, boss: true },
];

export const ENEMY = {
  drone: { radius: 15, speed: 130, hull: 2, score: 50, shards: 1 },
  spinner: { radius: 17, speed: 85, hull: 3, score: 80, shards: 2, fireInterval: 2.2, bulletSpeed: 260 },
  rock: { radius: 22, speed: 55, hull: 3, score: 30, shards: 1 },
  boss: { radius: 52, speed: 55, hull: 60, score: 1000, shards: 12 },
};

export const PICKUP = { shardScore: 25, cellHeal: 25, overchargeTime: 8 };

export const PALETTE = {
  bg0: '#05070f', bg1: '#0b1030', nebulaA: '#1b2a6b', nebulaB: '#5b1b6b',
  text: '#eef2ff', muted: '#9aa7c7', gold: '#f2c94c', cyan: '#4fd8f7',
  green: '#5be584', red: '#ff5d6c', orange: '#ff9f43', panel: 'rgba(10,14,32,0.82)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
