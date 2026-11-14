import { WORLDS, UPGRADES } from './data.js';
import { createLevel } from './levels.js';
import { LANDING, landingFrame } from './landing.js';
import { CABIN, SHIP_STATIONS } from './ship.js';
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const overlaps = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export function seededRandom(seed = 457) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const body = (p) => ({ x: p.x - 14, y: p.y - 21, w: 28, h: 42 });
export class Game {
  constructor({ seed = Date.now(), emit = () => {}, assist = false } = {}) {
    this.random = seededRandom(seed);
    this.emit = emit;
    this.assist = assist;
    this.state = 'playing';
    this.world = 0;
    this.totalTime = 0;
    this.score = 0;
    this.kills = 0;
    this.specimens = 0;
    this.upgrades = [];
    this.combo = 0;
    this.comboTime = 0;
    this.falls = 0;
    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 19,
      hp: 100,
      maxHp: 100,
      speed: 285,
      damage: 23,
      fireRate: 0.32,
      fireCd: 0,
      spread: 0,
      dash: 0,
      dashCd: 0,
      dashMax: 1.5,
      invincible: 1,
      pulseCd: 0,
      magnet: 42,
      healBonus: 0,
      face: 1,
      grounded: true,
      airJumps: 1,
      coyote: 0.12,
      jumpBuffer: 0,
      fuel: 1.4,
      maxFuel: 1.4,
      bounceBoost: 0,
      boostX: 0,
      drop: 0,
      onPlatform: null,
    };
    this.loadWorld();
  }
  loadWorld() {
    this.level = createLevel(this.world);
    this.landing = null;
    this.ship = null;
    this.time = 0;
    this.scanned = 0;
    this.nodes = this.level.cells;
    this.enemies = [];
    this.bullets = [];
    this.hazards = [];
    this.pickups = [];
    this.particles = [];
    this.texts = [];
    this.rings = [];
    this.extraction = 0;
    this.shipReady = false;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.stageScore = this.score;
    this.stageSpecimens = this.specimens;
    this.checkpoint = { ...this.level.start };
    const p = this.player;
    Object.assign(p, {
      ...this.level.start,
      vx: 0,
      vy: 0,
      dash: 0,
      dashCd: 0,
      pulseCd: 0,
      invincible: 1.5,
      grounded: true,
      airJumps: 1,
      coyote: 0.12,
      jumpBuffer: 0,
      drop: 0,
      onPlatform: 0,
      fuel: p.maxFuel,
      bounceBoost: 0,
      boostX: 0,
    });
    p.hp = Math.min(p.maxHp, p.hp + 30);
    this.level.enemies.forEach((e) => this.spawnEnemy(e.type, e.x, e.y, e.range));
    this.emit('world', WORLDS[this.world]);
  }
  get thrustAvailable() {
    return !this.level.thrustDisabled && !this.level.thrusterWet;
  }
  beginLanding() {
    if (this.world !== 0 || this.state !== 'playing' || this.time > 0 || this.landingPlayed)
      return false;
    this.landingPlayed = true;
    this.landing = { time: 0 };
    this.state = 'landing';
    this.updateLanding(0);
    return true;
  }
  updateLanding(dt) {
    this.landing.time = Math.min(LANDING.end, this.landing.time + dt);
    const frame = landingFrame(this.landing.time, this.level.landing);
    Object.assign(this.player, {
      x: frame.playerX,
      y: frame.playerY,
      vx: frame.walking
        ? (this.level.landing.walkTo - this.level.landing.x) / (LANDING.ready - LANDING.walk)
        : 0,
      vy: 0,
      face: 1,
    });
    if (this.landing.time >= LANDING.end) this.finishLanding();
  }
  finishLanding() {
    if (this.state !== 'landing') return false;
    Object.assign(this.player, {
      x: this.level.landing.walkTo,
      y: this.level.landing.y - 21,
      vx: 0,
      vy: 0,
      invincible: 1.5,
      jumpBuffer: 0,
    });
    this.landing = null;
    this.state = 'playing';
    this.emit('landed');
    return true;
  }
  retryWorld() {
    if (this.state !== 'lost') return false;
    this.score = this.stageScore;
    this.specimens = this.stageSpecimens;
    this.player.hp = this.player.maxHp;
    this.state = 'playing';
    this.loadWorld();
    return true;
  }
  burst(x, y, color, n = 12, speed = 100) {
    for (let i = 0; i < n; i++) {
      const a = this.random() * Math.PI * 2,
        v = speed * (0.3 + this.random());
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.35 + this.random() * 0.45,
        max: 1,
        color,
        r: 2 + this.random() * 3,
      });
    }
  }
  ring(x, y, color, r = 180) {
    this.rings.push({ x, y, color, r, life: 0.5, max: 0.5 });
  }
  float(x, y, text, color = '#d9f67e') {
    this.texts.push({ x, y, text, color, life: 1 });
  }
  damagePlayer(amount, force = false) {
    const p = this.player;
    if ((p.invincible > 0 && !force) || this.state !== 'playing') return false;
    const damage = amount * (this.assist ? 0.5 : 1);
    p.hp = Math.max(0, p.hp - damage);
    p.invincible = 1;
    this.combo = 0;
    this.emit('hurt');
    this.burst(p.x, p.y, '#ffa5a1', 12);
    this.float(p.x, p.y - 35, `−${Math.round(damage)}`, '#ffa5a1');
    if (p.hp <= 0) {
      this.state = 'lost';
      this.emit('lost');
    }
    return true;
  }
  respawn() {
    this.falls++;
    this.damagePlayer(14, true);
    if (this.state !== 'playing') return;
    const p = this.player;
    Object.assign(p, {
      ...this.checkpoint,
      vx: 0,
      vy: 0,
      dash: 0,
      invincible: 1.6,
      airJumps: 1,
      grounded: false,
      onPlatform: null,
      fuel: p.maxFuel,
      bounceBoost: 0,
      boostX: 0,
    });
    this.emit('respawn');
  }
  hurtEnemy(e, amount) {
    if (e.dead) return;
    e.hp -= amount;
    e.flash = 0.12;
    if (e.hp > 0) return;
    e.dead = true;
    this.kills++;
    this.combo++;
    this.comboTime = 4;
    this.score += Math.round(
      (e.type === 'boss' ? 1500 : 50) * (1 + Math.min(10, this.combo) * 0.1),
    );
    this.burst(e.x, e.y, e.type === 'boss' ? '#ffe49b' : '#dd9be9', e.type === 'boss' ? 70 : 14);
    this.emit('kill');
    this.pickups.push({ x: e.x, y: e.y, kind: this.random() < 0.45 ? 'heal' : 'zest', life: 18 });
    if (e.type === 'boss') {
      this.bossDefeated = true;
      this.emit('bossDefeated');
      this.ring(e.x, e.y, '#d9f67e', 400);
    }
  }
  spawnEnemy(type, x = this.player.x + 380, y = this.player.y, range = 100) {
    const e = {
      type,
      x,
      y,
      baseX: x,
      baseY: y,
      range,
      r: type === 'boss' ? 62 : 19,
      hp: type === 'boss' ? 1450 : 35 + this.world * 4,
      speed: type === 'charger' ? 135 : 55,
      direction: -1,
      cd: 1.4,
      flash: 0,
      vx: 0,
      vy: 0,
      grounded: false,
      windup: 0,
      charge: 0,
    };
    if (type === 'charger') e.hp *= 1.5;
    e.maxHp = e.hp;
    this.enemies.push(e);
    return e;
  }
  pulse() {
    const p = this.player;
    if (p.pulseCd > 0 || this.state !== 'playing') return false;
    p.pulseCd = 6;
    this.ring(p.x, p.y, '#d9f67e', 220);
    this.burst(p.x, p.y, '#d9f67e', 28, 250);
    for (const e of this.enemies) if (distance(p, e) < 220 + e.r) this.hurtEnemy(e, p.damage * 3.5);
    this.hazards = this.hazards.filter((h) => distance(h, p) > 235);
    this.emit('pulse');
    return true;
  }
  dash(direction = this.player.face) {
    const p = this.player;
    if (p.dashCd > 0 || this.state !== 'playing') return false;
    p.face = Math.sign(direction) || p.face;
    p.dash = 0.18;
    p.dashCd = p.dashMax;
    p.invincible = Math.max(p.invincible, 0.25);
    p.vy = 0;
    this.emit('dash');
    return true;
  }
  chooseUpgrade(id) {
    if (this.state !== 'ship' || this.ship.installed) return false;
    const station = this.shipTarget();
    if (station?.upgrade !== id) return false;
    const upgrade = UPGRADES.find((u) => u.id === id);
    if (!upgrade) return false;
    upgrade.apply(this.player);
    this.upgrades.push(id);
    this.ship.installed = id;
    this.emit('installed', upgrade);
    return true;
  }
  enterShip() {
    this.state = 'ship';
    this.ship = { installed: null, time: 0 };
    Object.assign(this.player, {
      x: CABIN.start,
      y: CABIN.floor - 21,
      vx: 0,
      vy: 0,
      face: 1,
      aim: 0,
      dash: 0,
      grounded: true,
      inWater: false,
      jumpBuffer: 0,
    });
    this.emit('boarded');
  }
  shipTarget() {
    if (this.state !== 'ship') return null;
    if (Math.abs(this.player.x - CABIN.airlock) <= CABIN.reach)
      return { type: 'airlock', x: CABIN.airlock, name: 'Airlock' };
    return (
      SHIP_STATIONS.find((station) => Math.abs(this.player.x - station.x) <= CABIN.reach) ?? null
    );
  }
  interactShip() {
    const target = this.shipTarget();
    if (!target) return false;
    if (target.type === 'airlock') {
      if (!this.ship.installed) {
        this.emit('shipLocked');
        return false;
      }
      this.state = 'travel';
      this.player.vx = 0;
      this.emit('depart');
    } else if (this.ship.installed) {
      this.emit('shipLocked');
      return false;
    } else this.emit('inspectUpgrade', target);
    return true;
  }
  landNextWorld() {
    if (this.state !== 'travel' || !this.ship?.installed) return false;
    this.world++;
    this.state = 'playing';
    this.loadWorld();
    return true;
  }
  completeWorld() {
    if (this.state !== 'playing' || !this.shipReady) return false;
    this.score += 600 + Math.round(this.player.hp * 2);
    if (this.world === WORLDS.length - 1) {
      this.state = 'won';
      this.emit('won');
    } else {
      this.enterShip();
    }
    return true;
  }
  updateTerrain(dt) {
    for (const f of this.level.platforms) {
      const ox = f.x,
        oy = f.y;
      if (f.kind === 'moving') {
        f[f.axis] =
          f[f.axis === 'x' ? 'baseX' : 'baseY'] +
          Math.sin((this.time * Math.PI * 2) / f.period) * f.range;
      }
      f.dx = f.x - ox;
      f.dy = f.y - oy;
      if (f.kind === 'phase') {
        const phase = (this.time + (f.phase || 0)) % f.period;
        f.solid = phase < f.period * 0.76;
        f.warning = phase > f.period * 0.59 && f.solid;
      }
      if (f.kind === 'crumble') {
        if (f.crumble > 0) {
          f.crumble -= dt;
          if (f.crumble <= 0) {
            f.solid = false;
            f.restore = 3;
          }
        } else if (!f.solid) {
          f.restore -= dt;
          if (f.restore <= 0) f.solid = true;
        }
      }
    }
    for (const h of this.level.hazards) {
      if (h.kind === 'laser' || h.kind === 'vent') {
        const phase = (this.time + (h.phase || 0)) % h.period;
        h.active = phase < h.on;
        h.warning = phase > h.period - 0.55;
      } else if (h.kind === 'crusher') {
        const phase = (this.time / h.period) % 1;
        h.y = h.baseY + Math.pow(Math.max(0, Math.sin(phase * Math.PI)), 4) * h.range;
        h.warning = phase > 0.12 && phase < 0.34;
      } else if (h.axis)
        h[h.axis] =
          h[h.axis === 'x' ? 'baseX' : 'baseY'] +
          Math.sin((this.time * Math.PI * 2) / h.period) * h.range;
    }
  }
  launchBounce(platform) {
    const p = this.player;
    Object.assign(p, {
      vy: -1010,
      grounded: false,
      onPlatform: null,
      airJumps: 1,
      fuel: p.maxFuel,
      bounceBoost: 0.8,
    });
    this.ring(p.x, platform.y, WORLDS[this.world].color, 90);
    this.emit('bounce');
  }
  movePlayer(dt, input) {
    const p = this.player,
      w = WORLDS[this.world];
    const oldPlatform = this.level.platforms.find((f) => f.id === p.onPlatform);
    if (p.grounded && oldPlatform?.solid) {
      p.x += oldPlatform.dx;
      p.y += oldPlatform.dy;
    }
    p.inWater = !!this.level.water && overlaps(body(p), this.level.water);
    if (p.grounded) {
      p.coyote = 0.11;
      p.airJumps = 1;
      p.fuel = Math.min(p.maxFuel, p.fuel + dt * 2.8);
      p.boostX = 0;
    } else p.coyote = Math.max(0, p.coyote - dt);
    p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
    p.drop = Math.max(0, p.drop - dt);
    p.bounceBoost = Math.max(0, p.bounceBoost - dt);
    p.boostX *= 1 - dt * 0.8;
    if (input.down && p.grounded && oldPlatform?.oneWay) {
      p.drop = 0.24;
      p.y += 5;
      p.grounded = false;
    }
    if (p.jumpBuffer > 0 && (p.coyote > 0 || p.airJumps > 0 || p.inWater)) {
      const air = p.coyote <= 0 && !p.inWater;
      p.vy = p.inWater ? -250 : -590;
      p.bounceBoost = 0;
      if (!air && oldPlatform?.conveyor) {
        p.boostX = oldPlatform.conveyor;
        p.vx += p.boostX;
      }
      if (air) p.airJumps--;
      p.coyote = 0;
      p.jumpBuffer = 0;
      p.grounded = false;
      p.onPlatform = null;
      this.burst(p.x, p.y + 20, w.color, air ? 14 : 6, 80);
      this.emit(air ? 'doubleJump' : 'jump');
    }
    const mx = clamp(input.x || 0, -1, 1);
    if (mx) p.face = Math.sign(mx);
    let wind = 0;
    for (const z of this.level.zones) if (overlaps(body(p), z)) wind += z.wind;
    if (p.dash > 0) {
      p.dash -= dt;
      p.vx = p.face * 790;
      p.vy = 0;
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: 0,
        vy: 0,
        r: 15,
        life: 0.18,
        max: 0.18,
        color: w.color,
      });
    } else {
      const target = mx * p.speed + (p.grounded ? 0 : p.boostX);
      const acceleration = p.grounded ? 2400 : 1450;
      const delta = target - p.vx;
      p.vx += clamp(delta, -acceleration * dt, acceleration * dt);
      if (p.inWater) {
        p.vy += (input.jumpHeld ? -900 : 380) * dt;
        p.vy *= 1 - dt * 1.2;
        p.vy = clamp(p.vy, -240, 270);
      } else {
        p.vy += w.gravity * dt;
        if (this.thrustAvailable && input.jumpHeld && !p.grounded && p.fuel > 0) {
          p.vy -= 2100 * dt;
          p.fuel = Math.max(0, p.fuel - dt);
          this.burst(p.x, p.y + 23, '#ffd18b', 1, 70);
        } else if (!input.jumpHeld && p.vy < -240 && p.bounceBoost <= 0)
          p.vy += w.gravity * dt * 1.6;
      }
    }
    p.vy = clamp(p.vy, -1100, 850);
    const conveyor = p.grounded ? oldPlatform?.conveyor || 0 : 0;
    const solids = [
      ...this.level.platforms.filter((f) => f.solid),
      ...this.level.hazards.filter((h) => h.kind === 'rock'),
    ];
    p.x += (p.vx + wind + conveyor) * dt;
    p.x = clamp(p.x, 18, this.level.width - 18);
    for (const f of solids)
      if (!f.oneWay && overlaps(body(p), f)) {
        p.x = p.vx >= 0 ? f.x - 14 : f.x + f.w + 14;
        p.vx = 0;
        p.dash = 0;
      }
    const oldBottom = p.y + 21;
    p.y += p.vy * dt;
    p.grounded = false;
    p.onPlatform = null;
    for (const f of solids) {
      if (!overlaps(body(p), f)) continue;
      if (
        p.vy >= 0 &&
        oldBottom <= f.y + Math.max(3, Math.abs(f.dy || 0)) &&
        (!f.oneWay || p.drop <= 0)
      ) {
        p.y = f.y - 21;
        p.vy = 0;
        p.grounded = true;
        p.onPlatform = f.id ?? null;
        p.airJumps = 1;
        if (f.kind === 'crumble' && !f.crumble) f.crumble = 0.65;
        if (f.kind === 'bounce') {
          this.launchBounce(f);
        }
      } else if (!f.oneWay && p.vy < 0) {
        p.y = f.y + f.h + 21;
        p.vy = 0;
      }
    }
    // A jelly pad's raised lip is forgiving: running onto it launches the bot too.
    if (p.grounded) {
      const spring = this.level.platforms.find(
        (f) =>
          f.kind === 'bounce' &&
          f.solid &&
          p.x > f.x &&
          p.x < f.x + f.w &&
          Math.abs(p.y + 21 - f.y) < 25,
      );
      if (spring) this.launchBounce(spring);
    }
    if (p.y < 30) {
      p.y = 30;
      p.vy = Math.max(0, p.vy);
    }
    if (p.y > 890) this.respawn();
  }
  moveEnemies(dt) {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.flash = Math.max(0, e.flash - dt);
      e.cd -= dt;
      const dx = p.x - e.x,
        d = distance(e, p);
      if (e.type === 'boss') {
        e.y = e.baseY + Math.sin(this.time * 1.5) * 32;
        if (e.cd <= 0 && Math.abs(dx) < 950) {
          e.cd = e.hp < e.maxHp * 0.5 ? 1.2 : 2.1;
          const dir = Math.sign(dx) || -1;
          for (let i = 0; i < 4; i++)
            this.hazards.push({
              x: e.x,
              y: 595 - i * 66,
              vx: dir * (210 + i * 10),
              vy: i === 3 ? -35 : 0,
              r: 9,
              life: 5,
            });
          if (this.enemies.length < 10) this.spawnEnemy('flyer', e.x - 180, e.y - 120, 170);
          this.ring(e.x, e.y, '#ee9dcb', 90);
        }
      } else if (e.type === 'flyer') {
        e.x = e.baseX + Math.sin(this.time * 0.95 + e.baseX) * e.range;
        e.y = e.baseY + Math.sin(this.time * 2 + e.baseX) * 45;
        if (e.cd <= 0 && d < 480) {
          e.cd = 3.2;
          const a = Math.atan2(p.y - e.y, dx);
          this.hazards.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(a) * 160,
            vy: Math.sin(a) * 160,
            r: 7,
            life: 4,
          });
        }
      } else {
        if (e.type === 'spitter') {
          if (e.cd <= 0 && d < 560) {
            e.cd = 2.5;
            const a = Math.atan2(p.y - e.y, dx);
            this.hazards.push({
              x: e.x,
              y: e.y - 6,
              vx: Math.cos(a) * 190,
              vy: Math.sin(a) * 190,
              r: 7,
              life: 4,
            });
          }
        } else if (e.type === 'charger' && Math.abs(dx) < 380) {
          if (e.windup > 0) {
            e.windup -= dt;
            if (e.windup <= 0) {
              e.charge = 0.65;
              e.direction = Math.sign(dx) || 1;
            }
          } else if (e.charge > 0) {
            e.charge -= dt;
            e.x += e.direction * 330 * dt;
          } else if (e.cd <= 0) {
            e.cd = 3;
            e.windup = 0.65;
          } else e.x += e.direction * e.speed * dt;
        } else {
          e.x += e.direction * e.speed * dt;
          if (Math.abs(e.x - e.baseX) > e.range) e.direction *= -1;
        }
        const old = e.y + e.r;
        e.vy = Math.min(650, e.vy + 1550 * dt);
        e.y += e.vy * dt;
        for (const f of this.level.platforms)
          if (
            f.solid &&
            e.x + e.r > f.x &&
            e.x - e.r < f.x + f.w &&
            old <= f.y + 3 &&
            e.y + e.r >= f.y
          ) {
            e.y = f.y - e.r;
            e.vy = 0;
            if (e.type !== 'spitter' && (e.x < f.x + 25 || e.x > f.x + f.w - 25))
              e.direction = e.x < f.x + 25 ? 1 : -1;
            break;
          }
        if (e.y > 950) e.dead = true;
      }
      if (d < e.r + 18) {
        if (p.vy > 100 && p.y < e.y - e.r * 0.45 && e.type !== 'boss') {
          this.hurtEnemy(e, 100);
          p.vy = -420;
          p.airJumps = 1;
          this.emit('bounce');
        } else if (p.dash > 0) this.hurtEnemy(e, 650 * dt);
        else this.damagePlayer(e.type === 'boss' ? 24 : 13);
      }
      if (this.state !== 'playing') return;
    }
  }
  step(dt, input = {}) {
    if (this.state === 'ship') {
      dt = clamp(dt, 0, 0.05);
      this.ship.time += dt;
      const p = this.player,
        direction = clamp(input.x || 0, -1, 1);
      p.vx += clamp(direction * 235 - p.vx, -1500 * dt, 1500 * dt);
      p.x = clamp(p.x + p.vx * dt, 50, CABIN.width - 50);
      if (direction) p.face = Math.sign(direction);
      if (p.x === 50 || p.x === CABIN.width - 50) p.vx = 0;
      return;
    }
    if (this.state === 'landing') {
      this.updateLanding(clamp(dt, 0, 0.05));
      return;
    }
    if (this.state !== 'playing') return;
    dt = clamp(dt, 0, 0.05);
    if (!dt) return;
    if (input.jump) this.player.jumpBuffer = 0.13;
    if (input.dash) this.dash(input.x || this.player.face);
    if (input.pulse) this.pulse();
    // Substeps prevent a fast dash from tunneling through walls or thin platforms.
    let remaining = dt;
    while (remaining > 1e-8 && this.state === 'playing') {
      const step = Math.min(1 / 120, remaining);
      this.tick(step, input);
      remaining -= step;
    }
  }
  tick(dt, input) {
    this.time += dt;
    this.totalTime += dt;
    const p = this.player;
    for (const key of ['dashCd', 'pulseCd', 'invincible', 'fireCd'])
      p[key] = Math.max(0, p[key] - dt);
    this.updateTerrain(dt);
    this.movePlayer(dt, input);
    if (this.state !== 'playing') return;
    for (const h of this.level.hazards)
      if (h.active && h.kind !== 'rock' && overlaps(body(p), h))
        this.damagePlayer(h.kind === 'crusher' ? 23 : 14);
    if (this.state !== 'playing') return;
    for (const c of this.level.checkpoints)
      if (!c.active && distance(p, c) < 70) {
        c.active = true;
        this.checkpoint = { x: c.x, y: c.y };
        p.hp = Math.min(p.maxHp, p.hp + 10);
        this.score += 75;
        this.emit('checkpoint');
        this.ring(c.x, c.y, '#8de8db', 90);
      }
    for (const n of this.nodes)
      if (!n.done && distance(p, n) < p.magnet) {
        n.done = true;
        this.scanned++;
        this.specimens++;
        this.score += 250;
        p.hp = Math.min(p.maxHp, p.hp + 10);
        this.burst(n.x, n.y, WORLDS[this.world].color, 22, 140);
        this.float(n.x, n.y - 30, 'SEED CORE SECURED');
        this.emit('sample');
      }
    for (const z of this.level.zest)
      if (!z.done && distance(p, z) < p.magnet * 0.8) {
        z.done = true;
        this.score += 15;
        p.pulseCd = Math.max(0, p.pulseCd - 0.12);
        this.emit('pickup');
      }
    for (const m of this.level.medkits)
      if (!m.done && distance(p, m) < p.magnet) {
        m.done = true;
        p.hp = Math.min(p.maxHp, p.hp + 18 + p.healBonus);
        this.float(p.x, p.y - 30, 'HULL REPAIRED', '#8de8db');
        this.emit('pickup');
      }
    if (this.level.boss && !this.bossSpawned && p.x > this.level.boss.x - 680) {
      this.bossSpawned = true;
      const b = this.level.boss;
      this.spawnEnemy('boss', b.x, b.y);
      this.emit('boss');
    }
    this.shipReady = this.scanned === this.nodes.length && (!this.level.boss || this.bossDefeated);
    if (distance(p, this.level.exit) < 80 && this.shipReady) {
      this.extraction += dt;
      if (this.extraction > 0.12) {
        this.completeWorld();
        return;
      }
    } else this.extraction = 0;
    let nearest = null,
      nearDist = 590;
    for (const e of this.enemies)
      if (!e.dead) {
        const d = distance(p, e);
        if (d < nearDist) {
          nearest = e;
          nearDist = d;
        }
      }
    if (p.fireCd <= 0 && (nearest || input.aim)) {
      const target = input.aim || nearest,
        a = Math.atan2(target.y - p.y, target.x - p.x);
      p.aim = a;
      p.fireCd = p.fireRate;
      const angles = [a];
      for (let i = 1; i <= p.spread; i++) angles.push(a - i * 0.14, a + i * 0.14);
      for (const angle of angles)
        this.bullets.push({
          x: p.x,
          y: p.y - 3,
          vx: Math.cos(angle) * 700,
          vy: Math.sin(angle) * 700,
          life: 0.9,
          damage: p.damage,
        });
      this.emit('shoot');
    }
    this.moveEnemies(dt);
    if (this.state !== 'playing') return;
    for (const b of this.bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      for (const e of this.enemies)
        if (!e.dead && distance(b, e) < e.r + 5) {
          this.hurtEnemy(e, b.damage);
          b.life = 0;
          break;
        }
      if (
        this.level.platforms.some(
          (f) => !f.oneWay && b.x > f.x && b.x < f.x + f.w && b.y > f.y && b.y < f.y + f.h,
        )
      )
        b.life = 0;
    }
    for (const h of this.hazards) {
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.life -= dt;
      if (distance(h, p) < h.r + 16) {
        this.damagePlayer(12);
        h.life = 0;
        if (this.state !== 'playing') return;
      }
    }
    for (const item of this.pickups) {
      item.life -= dt;
      const d = distance(item, p);
      if (d < p.magnet + 70) {
        item.x += (p.x - item.x) * dt * 8;
        item.y += (p.y - item.y) * dt * 8;
      }
      if (d < 26) {
        item.life = 0;
        if (item.kind === 'heal') p.hp = Math.min(p.maxHp, p.hp + 8 + p.healBonus);
        else this.score += 25;
        this.emit('pickup');
      }
    }
    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt;
      particle.vx *= 1 - dt * 3;
      particle.vy *= 1 - dt * 3;
    }
    for (const t of this.texts) {
      t.y -= dt * 28;
      t.life -= dt;
    }
    for (const r of this.rings) r.life -= dt;
    this.bullets = this.bullets.filter((b) => b.life > 0);
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.hazards = this.hazards.filter((h) => h.life > 0);
    this.pickups = this.pickups.filter((i) => i.life > 0);
    this.particles = this.particles.filter((p) => p.life > 0).slice(-450);
    this.texts = this.texts.filter((t) => t.life > 0);
    this.rings = this.rings.filter((r) => r.life > 0);
    this.comboTime -= dt;
    if (this.comboTime <= 0) this.combo = 0;
  }
  snapshot() {
    return {
      state: this.state,
      world: this.world,
      scanned: this.scanned,
      samples: this.nodes.length,
      score: this.score,
      kills: this.kills,
      time: this.totalTime,
      hp: this.player.hp,
      entities: this.enemies.length + this.bullets.length + this.hazards.length,
      upgrades: [...this.upgrades],
      x: this.player.x,
      y: this.player.y,
      falls: this.falls,
    };
  }
}
