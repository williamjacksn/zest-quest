import { createCanvas } from '@napi-rs/canvas';
import { writeFile, mkdir } from 'node:fs/promises';
import { Renderer } from '../src/renderer.js';
import { Game } from '../src/core.js';
import { WORLDS } from '../src/data.js';
import { CABIN, SHIP_STATIONS } from '../src/ship.js';
const directory = 'docs/previews';
await mkdir(directory, { recursive: true });
globalThis.devicePixelRatio = 1;
const positions = [
  [1220, 444],
  [1010, 399],
  [2310, 329],
  [2430, 444],
  [1760, 299],
  [2310, 404],
  [2440, 420],
  [2340, 439],
  [2700, 399],
];
for (const [w, h, label] of [
  [1440, 720, 'desktop'],
  [390, 650, 'mobile'],
  [844, 290, 'landscape'],
]) {
  const canvas = createCanvas(w, h);
  canvas.getBoundingClientRect = () => ({ width: w, height: h });
  const renderer = new Renderer(canvas, { createCanvas });
  renderer.reduced = true;
  renderer.demo(5);
  const exportFrame = () => {
    const display = createCanvas(w, h),
      context = display.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(canvas, 0, 0, w, h);
    return display.toBuffer('image/png');
  };
  await writeFile(`${directory}/title-${label}.png`, exportFrame());
  for (const [time, phase] of [
    [1.4, 'descent'],
    [3.1, 'touchdown'],
    [4.1, 'hatch'],
    [5.4, 'walk'],
    [7.3, 'handoff'],
  ]) {
    const game = new Game({ seed: 457 });
    game.beginLanding();
    game.updateLanding(time);
    renderer.reduced = false;
    renderer.snap = true;
    renderer.game(game, time, 1 / 60);
    await writeFile(`${directory}/landing-${phase}-${label}.png`, exportFrame());
  }
  renderer.reduced = true;
  for (const world of [6, 7]) {
    const game = new Game({ seed: 457 });
    game.world = world;
    game.loadWorld();
    renderer.snap = true;
    renderer.game(game, 5, 1 / 60);
    await writeFile(`${directory}/world-${world + 1}-arrival-${label}.png`, exportFrame());
  }
  for (const [name, x, installed] of [
    ['workshop', 400, false],
    ['guidance', 800, true],
    ['airlock', CABIN.airlock - 60, true],
  ]) {
    const game = new Game({ seed: 457 });
    game.shipReady = true;
    game.completeWorld();
    if (installed) {
      game.player.x = SHIP_STATIONS[0].x;
      game.chooseUpgrade(SHIP_STATIONS[0].upgrade);
    }
    game.player.x = x;
    renderer.snap = true;
    renderer.game(game, 5, 1 / 60);
    await writeFile(`${directory}/ship-${name}-${label}.png`, exportFrame());
  }
  for (let world = 0; world < WORLDS.length; world++) {
    const game = new Game({ seed: 457 });
    game.world = world;
    game.loadWorld();
    game.time = 1.7;
    game.updateTerrain(0);
    [game.player.x, game.player.y] = positions[world];
    game.player.invincible = 0;
    game.player.grounded = true;
    renderer.snap = true;
    renderer.game(game, 5, 1 / 60);
    await writeFile(`${directory}/world-${world + 1}-${label}.png`, exportFrame());
    // Inspect the new middle chapter and its second core, beyond the original opening.
    const core = game.nodes[1];
    game.player.x = core.x - 25;
    game.player.y = core.y + 24;
    renderer.snap = true;
    renderer.game(game, 5, 1 / 60);
    await writeFile(`${directory}/extended-world-${world + 1}-${label}.png`, exportFrame());
  }
  if (label === 'desktop') {
    for (const [world, x, y, name] of [
      [1, 1060, 399, 'active-laser'],
      [5, 1730, 594, 'seed-press'],
      [7, 2420, 500, 'active-vent'],
      [8, 8360, 599, 'rootheart-and-ship'],
    ]) {
      const game = new Game({ seed: 457 });
      game.world = world;
      game.loadWorld();
      game.time = 0.15;
      game.updateTerrain(0);
      game.player.x = x;
      game.player.y = y;
      game.player.invincible = 0;
      if (world === 8) {
        game.bossSpawned = true;
        game.spawnEnemy('boss', game.level.boss.x, game.level.boss.y);
      }
      renderer.snap = true;
      renderer.game(game, 5, 1 / 60);
      await writeFile(`${directory}/${name}.png`, exportFrame());
    }
  }
}
console.log(
  'Rendered the ship interior, first landing, all nine stages, and the title at desktop, phone, and landscape dimensions (canvas only).',
);
