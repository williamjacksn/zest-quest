import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, distance, seededRandom } from '../src/core.js';
import { WORLDS, TRACKS, UPGRADES } from '../src/data.js';
import { createLevel, TOTAL_CELLS, CORES_PER_WORLD } from '../src/levels.js';
import { reachableSurfaces } from '../tools/route-check.mjs';
import { CABIN, SHIP_STATIONS } from '../src/ship.js';
const frames = (g, n, input = {}) => {
  for (let i = 0; i < n; i++) g.step(1 / 60, input);
};
function fixture(world = 0) {
  const g = new Game({ seed: 457 });
  g.world = world;
  g.loadWorld();
  g.enemies = [];
  g.level.hazards = [];
  g.level.checkpoints = [];
  g.level.medkits = [];
  g.level.platforms = [
    {
      id: 0,
      x: 0,
      y: 620,
      w: 1000,
      h: 240,
      baseX: 0,
      baseY: 620,
      kind: 'ground',
      solid: true,
      dx: 0,
      dy: 0,
    },
  ];
  g.level.water = null;
  g.level.zones = [];
  Object.assign(g.player, {
    x: 100,
    y: 599,
    vx: 0,
    vy: 0,
    grounded: true,
    onPlatform: 0,
    invincible: 0,
  });
  return g;
}
const ledge = (extra = {}) => ({
  id: 1,
  x: 300,
  y: 480,
  w: 180,
  h: 22,
  baseX: 300,
  baseY: 480,
  kind: 'stone',
  oneWay: true,
  solid: true,
  dx: 0,
  dy: 0,
  crumble: 0,
  restore: 0,
  ...extra,
});

test('every soundtrack recording has exactly one permanent stage or menu role', () => {
  assert.equal(TRACKS.length, 10);
  assert.equal(WORLDS.length, 9);
  assert.deepEqual(
    WORLDS.map((w) => w.track),
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
  );
  assert.equal(CORES_PER_WORLD, 5);
  assert.equal(TOTAL_CELLS, 45);
  const layouts = new Set(),
    mechanics = new Set();
  for (let i = 0; i < 9; i++) {
    const l = createLevel(i);
    assert.ok(l.width >= 7600);
    assert.equal(l.width, l.baseWidth + 3200);
    assert.equal(l.cells.length, CORES_PER_WORLD);
    assert.ok(l.cells[0].x < l.width * 0.25 && l.cells.at(-1).x > l.width * 0.75);
    for (let n = 1; n < l.cells.length; n++) assert.ok(l.cells[n].x - l.cells[n - 1].x >= 600);
    assert.ok(l.exit.x > l.width - 250);
    for (const n of l.cells) assert.ok(n.x > 0 && n.x < l.width && n.y > 0 && n.y < 700);
    layouts.add(JSON.stringify(l.platforms.map((p) => [p.x, p.y, p.w])));
    mechanics.add(WORLDS[i].mechanic);
  }
  assert.equal(layouts.size, 9);
  assert.equal(mechanics.size, 9);
});

test('gravity lands on terrain and walking off an edge causes a fall', () => {
  const g = fixture();
  g.player.y = 400;
  g.player.grounded = false;
  frames(g, 50);
  assert.ok(g.player.grounded);
  assert.equal(g.player.y, 599);
  g.player.x = 990;
  frames(g, 25, { x: 1 });
  assert.ok(!g.player.grounded);
  assert.ok(g.player.y > 620);
});

test('double jump is available once in air, and landing refills it', () => {
  const g = fixture();
  g.step(1 / 60, { jump: true, jumpHeld: true });
  assert.ok(g.player.vy < 0);
  assert.equal(g.player.airJumps, 1);
  frames(g, 12, { jumpHeld: true });
  g.step(1 / 60, { jump: true, jumpHeld: true });
  assert.equal(g.player.airJumps, 0);
  frames(g, 5, { jumpHeld: true });
  const before = g.player.vy;
  g.step(1 / 60, { jump: true });
  assert.ok(g.player.vy > before);
  frames(g, 100);
  assert.ok(g.player.grounded);
  assert.equal(g.player.airJumps, 1);
});

test('coyote time allows a late edge jump and jump release shortens the arc', () => {
  const g = fixture();
  g.player.x = 1008;
  g.player.vx = 285;
  g.step(0.025, { x: 1 });
  assert.ok(!g.player.grounded);
  g.step(1 / 60, { jump: true, jumpHeld: true });
  assert.equal(g.player.airJumps, 1);
  assert.ok(g.player.vy < -500);
  const high = fixture(),
    low = fixture();
  high.step(1 / 60, { jump: true, jumpHeld: true });
  low.step(1 / 60, { jump: true });
  frames(high, 15, { jumpHeld: true });
  frames(low, 15);
  assert.ok(high.player.y < low.player.y - 20);
});

