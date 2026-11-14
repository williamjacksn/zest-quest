// Offline DOM and canvas integration checks. No browser or network is used.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import { createCanvas } from '@napi-rs/canvas';
import { CABIN, SHIP_STATIONS } from '../src/ship.js';
const { window, document } = parseHTML(
  await readFile(new URL('../index.html', import.meta.url), 'utf8'),
);
const store = new Map(),
  raf = [];
let now = performance.now();
Object.defineProperty(document, 'activeElement', { value: document.body, writable: true });
window.HTMLElement.prototype.focus = function () {
  document.activeElement = this;
};
const nativeCanvases = new WeakMap();
window.HTMLCanvasElement.prototype.getContext = function () {
  if (!nativeCanvases.has(this)) nativeCanvases.set(this, createCanvas(1440, 720));
  return nativeCanvases.get(this).getContext('2d');
};
window.HTMLElement.prototype.getBoundingClientRect = () => ({
  x: 0,
  y: 0,
  left: 0,
  top: 0,
  width: 1440,
  height: 720,
});
class FakeAudio {
  constructor() {
    this.volume = 1;
    this.paused = true;
  }
  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}
Object.assign(globalThis, {
  window,
  document,
  Audio: FakeAudio,
  HTMLInputElement: window.HTMLInputElement,
  devicePixelRatio: 1,
  OffscreenCanvas: class {
    constructor(w, h) {
      return createCanvas(w, h);
    }
  },
  location: { search: '?test=1' },
  matchMedia: () => ({ matches: false }),
  localStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
  requestAnimationFrame: (callback) => raf.push(callback),
  ResizeObserver: class {
    observe() {}
  },
});
await import('../src/game.js');
const $ = (id) => document.getElementById(id);
const visible = (id) => !$(id).classList.contains('hidden');
function frames(count = 1) {
  for (let i = 0; i < count; i++) {
    now += 1000 / 60;
    const callbacks = raf.splice(0);
    for (const cb of callbacks) cb(now);
  }
}
function key(type, code) {
  const event = new window.Event(type, { bubbles: true, cancelable: true });
  event.code = code;
  event.repeat = false;
  document.dispatchEvent(event);
}
after(() => {
  clearInterval(window.__zest.audio.fade);
});

test('title, briefing, and all ten soundtrack entries are connected', () => {
  assert.ok(visible('title-screen'));
  frames();
  $('how-button').click();
  frames();
  assert.ok(visible('briefing-panel'));
  assert.equal($('track-list').children.length, 10);
  $('briefing-close').click();
  assert.ok(!visible('overlay'));
  $('soundtrack-button').click();
  assert.ok(visible('soundtrack-drawer'));
  $('track-list').children[9].click();
  assert.equal(window.__zest.audio.index, 9);
  $('close-soundtrack').click();
  assert.ok(!visible('soundtrack-drawer'));
});

test('first landing supports pausing, soundtrack browsing, and a clean keyboard skip', () => {
  $('launch-button').click();
  frames();
  const game = window.__zest.game;
  assert.equal(game.state, 'landing');
  assert.ok(visible('landing-cutscene'));
  assert.ok(!visible('game-hud'));
  assert.equal(document.activeElement, $('skip-landing'));
  key('keydown', 'KeyD');
  frames(20);
  key('keydown', 'Escape');
  const time = game.landing.time;
  frames(20);
  assert.equal(game.landing.time, time);
  assert.ok(visible('pause-panel'));
  $('resume-button').click();
  $('soundtrack-button').click();
  frames(20);
  assert.equal(game.landing.time, time);
  $('close-soundtrack').click();
  frames();
  assert.ok(game.landing.time > time);
  key('keydown', 'Space');
  assert.equal(game.state, 'playing');
  assert.ok(!visible('landing-cutscene'));
  assert.ok(visible('game-hud'));
  frames();
  assert.equal(game.player.vx, 0);
  assert.equal(game.player.vy, 0);
  key('keyup', 'Space');
  key('keyup', 'KeyD');
  key('keydown', 'Escape');
  $('quit-button').click();
});

