# STARFALL SALVAGE

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/putri43/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/putri43/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

An original top-down arena shooter / salvage game. Fly your ship through an
asteroid field, shoot rogue drones, collect star shards, and survive 5 waves
— the last one brings **The Harvester**, a boss that fires spread shots and
drops rocks on you. Win by killing the boss; lose when your hull hits 0.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — plain static files, no network, no build step.

## Controls

- **WASD / Arrows** — fly
- **Mouse** — aim
- **Click / Space** — shoot
- **Shift** — dash (1.4 s cooldown, brief invulnerability)
- **P** — pause, **R** — restart, **Enter** — start

## Systems

- **Waves 1–5** with escalating drones, spinning shooters, asteroids and a boss
- **Combo multiplier** (up to x8) for kills, reset when the timer lapses
- **Shards** magnet toward you and score points; hull cells heal, overcharge triples your fire
- **Dash** with cooldown, invulnerability frames on hit, synth WebAudio SFX
- Best score saved in the browser (localStorage)

---

<sub>Entered on [make.fun](https://make.fun/?ref=3cnb50c1&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · best-game-01</sub>