test('one-way ledges permit upward passage, catch landings, and allow dropping through', () => {
  const g = fixture();
  g.level.platforms.push(ledge({ x: 50, baseX: 50, w: 200, y: 515, baseY: 515 }));
  g.step(1 / 60, { jump: true, jumpHeld: true });
  frames(g, 25, { jumpHeld: true });
  assert.ok(g.player.y < 494);
  for (let i = 0; i < 120 && !g.player.grounded; i++) frames(g, 1);
  assert.equal(g.player.y, 494);
  assert.equal(g.player.onPlatform, 1);
  g.step(1 / 60, { down: true });
  frames(g, 30);
  assert.equal(g.player.y, 599);
});

test('dash cannot tunnel through a wall and briefly protects against damage', () => {
  const g = fixture();
  g.level.platforms.push(
    ledge({ x: 185, baseX: 185, y: 300, baseY: 300, w: 25, h: 320, oneWay: false }),
  );
  assert.ok(g.dash(1));
  g.damagePlayer(30);
  assert.equal(g.player.hp, 100);
  g.step(0.05, { x: 1 });
  g.step(0.05, { x: 1 });
  assert.ok(g.player.x <= 171);
  assert.equal(g.dash(1), false);
});

test('moving platforms carry their grounded passenger', () => {
  const g = fixture();
  const f = ledge({ kind: 'moving', axis: 'x', range: 90, period: 3 });
  g.level.platforms.push(f);
  Object.assign(g.player, { x: 350, y: 459, onPlatform: 1 });
  const x = g.player.x;
  frames(g, 12);
  assert.ok(g.player.x > x + 25);
  assert.equal(g.player.onPlatform, 1);
  assert.equal(g.player.y, 459);
});

test('crumbling roots warn, disappear, and regenerate without trapping a run', () => {
  const g = fixture();
  const f = ledge({ kind: 'crumble' });
  g.level.platforms.push(f);
  Object.assign(g.player, { x: 350, y: 459, onPlatform: 1 });
  frames(g, 45);
  assert.equal(f.solid, false);
  g.player.x = 100;
  frames(g, 190);
  assert.equal(f.solid, true);
});

test('jelly automatically launches high even when jump is not held', () => {
  const g = fixture(4);
  g.level.platforms.push(ledge({ kind: 'bounce' }));
  Object.assign(g.player, { x: 350, y: 450, grounded: false, vy: 140 });
  frames(g, 8);
  assert.ok(g.player.vy < -800);
  assert.equal(g.player.airJumps, 1);
  frames(g, 30);
  assert.ok(g.player.y < 210);
  const run = fixture(4);
  run.level.platforms.push(ledge({ kind: 'bounce', y: 600, baseY: 600 }));
  run.player.x = 285;
  frames(run, 15, { x: 1 });
  assert.ok(run.player.y < 540, 'running onto the raised lip also bounces');
});

test('all authored surfaces, core routes, and exits are reachable with base movement', () => {
  // Timed platforms are held solid, hazards/enemies excluded; cycle and combat tests are separate.
  // Underwater links use continuous swimming rather than a ballistic jump model.
  for (let world = 0; world < WORLDS.length; world++) {
    const { reachable, platforms, level } = reachableSurfaces(world);
    assert.equal(reachable.size, platforms.length, `unreachable terrain in world ${world + 1}`);
    for (const core of level.cells)
      assert.ok(
        platforms.some(
          (p) =>
            reachable.has(p.id) &&
            core.x >= p.x - 35 &&
            core.x <= p.x + p.w + 35 &&
            core.y < p.y &&
            p.y - core.y < 200,
        ),
      );
    assert.ok(
      platforms.some((p) => reachable.has(p.id) && level.exit.x > p.x && level.exit.x < p.x + p.w),
    );
  }
});

test('phase platforms become non-solid and restore according to their visible cycle', () => {
  const g = fixture(8);
  const f = ledge({ kind: 'phase', period: 4, phase: 0 });
  g.level.platforms.push(f);
  g.time = 2.7;
  g.updateTerrain(0);
  assert.ok(f.warning && f.solid);
  g.time = 3.3;
  g.updateTerrain(0);
  assert.equal(f.solid, false);
  g.time = 4.2;
  g.updateTerrain(0);
  assert.equal(f.solid, true);
});

