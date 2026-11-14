import { WORLDS } from '../src/data.js';
import { Game, clamp } from '../src/core.js';
// Terrain-only traversal planning using the actual movement/collision code.
// This deliberately excludes enemies and damage; those have separate combat tests.
export function reachableSurfaces(world) {
  const template = new Game({ seed: 457 });
  template.world = world;
  template.loadWorld();
  const all = template.level.platforms.map((p) => ({
    ...p,
    kind: ['phase', 'crumble', 'moving'].includes(p.kind) ? 'stone' : p.kind,
    solid: true,
  }));
  function canReach(from, to) {
    const gap = Math.max(0, to.x - (from.x + from.w), from.x - (to.x + to.w)),
      rise = from.y - to.y;
    // Water has continuous propulsion and no oxygen/fuel gate.
    if (
      template.level.water &&
      to.x < template.level.water.x + template.level.water.w + 180 &&
      gap < 650 &&
      from.x + from.w >= template.level.water.x - 50 &&
      from.x < template.level.water.x + template.level.water.w + 50 &&
      to.x + to.w > template.level.water.x - 50
    )
      return true;
    if (gap > 620 || rise > 430 || rise < -500) return false;
    const direction = to.x + to.w / 2 >= from.x + from.w / 2 ? 1 : -1;
    const startX = clamp(to.x + to.w / 2, from.x + 22, from.x + from.w - 22),
      endX = clamp(startX, to.x + 25, to.x + to.w - 25);
    if (Math.abs(endX - startX) < 20 && Math.abs(rise) < 4) return true;
    for (const second of [null, 0.2, 0.34, 0.41, 0.55, 0.7])
      for (const dashAt of [null, 0.5, 0.8]) {
        const g = Object.assign(Object.create(Game.prototype), template);
        g.player = {
          ...template.player,
          x: startX,
          y: from.y - 21,
          vx: direction * 220,
          vy: 0,
          grounded: true,
          onPlatform: from.id,
          airJumps: 1,
          coyote: 0.11,
          dash: 0,
          dashCd: 0,
          fuel: 1.4,
          bounceBoost: 0,
          boostX: 0,
        };
        g.level = {
          ...template.level,
          platforms: all.map((p) => ({ ...p })),
          hazards: [],
          zones: [],
        };
        g.particles = [];
        g.rings = [];
        g.time = 0;
        g.emit = () => {};
        g.random = () => 0.5;
        let bounced = false;
        for (let frame = 0; frame < 210; frame++) {
          const p = g.player;
          if (from.kind === 'bounce' && !bounced) {
            p.vy = -1010;
            p.grounded = false;
            p.coyote = 0;
            p.bounceBoost = 0.8;
            bounced = true;
          }
          if (
            (frame === 0 && from.kind !== 'bounce') ||
            (second !== null && frame === Math.round(second * 60))
          )
            p.jumpBuffer = 0.13;
          if (dashAt !== null && frame === Math.round(dashAt * 60)) g.dash(direction);
          const dx = endX - p.x;
          const x = Math.abs(dx) < 12 ? 0 : Math.sign(dx);
          const jumpHeld = p.y > to.y - 100;
          g.movePlayer(1 / 120, { x, jumpHeld });
          g.movePlayer(1 / 120, { x, jumpHeld });
          for (const f of g.level.platforms) f.dx = f.dy = 0;
          p.dashCd = Math.max(0, p.dashCd - 1 / 60);
          if (p.grounded && p.onPlatform === to.id && frame > 1) return true;
          if (
            to.kind === 'bounce' &&
            p.bounceBoost > 0.77 &&
            p.x > to.x &&
            p.x < to.x + to.w &&
            Math.abs(p.y + 21 - to.y) < 30
          )
            return true;
          if (p.y > 850 || p.x < 0 || p.x > template.level.width) break;
        }
      }
    return false;
  }
  const reachable = new Set([0]),
    queue = [0],
    edges = [];
  while (queue.length) {
    const from = all[queue.shift()];
    for (const to of all) {
      if (reachable.has(to.id) || to.x + to.w < from.x - 40) continue;
      if (canReach(from, to)) {
        reachable.add(to.id);
        queue.push(to.id);
        edges.push([from.id, to.id]);
      }
    }
  }
  return { reachable, edges, platforms: all, level: template.level };
}
if (process.argv[1]?.endsWith('route-check.mjs'))
  for (let i = 0; i < WORLDS.length; i++) {
    const result = reachableSurfaces(i);
    const cells = result.level.cells.map((c) =>
      result.platforms.some(
        (p) =>
          result.reachable.has(p.id) &&
          c.x >= p.x - 35 &&
          c.x <= p.x + p.w + 35 &&
          c.y < p.y &&
          p.y - c.y < 200,
      ),
    );
    console.log(
      JSON.stringify({
        world: i + 1,
        surfaces: result.reachable.size,
        total: result.platforms.length,
        cells,
        exit: result.platforms.some(
          (p) =>
            result.reachable.has(p.id) &&
            result.level.exit.x > p.x &&
            result.level.exit.x < p.x + p.w,
        ),
      }),
    );
  }