test('launch, movement, dash, pulse, pause, focus trap, and resume work together', () => {
  $('launch-button').click();
  frames(450);
  assert.ok(visible('game-hud'));
  assert.equal($('sample-pips').children.length, 5);
  assert.match($('jump-status').textContent, /^FUEL \d+%$/);
  assert.ok(!visible('title-screen'));
  const game = window.__zest.game;
  const start = game.player.x;
  key('keydown', 'KeyD');
  frames(30);
  key('keyup', 'KeyD');
  assert.ok(game.player.x > start + 60);
  assert.match($('objective').textContent, /Seed cores 0\/5/);
  key('keydown', 'Space');
  frames();
  key('keyup', 'Space');
  assert.ok(game.player.vy < 0);
  key('keydown', 'ShiftLeft');
  frames();
  key('keyup', 'ShiftLeft');
  assert.ok(game.player.dashCd > 0);
  key('keydown', 'KeyE');
  frames();
  key('keyup', 'KeyE');
  assert.ok(game.player.pulseCd > 0);
  key('keydown', 'Escape');
  frames();
  assert.ok(visible('pause-panel'));
  assert.equal(window.__zest.paused, true);
  const time = game.time;
  frames(20);
  assert.equal(game.time, time);
  $('quit-button').focus();
  key('keydown', 'Tab');
  assert.equal(document.activeElement, $('music-volume'));
  $('resume-button').click();
  frames();
  assert.equal(window.__zest.paused, false);
  assert.ok(game.time > time);
});

test('settings persist and soundtrack browsing suspends the expedition', () => {
  key('keydown', 'Escape');
  $('assist-toggle').checked = true;
  $('assist-toggle').dispatchEvent(new window.Event('change'));
  assert.equal(window.__zest.game.assist, true);
  $('motion-toggle').checked = true;
  $('motion-toggle').dispatchEvent(new window.Event('change'));
  assert.ok(document.body.classList.contains('reduced-motion'));
  $('music-volume').value = '30';
  $('music-volume').dispatchEvent(new window.Event('input'));
  assert.equal(window.__zest.audio.volume, 0.3);
  $('resume-button').click();
  $('soundtrack-button').click();
  const time = window.__zest.game.time;
  frames(20);
  assert.equal(window.__zest.game.time, time);
  key('keydown', 'Escape');
  frames();
  assert.ok(window.__zest.game.time > time);
  assert.equal(window.__zest.audio.index, 1);
});

test('boarding, walking, E interactions, upgrades, and airlock travel stay in sync', () => {
  const game = window.__zest.game;
  game.player.x = game.level.exit.x;
  game.player.y = 599;
  game.player.vx = game.player.vy = 0;
  game.player.dash = 0;
  game.nodes.forEach((n) => (n.done = true));
  game.scanned = game.nodes.length;
  frames(85);
  assert.equal(game.state, 'ship');
  assert.ok(document.body.classList.contains('aboard-ship'));
  assert.ok(visible('ship-hud'));
  assert.ok(!visible('overlay'));
  assert.equal(window.__zest.audio.index, 8);
  const time = game.totalTime;
  key('keydown', 'KeyD');
  frames(36);
  key('keyup', 'KeyD');
  assert.ok(game.player.x > CABIN.start + 80);
  assert.equal(game.totalTime, time);
  key('keydown', 'KeyE');
  key('keyup', 'KeyE');
  frames();
  assert.ok(visible('upgrade-panel'));
  assert.equal($('upgrade-choices').children.length, 1);
  assert.equal($('upgrade-choices').children[0].dataset.upgrade, 'rapid');
  assert.equal($('route-map').children.length, 9);
  const x = game.player.x;
  frames(20);
  assert.equal(game.player.x, x);
  $('upgrade-cancel').click();
  assert.equal(game.upgrades.length, 0);
  assert.ok(!visible('overlay'));
  for (const station of SHIP_STATIONS) {
    game.player.x = station.x;
    key('keydown', 'KeyE');
    key('keyup', 'KeyE');
    assert.equal($('upgrade-choices').children[0].dataset.upgrade, station.upgrade);
    key('keydown', 'Escape');
    assert.ok(!visible('overlay'));
    assert.equal(game.upgrades.length, 0);
  }
  game.player.x = SHIP_STATIONS[0].x;
  key('keydown', 'KeyE');
  key('keyup', 'KeyE');
  const fireRate = game.player.fireRate;
  $('upgrade-choices').children[0].click();
  assert.equal(game.state, 'ship');
  assert.equal(game.world, 0);
  assert.equal(game.ship.installed, 'rapid');
  assert.ok(game.player.fireRate < fireRate);
  assert.ok(!visible('overlay'));
  assert.match($('ship-status').textContent, /yellow arrows.*Airlock/);
  assert.ok(!visible('travel-panel'));
  game.player.x = SHIP_STATIONS[1].x;
  key('keydown', 'KeyE');
  key('keyup', 'KeyE');
  assert.ok(!visible('overlay'));
  assert.equal(game.upgrades.length, 1);
  key('keydown', 'Escape');
  const cabinTime = game.ship.time;
  frames(20);
  assert.equal(game.ship.time, cabinTime);
  $('resume-button').click();
  $('soundtrack-button').click();
  frames(20);
  assert.equal(game.ship.time, cabinTime);
  $('close-soundtrack').click();
  game.player.x = CABIN.airlock;
  key('keydown', 'KeyE');
  key('keyup', 'KeyE');
  assert.equal(game.state, 'travel');
  assert.ok(visible('travel-panel'));
  assert.equal(window.__zest.audio.index, 8);
  $('land-button').click();
  frames();
  assert.equal(game.world, 1);
  assert.equal(game.state, 'playing');
  assert.ok(!visible('overlay'));
  assert.ok(!document.body.classList.contains('aboard-ship'));
  assert.equal(game.ship, null);
  assert.equal($('world-name').textContent, 'The Vessy Works');
  assert.equal(window.__zest.audio.index, 2);
});