test('lasers and vents telegraph before active phases, while crushers move physically', () => {
  const g = new Game();
  g.world = 1;
  g.loadWorld();
  const laser = g.level.hazards[0];
  g.time = laser.period - 0.25;
  g.updateTerrain(0);
  assert.ok(laser.warning && !laser.active);
  g.time = laser.period + 0.1;
  g.updateTerrain(0);
  assert.ok(laser.active);
  g.world = 5;
  g.loadWorld();
  const crusher = g.level.hazards[0];
  g.time = 0;
  g.updateTerrain(0);
  const top = crusher.y;
  g.time = crusher.period / 2;
  g.updateTerrain(0);
  assert.ok(crusher.y > top + 200);
});

test('underwater controls swim and currents push without directional input', () => {
  const g = fixture(6);
  g.level.platforms = [];
  g.level.water = { x: 0, y: 0, w: 1000, h: 850 };
  g.level.zones = [{ x: 0, y: 0, w: 1000, h: 850, wind: 110 }];
  g.player.y = 420;
  g.player.grounded = false;
  frames(g, 30, { jumpHeld: true });
  assert.ok(g.player.y < 380);
  assert.ok(g.player.x > 145);
  assert.ok(g.player.inWater);
  assert.equal(g.player.fuel, 1.4, 'swimming does not consume jet fuel');
  g.level.water = null;
  frames(g, 2, { jumpHeld: true });
  assert.equal(g.player.inWater, false);
  assert.ok(g.player.fuel < 1.4, 'thrust is available outside the water in Vitamin Sea');
});

test('thrust works in all nine worlds, consumes fuel, caps ascent, and recharges on landing', () => {
  for (let world = 0; world < WORLDS.length; world++) {
    const g = fixture(world);
    g.step(1 / 60, { jump: true, jumpHeld: true });
    frames(g, 35, { jumpHeld: true });
    assert.ok(g.player.fuel < 1, `thrust burns fuel in ${WORLDS[world].name}`);
    assert.ok(g.player.y >= 30);
    frames(g, 60, { jumpHeld: true });
    assert.equal(g.player.fuel, 0);
    assert.ok(g.player.y >= 30);
    Object.assign(g.player, { y: 400, vy: 0, grounded: false, onPlatform: null });
    g.step(1 / 60, { jumpHeld: true });
    assert.ok(g.player.vy > 0, 'an empty tank cannot keep the bot aloft');
    Object.assign(g.player, { x: 100, y: 599, vy: 0, grounded: true, onPlatform: 0 });
    frames(g, 20);
    assert.ok(g.player.fuel > 0.8);
    frames(g, 20);
    assert.equal(g.player.fuel, 1.4);
  }
});

test('conveyors carry a standing player and retain momentum during a jump', () => {
  const g = fixture(7);
  g.level.platforms[0].conveyor = 110;
  frames(g, 12);
  assert.ok(g.player.x > 120);
  g.step(1 / 60, { jump: true, jumpHeld: true });
  assert.ok(g.player.vx > 80);
  assert.ok(g.player.boostX > 90);
});

test('checkpoints repair once and pit recovery preserves collected cores', () => {
  const g = fixture();
  g.player.hp = 50;
  g.level.checkpoints = [{ x: 100, y: 599, active: false }];
  g.step(1 / 60);
  assert.equal(g.player.hp, 60);
  frames(g, 10);
  assert.equal(g.player.hp, 60);
  g.nodes[0].done = true;
  g.scanned = g.specimens = 1;
  g.player.y = 920;
  g.step(1 / 60);
  assert.equal(g.falls, 1);
  assert.equal(g.player.hp, 46);
  assert.equal(g.player.x, 100);
  assert.equal(g.scanned, 1);
  assert.ok(g.nodes[0].done);
});

test('cores collect on touch, award once, and lock the exit until all are collected', () => {
  const g = fixture();
  const n = g.nodes[0];
  n.x = 100;
  n.y = 580;
  frames(g, 2);
  assert.equal(g.scanned, 1);
  assert.equal(g.score, 250);
  frames(g, 2);
  assert.equal(g.score, 250);
  g.player.x = g.level.exit.x;
  g.player.y = 599;
  g.level.platforms[0].w = g.level.width;
  g.nodes.slice(0, 3).forEach((n) => (n.done = true));
  g.scanned = 3;
  frames(g, 35);
  assert.equal(g.state, 'playing');
  assert.equal(g.shipReady, false);
  g.nodes[3].done = true;
  g.scanned = 4;
  frames(g, 20);
  assert.equal(g.state, 'playing');
  assert.equal(g.shipReady, false);
  g.nodes.forEach((n) => (n.done = true));
  g.scanned = g.nodes.length;
  g.level.platforms = [{ ...g.level.platforms[0], w: g.level.width }];
  g.player.y = 599;
  frames(g, 35);
  assert.equal(g.state, 'ship');
});

