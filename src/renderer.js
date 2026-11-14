import { clamp, distance, seededRandom } from './core.js';
import { WORLDS } from './data.js';
import { PixelArt } from './pixel-art.js';
import { LANDING, landingFrame } from './landing.js';
import { drawShipInterior } from './ship-renderer.js';
const TAU = Math.PI * 2;
export class Renderer {
  constructor(canvas, { createCanvas } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.art = new PixelArt(this.ctx, (w, h) => {
      if (createCanvas) return createCanvas(w, h);
      if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
      const image = canvas.ownerDocument.createElement('canvas');
      image.width = w;
      image.height = h;
      return image;
    });
    this.w = 1;
    this.h = 1;
    this.camera = { x: 0, y: 360 };
    this.shake = 0;
    this.reduced = false;
    const random = seededRandom(457);
    this.stars = Array.from({ length: 160 }, () => ({
      x: random(),
      y: random(),
      r: 0.3 + random() * 1.3,
      phase: random() * TAU,
    }));
    this.resize();
  }
  resize() {
    const box = this.canvas.getBoundingClientRect();
    this.w = box.width;
    this.h = box.height;
    this.pixelScale = 2;
    // Keep camera/input coordinates in CSS pixels while painting a smaller backing canvas.
    this.dpr = 1 / this.pixelScale;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }
  circle(x, y, r, fill, stroke, width = 1) {
    const c = this.ctx;
    c.beginPath();
    c.arc(x, y, Math.max(0.01, r), 0, TAU);
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = width;
      c.stroke();
    }
  }
  line(x, y, x2, y2, color, width = 1) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x2, y2);
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
  }
  text(text, x, y, color = '#a4b4c8', size = 9, align = 'center') {
    this.art.label(text, x, y, color, size, align);
  }
  star(x, y, r, points = 5, color = '#d9f67e', rotation = 0, inner = 0.5) {
    const c = this.ctx;
    c.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const a = (i / (points * 2)) * TAU + rotation,
        rr = i % 2 ? r * inner : r;
      i
        ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
        : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
    c.fillStyle = color;
    c.fill();
  }
  box(x, y, w, h, color, r = 5) {
    const c = this.ctx;
    c.fillStyle = color;
    const corner = r > 3 ? 2 : 0;
    c.fillRect(Math.round(x) + corner, Math.round(y), Math.max(1, w - corner * 2), h);
    if (corner) c.fillRect(Math.round(x), Math.round(y) + corner, w, Math.max(1, h - corner * 2));
  }
  start() {
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.globalAlpha = 1;
    c.fillStyle = '#101621';
    c.fillRect(0, 0, this.w, this.h);
  }
  background(t) {
    const c = this.ctx;
    for (const s of this.stars) {
      const x = Math.floor((s.x * this.w) / 2) * 2,
        y = Math.floor((s.y * this.h) / 2) * 2;
      c.globalAlpha = 0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.4 + s.phase));
      c.fillStyle = s.phase > 3 ? '#a6c5cd' : '#e0d5b9';
      c.fillRect(x, y, s.r > 1.1 ? 4 : 2, 2);
      if (s.r > 1.4) {
        c.fillRect(x + 2, y - 2, 2, 6);
      }
    }
    c.globalAlpha = 1;
  }
  demo(t) {
    this.start();
    const c = this.ctx,
      w = this.w,
      h = this.h,
      mobile = w < 700;
    this.background(t);
    const x = w * (mobile ? 0.93 : 0.76),
      y = h * (mobile ? 0.66 : 0.45),
      r = Math.min(w * 0.2, h * 0.35);
    c.save();
    c.translate(x, y);
    c.rotate(-0.3);
    for (const scale of [1.2, 1.65, 2.05]) {
      c.beginPath();
      c.ellipse(0, 0, r * scale, r * 0.53 * scale, 0, 0, TAU);
      c.strokeStyle = '#7a938a35';
      c.lineWidth = 2;
      c.stroke();
    }
    c.restore();
    this.art.sprite(this.art.planet(true), x + r * 0.2, y - r * 0.62, (r * 1.6) / 160);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + t * 0.025,
        ox = x + Math.cos(a) * r * 1.65,
        oy = y + Math.sin(a) * r * 0.85;
      this.circle(ox, oy, 5, i === 0 ? '#d9f67e' : '#7da2a3');
      this.circle(ox, oy, 10, null, '#a6c5c544', 2);
      if (!mobile) this.text(String(i + 2).padStart(2, '0'), ox, oy + 27, '#95a6aa', 8);
    }
    c.save();
    c.translate(
      x - r * 0.19,
      y + r * 0.35 + (this.reduced ? 0 : Math.round(Math.sin(t * 1.3) * 4) * 2),
    );
    c.scale(mobile ? 2.7 : 4, mobile ? 2.7 : 4);
    this.robot(0, 0, t, 0);
    c.restore();
    this.art.sprite(this.art.ship(), x - r * 1.15, y + r * 0.72, 0.8, true);
    if (!mobile) {
      this.text('NINE WORLDS . ONE WAY HOME', w * 0.79, h * 0.09, '#a3b99a', 8);
      this.text('0457', w * 0.91, h * 0.85, '#677888', 26);
    }
  }
  robot(x, y, t, angle = 0, dashing = false, flash = false, player = null) {
    this.art.robot(x, y, t, angle, dashing, flash, player);
  }
  scenery(game, t) {
    this.worldData = WORLDS[game.world];
    this.art.scenery(this, t);
  }
  platform(f, world, t) {
    this.art.platform(f, world, t);
  }
  environment(h, world, t) {
    this.art.environment(h, world, t);
  }
  enemy(e, t) {
    this.art.drawEnemy(e, t);
  }
  landingShip(site, frame, time) {
    const c = this.ctx,
      airborne = time < LANDING.touchdown,
      height = site.y - 32 * 2.3 - frame.shipY;
    c.save();
    c.globalAlpha = 0.12 + 0.2 * (1 - clamp(height / 410, 0, 1));
    c.fillStyle = '#101621';
    c.beginPath();
    c.ellipse(site.x, site.y - 2, 48 + height * 0.04, 6, 0, 0, TAU);
    c.fill();
    c.restore();
    if (airborne) {
      const flame =
        (this.reduced ? 40 : 40 + Math.sin(time * 42) * 9) *
        clamp((LANDING.touchdown - time) / 0.5, 0, 1);
      c.fillStyle = '#edac7c';
      c.beginPath();
      c.moveTo(frame.shipX - 10, frame.shipY + 52);
      c.lineTo(frame.shipX, frame.shipY + 60 + flame);
      c.lineTo(frame.shipX + 10, frame.shipY + 52);
      c.fill();
      this.box(frame.shipX - 4, frame.shipY + 52, 8, flame * 0.6, '#fff1b4', 0);
    }
    if (!this.reduced && time > 2.2 && time < 3.8) {
      const spread = (time - 2.2) / 1.6;
      c.save();
      c.globalAlpha = Math.sin(spread * Math.PI) * 0.5;
      for (let i = 0; i < 12; i++) {
        const direction = i % 2 ? 1 : -1;
        this.box(
          site.x + direction * (20 + spread * (60 + i * 7)),
          site.y - 5 - Math.sin(spread * Math.PI) * (5 + (i % 4) * 7),
          10 + (i % 3) * 5,
          4 + (i % 3) * 2,
          '#b9a4a0',
          0,
        );
      }
      c.restore();
    }
    this.art.sprite(this.art.ship(frame.hatch), frame.shipX, frame.shipY, 2.3);
    if (frame.hatch > 0) {
      c.fillStyle = '#79918e';
      c.beginPath();
      c.moveTo(site.x + 12, site.y - 11);
      c.lineTo(site.x + 12 + 60 * frame.hatch, site.y - 2);
      c.lineTo(site.x + 12 + 60 * frame.hatch, site.y + 2);
      c.lineTo(site.x + 12, site.y - 6);
      c.fill();
      this.line(site.x + 15, site.y - 10, site.x + 12 + 60 * frame.hatch, site.y - 1, '#e9bc83', 2);
    }
  }
  game(game, t, dt) {
    if (game.ship) {
      drawShipInterior(this, game, dt);
      return;
    }
    this.start();
    const c = this.ctx,
      w = this.w,
      h = this.h,
      p = game.player,
      world = WORLDS[game.world],
      level = game.level,
      landing = game.state === 'landing',
      arrival =
        level.landing && game.landingPlayed
          ? landingFrame(landing ? game.landing.time : LANDING.end, level.landing)
          : null;
    this.zoom = clamp(h / 650, 0.65, 1.1) * (w < 550 ? 0.85 : 1);
    if (landing && !this.reduced) this.zoom *= 1 + 0.65 * (1 - arrival.release);
    const half = w / (2 * this.zoom),
      arrivalCenter = landing ? (level.landing.x + level.landing.walkTo) / 2 : 0,
      focus = landing ? arrivalCenter + (p.x + 125 - arrivalCenter) * arrival.release : p.x + 125,
      target = clamp(focus, half, Math.max(half, level.width - half));
    const smooth = 1 - Math.exp(-dt * 8);
    if (this.snap || this.activeGame !== game || this.activeWorld !== game.world) {
      this.camera = { x: target, y: clamp(p.y - (h / this.zoom) * 0.18, 230, 560) };
      this.snap = false;
      this.activeGame = game;
      this.activeWorld = game.world;
    }
    this.camera.x += (target - this.camera.x) * smooth;
    this.camera.y += (clamp(p.y - (h / this.zoom) * 0.18, 230, 560) - this.camera.y) * smooth;
    this.shake = Math.max(0, this.shake - dt * 24);
    this.scenery(game, t);
    c.save();
    c.translate(
      w / 2 + (this.reduced ? 0 : (Math.random() - 0.5) * this.shake),
      h / 2 + (this.reduced ? 0 : (Math.random() - 0.5) * this.shake),
    );
    c.scale(this.zoom, this.zoom);
    c.translate(-this.camera.x, -this.camera.y);
    const visible = (f) => f.x + f.w > this.camera.x - half - 80 && f.x < this.camera.x + half + 80;
    if (level.water) {
      const q = level.water;
      this.box(q.x, q.y, q.w, q.h, '#72d6e31a', 0);
      this.line(q.x, q.y, q.x + q.w, q.y, '#9be7e67a', 3);
      for (const z of level.zones) {
        c.save();
        c.beginPath();
        c.rect(z.x, z.y, z.w, z.h);
        c.clip();
        for (let i = 0; i < 13; i++) {
          const xx = z.x + ((((t * z.wind * 0.6 + i * 83) % z.w) + z.w) % z.w),
            yy = z.y + 40 + ((i * 71) % z.h);
          this.line(xx, yy, xx + Math.sign(z.wind) * 35, yy, '#92dcde44', 2);
        }
        c.restore();
      }
    }
    for (const f of level.platforms) if (visible(f)) this.platform(f, world, t);
    for (const h of level.hazards) if (visible(h)) this.environment(h, world, t);
    for (const s of level.signs) {
      if (landing) continue;
      if (Math.abs(s.x - this.camera.x) > half + 150) continue;
      if (s.text === level.arrivalMessage) {
        // Bitmap glyphs stay at least two screen pixels wide, even on phones.
        const maxChars = Math.max(12, Math.min(24, Math.floor((w - 32) / 12))),
          lines = [];
        let line = '';
        for (const word of s.text.split(' ')) {
          if (line && line.length + word.length + 1 > maxChars) {
            lines.push(line);
            line = word;
          } else line += (line ? ' ' : '') + word;
        }
        if (line) lines.push(line);
        const x = clamp(
          s.x,
          this.camera.x - half + 16 / this.zoom,
          this.camera.x + half - (maxChars * 12 + 16) / this.zoom,
        );
        lines.forEach((text, i) =>
          this.text(
            text,
            x,
            s.y - ((lines.length - i - 1) * 22) / this.zoom,
            world.color + 'cc',
            8,
            'left',
          ),
        );
        continue;
      }
      this.line(s.x, s.y + 14, s.x, s.y + 34, world.color + '66', 1);
      this.text(s.text, s.x, s.y, world.color + 'cc', 8, 'left');
    }
    for (const cp of level.checkpoints)
      this.art.sprite(this.art.beacon(cp.active, Math.floor(t * 2) % 2), cp.x, cp.y - 24, 1.8);
    for (const z of level.zest)
      if (!z.done && Math.abs(z.x - this.camera.x) < half + 20)
        this.star(z.x, z.y + Math.sin(t * 3 + z.x) * 3, 5, 4, '#e7dc99', t, 0.4);
    for (const m of level.medkits)
      if (!m.done) this.art.sprite(this.art.pickup(true), m.x, m.y, 1.5);
    for (const n of game.nodes) {
      if (n.done) continue;
      this.circle(n.x, n.y, 29, world.color + '08', world.color + '33');
      this.art.sprite(
        this.art.core(world),
        n.x,
        n.y + (this.reduced ? 0 : Math.round(Math.sin(t * 2) * 2)),
        1.4,
      );
      this.text('SEED CORE', n.x, n.y - 39, world.color, 7);
    }
    const ex = level.exit;
    this.circle(
      ex.x,
      ex.y,
      65,
      game.shipReady ? world.color + '15' : '#ffffff04',
      game.shipReady ? world.color + '88' : '#ffffff19',
    );
    this.box(ex.x - 54, ex.y + 42, 108, 10, '#293f4e', 0);
    this.box(ex.x - 47, ex.y + 42, 94, 2, game.shipReady ? '#bbdd9d' : '#7b9299', 0);
    this.art.sprite(this.art.ship(), ex.x, ex.y - 8, 1.7);
    this.text(
      game.shipReady
        ? 'BOARD SHIP →'
        : game.scanned < game.nodes.length
          ? `${game.nodes.length - game.scanned} SEED CORES TO GO`
          : 'CLEAR ROOTHEART',
      ex.x,
      ex.y + 85,
      game.shipReady ? world.color : '#9aa6b8',
      9,
    );
    for (const item of game.pickups)
      this.art.sprite(this.art.pickup(item.kind === 'heal'), item.x, item.y, 1.1);
    for (const b of game.bullets) {
      this.line(b.x - b.vx * 0.017, b.y - b.vy * 0.017, b.x, b.y, '#d9f67e', 3);
      this.circle(b.x, b.y, 3, '#f0ffd6');
    }
    for (const shot of game.hazards) {
      this.circle(shot.x, shot.y, shot.r + 4, '#ed9dc01a');
      this.circle(shot.x, shot.y, shot.r, '#dd9bc6');
    }
    for (const e of game.enemies) this.enemy(e, t);
    if (arrival)
      this.landingShip(level.landing, arrival, landing ? game.landing.time : LANDING.end);
    c.globalAlpha =
      !landing && p.invincible > 0 && !this.reduced && Math.floor(t * 16) % 2 ? 0.55 : 1;
    if (!landing || arrival.visible) {
      c.save();
      if (landing) {
        c.beginPath();
        c.rect(level.landing.x - 12, level.landing.y - 80, 180, 90);
        c.clip();
      }
      this.robot(
        p.x,
        p.y,
        landing ? game.landing.time : t,
        p.aim ?? (p.face < 0 ? Math.PI : 0),
        p.dash > 0,
        false,
        p,
      );
      c.restore();
    }
    c.globalAlpha = 1;
    if (!p.grounded && p.airJumps > 0 && !p.inWater) {
      this.circle(p.x, p.y + 35, 3, world.color);
      this.circle(p.x, p.y + 35, 7, null, world.color + '44');
    }
    if (!landing && !p.inWater && game.thrustAvailable) {
      this.box(p.x - 22, p.y + 41, 44, 3, '#ffffff22', 1);
      this.box(p.x - 22, p.y + 41, (44 * p.fuel) / p.maxFuel, 3, '#ffd18b', 1);
    }
    for (const r of game.rings) {
      c.globalAlpha = r.life / r.max;
      this.circle(r.x, r.y, r.r * (1 - r.life / r.max), null, r.color, 3);
    }
    c.globalAlpha = 1;
    for (const particle of game.particles) {
      c.globalAlpha = clamp(particle.life / particle.max, 0, 1);
      this.circle(particle.x, particle.y, particle.r, particle.color);
    }
    c.globalAlpha = 1;
    for (const f of game.texts) {
      c.globalAlpha = clamp(f.life * 2, 0, 1);
      this.text(f.text, f.x, f.y, f.color, 10);
    }
    c.globalAlpha = 1;
    c.restore();
    if (landing) return;
    const next = game.nodes.find((n) => !n.done) || level.exit,
      sx = (next.x - this.camera.x) * this.zoom + w / 2,
      sy = (next.y - this.camera.y) * this.zoom + h / 2;
    if (sx < 40 || sx > w - 40 || sy < 45 || sy > h - 80) {
      const xx = clamp(sx, 70, w - 70),
        yy = clamp(sy, 150, h - 105);
      this.star(xx, yy, 8, 4, world.color, 0, 0.6);
      this.text(
        next === level.exit ? 'SHIP' : `SEED ${game.scanned + 1}/${game.nodes.length}`,
        xx,
        yy + 20,
        world.color,
        8,
      );
    }
    if (game.combo >= 3) this.text(`${game.combo} × CHAIN`, w / 2, h - 109, '#e2cf9b', 11);
  }
  screenToWorld(x, y) {
    return {
      x: (x - this.w / 2) / (this.zoom || 1) + this.camera.x,
      y: (y - this.h / 2) / (this.zoom || 1) + this.camera.y,
    };
  }
  minimap(canvas, game) {
    const c = canvas.getContext('2d'),
      w = canvas.width,
      h = canvas.height,
      s = (w - 12) / game.level.width;
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#101927';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#657a8b';
    for (const f of game.level.platforms)
      c.fillRect(6 + f.x * s, h * 0.1 + (f.y / 800) * h * 0.8, Math.max(2, f.w * s), 2);
    for (const n of game.nodes) {
      c.fillStyle = n.done ? '#466859' : WORLDS[game.world].color;
      c.fillRect(5 + n.x * s, (n.y / 800) * h * 0.8 + 4, 3, 3);
    }
    c.fillStyle = '#fff8e6';
    c.beginPath();
    c.arc(6 + game.player.x * s, (game.player.y / 800) * h * 0.8 + 4, 2.5, 0, TAU);
    c.fill();
  }
}
