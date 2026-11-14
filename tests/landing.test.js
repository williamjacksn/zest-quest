import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/core.js';
import { LANDING, landingFrame } from '../src/landing.js';

test('first landing stages the descent, hatch, and walk before starting the level', () => {
  const events = [],
    game = new Game({ emit: (kind) => events.push(kind) });
  assert.ok(game.beginLanding());
  const enemies = structuredClone(game.enemies),
    health = game.player.hp;
  for (let i = 0; i < 100; i++)
    game.step(1 / 60, { x: 1, jump: true, dash: true, pulse: true, aim: { x: 400, y: 500 } });
  assert.equal(game.state, 'landing');
  assert.equal(game.totalTime, 0);
  assert.equal(game.time, 0);
  assert.equal(game.player.hp, health);
  assert.equal(game.score, 0);
  assert.equal(game.bullets.length, 0);
  assert.deepEqual(game.enemies, enemies);
  assert.equal(game.dash(), false);
  assert.equal(game.pulse(), false);
  assert.equal(game.damagePlayer(999, true), false);
  const airborne = landingFrame(game.landing.time, game.level.landing);
  assert.equal(airborne.visible, false);
  assert.equal(airborne.hatch, 0);
  assert.ok(airborne.shipY < landingFrame(LANDING.touchdown, game.level.landing).shipY);
  game.updateLanding(LANDING.walk - game.landing.time);
  assert.equal(landingFrame(game.landing.time, game.level.landing).hatch, 1);
  game.step(0.05, { x: -1, jump: true });
  assert.ok(game.player.vx > 0, 'Vessy walks out under cutscene control');
  assert.ok(game.player.x > game.level.landing.x);
  assert.equal(game.time, 0);
  while (game.state === 'landing') game.step(1 / 60, { jump: true, dash: true });
  assert.equal(game.state, 'playing');
  assert.equal(game.player.x, game.level.landing.walkTo);
  assert.equal(game.player.y, 599);
  assert.equal(game.player.vx, 0);
  assert.equal(game.player.invincible, 1.5);
  assert.equal(game.time, 0);
  assert.equal(events.filter((kind) => kind === 'landed').length, 1);
  game.step(1 / 60, { x: 1 });
  assert.ok(game.time > 0);
  assert.ok(game.player.x > game.level.landing.walkTo);
});

test('skipping any part of the arrival produces the same safe gameplay handoff', () => {
  for (const time of [0, 1.5, 3.8, 5.2, 7]) {
    const game = new Game();
    game.beginLanding();
    game.updateLanding(time);
    assert.ok(game.finishLanding());
    assert.equal(game.state, 'playing');
    assert.equal(game.landing, null);
    assert.equal(game.player.x, 265);
    assert.equal(game.player.y, 599);
    assert.equal(game.player.vx, 0);
    assert.equal(game.totalTime, 0);
    assert.equal(game.finishLanding(), false);
    assert.equal(game.beginLanding(), false);
  }
});

test('later worlds and first-world retries do not replay the arrival', () => {
  const game = new Game();
  game.beginLanding();
  game.finishLanding();
  game.state = 'lost';
  assert.ok(game.retryWorld());
  assert.equal(game.state, 'playing');
  assert.equal(game.landing, null);
  assert.equal(game.beginLanding(), false);
  for (let world = 1; world < 9; world++) {
    game.world = world;
    game.loadWorld();
    assert.equal(game.state, 'playing');
    assert.equal(game.level.landing, undefined);
    assert.equal(game.landing, null);
    assert.equal(game.beginLanding(), false);
  }
});