test('stomping enemies bounces the bot; pulse clears shots and automatic blaster damages threats', () => {
  const g = fixture();
  const e = g.spawnEnemy('crawler', 100, 599);
  g.player.y = 570;
  g.player.vy = 200;
  g.player.grounded = false;
  g.moveEnemies(1 / 120);
  assert.ok(e.dead);
  assert.ok(g.player.vy < 0);
  const far = g.spawnEnemy('spitter', 260, 599);
  g.hazards = [{ x: 120, y: 580 }];
  assert.ok(g.pulse());
  assert.equal(g.hazards.length, 0);
  assert.ok(far.dead);
  assert.equal(g.pulse(), false);
  const target = g.spawnEnemy('spitter', 400, 599);
  frames(g, 100);
  assert.ok(target.hp < target.maxHp);
});

test('upgrades install aboard ship and airlock travel preserves them through stage retry', () => {
  const g = fixture();
  g.enterShip();
  g.player.x = SHIP_STATIONS.find((station) => station.upgrade === 'power').x;
  assert.equal(g.chooseUpgrade('missing'), false);
  assert.ok(g.chooseUpgrade('power'));
  assert.equal(g.world, 0);
  g.player.x = CABIN.airlock;
  assert.ok(g.interactShip());
  assert.ok(g.landNextWorld());
  assert.equal(g.world, 1);
  assert.ok(g.player.damage > 23);
  g.score += 100;
  g.specimens += 1;
  g.player.invincible = 0;
  g.damagePlayer(999);
  assert.equal(g.state, 'lost');
  assert.ok(g.retryWorld());
  assert.equal(g.world, 1);
  assert.equal(g.specimens, g.stageSpecimens);
  assert.equal(g.player.hp, g.player.maxHp);
  assert.deepEqual(g.upgrades, ['power']);
});

test('gentle mode halves environment damage and all upgrades improve their system', () => {
  const g = fixture();
  g.assist = true;
  g.damagePlayer(20);
  assert.equal(g.player.hp, 90);
  for (const u of UPGRADES) {
    const p = structuredClone(g.player);
    u.apply(p);
    assert.notDeepEqual(p, g.player);
  }
});

test('final habitat requires all five cores and the relocated Rootheart before extraction', () => {
  const g = fixture(8);
  g.player.x = 4250;
  g.step(1 / 60);
  assert.equal(g.bossSpawned, false, 'the old arena must not trigger the relocated boss');
  g.player.x = g.level.boss.x - 600;
  g.step(1 / 60);
  assert.ok(g.bossSpawned);
  assert.ok(!g.shipReady);
  g.nodes.forEach((n) => (n.done = true));
  g.scanned = g.nodes.length;
  g.step(1 / 60);
  assert.ok(!g.shipReady);
  g.hurtEnemy(
    g.enemies.find((e) => e.type === 'boss'),
    99999,
  );
  g.player.x = g.level.exit.x;
  g.player.y = 599;
  g.level.platforms[0].w = g.level.width;
  frames(g, 35);
  assert.equal(g.state, 'won');
});

test('long randomized traversal remains finite across every authored stage', () => {
  for (let world = 0; world < WORLDS.length; world++) {
    const g = new Game({ seed: 457 + world, assist: true }),
      random = seededRandom(world + 1);
    g.world = world;
    g.loadWorld();
    g.player.hp = g.player.maxHp = 100000;
    for (let i = 0; i < 5400; i++)
      g.step(1 / 60, {
        x: Math.sin(i * 0.009) > 0.2 ? 1 : -0.5,
        jump: random() < 0.025,
        jumpHeld: Math.sin(i * 0.02) > 0.1,
        dash: random() < 0.005,
        pulse: random() < 0.004,
      });
    assert.ok(
      Number.isFinite(g.player.x) && Number.isFinite(g.player.y) && Number.isFinite(g.score),
    );
    assert.ok(g.player.x >= 0 && g.player.x <= g.level.width);
    assert.ok(g.particles.length <= 450 && g.enemies.length < 20 && g.hazards.length < 100);
  }
});
