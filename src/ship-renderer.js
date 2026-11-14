import { CABIN, SHIP_STATIONS } from './ship.js';
import { UPGRADES } from './data.js';

export function drawShipInterior(r, game, dt) {
  r.start();
  const c = r.ctx,
    p = game.player,
    ship = game.ship,
    t = r.reduced ? 0 : ship.time,
    target = game.shipTarget();
  r.zoom = Math.max(0.65, Math.min(1.15, r.h / 620));
  const half = r.w / (2 * r.zoom),
    focus = Math.max(half, Math.min(CABIN.width - half, p.x + 100)),
    cameraY = CABIN.floor - (r.h / r.zoom) * (r.h < 400 ? 0.24 : 0.18);
  if (r.snap || r.activeShip !== ship) {
    r.camera = { x: focus, y: cameraY };
    r.snap = false;
    r.activeShip = ship;
  }
  r.camera.x += (focus - r.camera.x) * (1 - Math.exp(-dt * 8));
  r.camera.y = cameraY;
  r.shake = 0;
  c.save();
  c.translate(r.w / 2, r.h / 2);
  c.scale(r.zoom, r.zoom);
  c.translate(-r.camera.x, -r.camera.y);
  const box = (x, y, w, h, color) => r.box(x, y, w, h, color, 0);
  // Continuous hull, ribbed walls, and a floor with enough room to wander.
  box(-1000, -800, CABIN.width + 2000, 1800, '#121d2d');
  box(28, 110, CABIN.width - 56, 400, '#233748');
  for (let x = 40; x < CABIN.width; x += 100) {
    box(x, 132, 94, 365, '#293e4e');
    box(x + 3, 135, 88, 2, '#3b5563');
    box(x + 3, 372, 88, 2, '#1b2c3c');
    box(x + 3, 472, 88, 18, '#1c2e40');
    for (const y of [142, 460]) box(x + 8, y, 3, 3, '#6d8a8f');
  }
  for (const x of [310, 710, 1110]) {
    box(x - 94, 182, 188, 132, '#111d30');
    box(x - 88, 188, 176, 120, '#60848b');
    box(x - 81, 195, 162, 106, '#111b31');
    for (let i = 0; i < 22; i++) {
      const xx = (i * 53 + t * 4) % 148;
      box(x - 74 + xx, 203 + ((i * 31) % 88), 2, 2, '#b3c6ce');
    }
    r.art.sprite(r.art.planet(false), x + 22, 247, 0.47);
    box(x - 84, 248, 168, 5, '#405e6d');
    box(x - 3, 191, 6, 112, '#405e6d');
    box(x - 96, 311, 192, 7, '#829c9a');
  }
  for (let x = 35; x < CABIN.width; x += 200) {
    box(x, 112, 13, 396, '#182b3d');
    box(x + 2, 114, 3, 392, '#4b6570');
    box(x + 32, 125, 122, 10, '#17283b');
    box(x + 39, 128, 108, 4, '#b6e5d2');
  }
  box(35, 329, CABIN.width - 70, 9, '#192e41');
  box(35, 331, CABIN.width - 70, 2, '#63888d');
  box(25, CABIN.floor, CABIN.width - 50, 150, '#17293c');
  box(25, CABIN.floor, CABIN.width - 50, 7, '#8da9a4');
  box(25, CABIN.floor + 7, CABIN.width - 50, 5, '#3b606a');
  for (let x = 35; x < CABIN.width - 30; x += 64) {
    box(x, 532, 60, 6, '#304858');
    box(x + 3, 545, 54, 46, '#203548');
    for (let i = 0; i < 5; i++) box(x + 8 + i * 9, 551, 3, 29, '#122338');
  }
  r.text('VES-0457 / THE LITTLE SHIP', 765, 165, '#a7c5c5', 12);
  // The bridge console and storage make the workshop feel lived in.
  box(58, 414, 80, 92, '#142638');
  box(63, 418, 70, 46, '#577d85');
  box(69, 424, 58, 32, '#192f43');
  r.text('HOME', 98, 437, '#b8dbb0', 7);
  for (let i = 0; i < 4; i++) box(70 + i * 14, 472, 7, 4, '#d9bc83');
  r.text('BRIDGE', 98, 394, '#8eacb4', 8);
  for (const station of SHIP_STATIONS) {
    const selected = station.upgrade === ship.installed,
      nearby = target === station,
      upgrade = UPGRADES.find((item) => item.id === station.upgrade);
    if (nearby && !ship.installed) {
      box(station.x - 58, 369, 116, 137, '#d9f67e0b');
      r.line(station.x - 58, 369, station.x + 58, 369, station.color, 2);
    }
    r.art.sprite(r.art.shipStation(station.upgrade), station.x, CABIN.floor - 64, 1.8);
    const words = station.name.toUpperCase().split(' ');
    r.text(words[0], station.x, 325, selected ? '#ffe36a' : station.color, 9);
    r.text(words.slice(1).join(' '), station.x, 349, selected ? '#ffe36a' : station.color, 9);
    if (r.zoom >= 0.85)
      r.text(
        selected ? 'INSTALLED' : upgrade.tag,
        station.x,
        372,
        selected ? '#ffe36a' : '#91aab3',
        7,
      );
    box(station.x - 26, CABIN.floor - 3, 52, 3, selected ? '#ffe36a' : '#68838a');
  }
  // The exit remains closed until an upgrade has been installed.
  const ax = CABIN.airlock,
    color = ship.installed ? '#ffe36a' : '#7b94a4';
  box(ax - 59, 323, 118, 187, '#111d30');
  box(ax - 53, 329, 106, 181, '#577681');
  box(ax - 44, 339, 88, 167, '#243b4d');
  box(ax - 40, 342, 37, 158, '#3d5666');
  box(ax + 3, 342, 37, 158, '#3d5666');
  box(ax - 29, 378, 58, 36, '#16293e');
  r.text(ship.installed ? 'READY' : 'LOCKED', ax, 394, color, 8);
  box(ax - 3, 424, 6, 48, color);
  box(ax - 55, 320, 110, 6, color);
  r.text('AIRLOCK', ax, 294, color, 14);
  if (ship.installed) {
    for (let x = 165; x < ax - 60; x += 100) {
      c.globalAlpha = r.reduced ? 1 : 0.7 + Math.sin(t * 4 - x * 0.01) * 0.25;
      r.line(x - 12, 497, x + 10, 497, '#ffe36a', 4);
      r.line(x + 2, 489, x + 10, 497, '#ffe36a', 4);
      r.line(x + 2, 505, x + 10, 497, '#ffe36a', 4);
    }
    c.globalAlpha = 1;
  }
  r.robot(p.x, p.y, t, 0, false, false, p);
  if (ship.installed && Math.abs(p.x - ax) > CABIN.reach) {
    const direction = Math.sign(ax - p.x),
      x = p.x + direction * 48;
    r.text(direction > 0 ? 'AIRLOCK >' : '< AIRLOCK', x + direction * 24, p.y - 64, '#ffe36a', 9);
    r.line(x, p.y - 40, x + direction * 24, p.y - 40, '#ffe36a', 3);
    r.line(x + direction * 16, p.y - 48, x + direction * 24, p.y - 40, '#ffe36a', 3);
    r.line(x + direction * 16, p.y - 32, x + direction * 24, p.y - 40, '#ffe36a', 3);
  }
  c.restore();
}
