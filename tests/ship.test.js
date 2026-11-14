import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core.js';
import { UPGRADES, WORLDS } from '../src/data.js';
import { CABIN, SHIP_STATIONS } from '../src/ship.js';

function board(world = 0, emit = () => {}) {
  const game = new Game({ emit });
  game.world = world;
  game.loadWorld();
  game.shipReady = true;
  game.completeWorld();
  return game;
}

test('every between-world stop opens a safe cabin; the final world ends the expedition', () => {
  for (let world = 0; world < WORLDS.length; world++) {
    const game = board(world);
    assert.equal(game.state, world === WORLDS.length - 1 ? 'won' : 'ship');
    if (game.state === 'won') {
      assert.equal(game.ship, null);
      continue;
    }
    const health = game.player.hp,
      time = game.totalTime,
      stageTime = game.time;
    for (let i = 0; i < 600; i++) game.step(1 / 60, { x: 1, jump: true, dash: true, pulse: true });
    assert.equal(game.player.hp, health);
    assert.equal(game.totalTime, time);
    assert.equal(game.time, stageTime);
    assert.equal(game.player.y, CABIN.floor - 21);
    assert.equal(game.player.x, CABIN.width - 50);
    assert.equal(game.damagePlayer(999, true), false);
    assert.equal(game.bullets.length, 0);
    assert.equal(game.pulse(), false);
    assert.equal(game.dash(), false);
    for (let i = 0; i < 600; i++) game.step(1 / 60, { x: -1 });
    assert.equal(game.player.x, 50);
    assert.equal(game.player.face, -1);
  }
});

test('each upgrade belongs to an object, requires proximity, and installs immediately exactly once', () => {
  assert.deepEqual(
    SHIP_STATIONS.map((station) => station.upgrade).sort(),
    UPGRADES.map((upgrade) => upgrade.id).sort(),
  );
  for (const station of SHIP_STATIONS) {
    const events = [],
      game = board(0, (kind, data) => events.push({ kind, data }));
    const before = structuredClone(game.player),
      expected = structuredClone(before);
    UPGRADES.find((upgrade) => upgrade.id === station.upgrade).apply(expected);
    assert.equal(game.interactShip(), false);
    assert.equal(game.chooseUpgrade(station.upgrade), false);
    game.player.x = station.x;
    assert.ok(game.interactShip());
    assert.equal(events.at(-1).kind, 'inspectUpgrade');
    assert.equal(events.at(-1).data.upgrade, station.upgrade);
    assert.equal(game.upgrades.length, 0, 'inspection alone does not install an upgrade');
    assert.ok(game.chooseUpgrade(station.upgrade));
    for (const stat of [
      'fireRate',
      'spread',
      'damage',
      'dashMax',
      'maxHp',
      'hp',
      'magnet',
      'healBonus',
    ])
      assert.equal(game.player[stat], expected[stat]);
    assert.equal(game.state, 'ship');
    assert.equal(game.world, 0);
    assert.equal(game.ship.installed, station.upgrade);
    assert.equal(game.chooseUpgrade(station.upgrade), false);
    assert.equal(game.interactShip(), false);
    assert.deepEqual(game.upgrades, [station.upgrade]);
  }
});

test('the airlock requires an upgrade, departs only nearby, and advances exactly one world', () => {
  const game = board();
  game.player.x = CABIN.airlock;
  assert.equal(game.interactShip(), false);
  assert.equal(game.state, 'ship');
  assert.equal(game.landNextWorld(), false);
  game.player.x = SHIP_STATIONS[0].x;
  game.chooseUpgrade('rapid');
  assert.equal(game.landNextWorld(), false);
  game.player.x = CABIN.airlock;
  assert.ok(game.interactShip());
  assert.equal(game.state, 'travel');
  assert.equal(game.interactShip(), false);
  assert.ok(game.landNextWorld());
  assert.equal(game.world, 1);
  assert.equal(game.state, 'playing');
  assert.equal(game.ship, null);
  assert.equal(game.landNextWorld(), false);
  assert.deepEqual(game.upgrades, ['rapid']);
  // The next stop allows a fresh choice while retaining the first upgrade.
  game.shipReady = true;
  game.completeWorld();
  assert.equal(game.ship.installed, null);
  game.player.x = SHIP_STATIONS[1].x;
  assert.ok(game.chooseUpgrade('spread'));
  assert.deepEqual(game.upgrades, ['rapid', 'spread']);
});
