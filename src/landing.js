// Seconds from launch. The level simulation stays frozen until the handoff.
export const LANDING = {
  touchdown: 2.8,
  hatch: 3.5,
  walk: 4.3,
  ready: 6.4,
  end: 7.4,
};
const progress = (time, from, to) => Math.max(0, Math.min(1, (time - from) / (to - from)));

export function landingFrame(time, site) {
  const descent = progress(time, 0, LANDING.touchdown),
    walk = progress(time, LANDING.walk, LANDING.ready),
    release = progress(time, LANDING.ready, LANDING.end);
  return {
    shipX: site.x + 60 * (1 - descent) ** 2,
    shipY: site.y - 32 * 2.3 - 410 * (1 - descent) ** 2,
    hatch: progress(time, LANDING.hatch, LANDING.walk),
    playerX: site.x + (site.walkTo - site.x) * walk,
    playerY: site.y - 21 - 8 * (1 - progress(walk, 0, 0.4)),
    walking: walk > 0 && walk < 1,
    visible: time >= LANDING.walk,
    release,
    caption:
      time < LANDING.touchdown
        ? 'Approaching Planet Grapefruit…'
        : time < LANDING.hatch
          ? 'Touchdown. A little hope has arrived.'
          : time < LANDING.walk
            ? 'Opening hatch…'
            : time < LANDING.ready
              ? 'One small step, Vessy.'
              : 'Find the seed cores. Bring hope home.',
  };
}