test('loss, retry, victory, high score, and return to title have usable exits', () => {
  let game = window.__zest.game;
  game.player.invincible = 0;
  game.damagePlayer(999);
  frames();
  assert.ok(visible('end-panel'));
  assert.equal(game.state, 'lost');
  assert.equal(window.__zest.audio.index, 2);
  $('retry-button').click();
  frames();
  game = window.__zest.game;
  assert.equal(game.world, 1);
  assert.equal(game.state, 'playing');
  assert.ok(!visible('overlay'));
  game.world = 8;
  game.specimens = 45;
  game.score = 4570;
  game.shipReady = true;
  const finalScore = game.score + 600 + Math.round(game.player.hp * 2);
  game.completeWorld();
  frames();
  assert.equal(game.state, 'won');
  assert.equal($('end-title').textContent, 'You found home.');
  assert.equal($('end-samples').textContent, '45/45');
  assert.equal(window.__zest.audio.index, 9);
  assert.equal(store.get('zest:best-platformer'), String(finalScore));
  $('home-button').click();
  frames();
  assert.equal(window.__zest.game, null);
  assert.ok(visible('title-screen'));
  assert.ok(!visible('game-hud'));
  assert.equal(window.__zest.audio.index, 0);
});

test('stage tracks survive boss events and jukebox browsing; every cabin plays Orange You Glad', () => {
  $('launch-button').click();
  $('skip-landing').click();
  frames();
  for (let world = 0; world < 9; world++) {
    const game = window.__zest.game;
    assert.equal(game.world, world);
    assert.equal(window.__zest.audio.index, world + 1);
    window.__zest.event('boss');
    assert.equal(window.__zest.audio.index, world + 1);
    $('soundtrack-button').click();
    $('track-list').children[0].click();
    $('close-soundtrack').click();
    assert.equal(window.__zest.audio.index, world + 1);
    game.shipReady = true;
    game.completeWorld();
    frames();
    if (world < 8) {
      assert.equal(window.__zest.audio.index, 8);
      assert.equal(game.state, 'ship');
      $('soundtrack-button').click();
      $('track-list').children[0].click();
      $('close-soundtrack').click();
      assert.equal(window.__zest.audio.index, 8);
      game.player.x = SHIP_STATIONS[0].x;
      key('keydown', 'KeyE');
      key('keyup', 'KeyE');
      $('upgrade-choices').children[0].click();
      game.player.x = CABIN.airlock;
      key('keydown', 'KeyE');
      key('keyup', 'KeyE');
      $('land-button').click();
      frames();
    }
  }
  assert.equal(window.__zest.game.state, 'won');
  assert.equal(window.__zest.audio.index, 9);
  $('home-button').click();
  frames();
});
