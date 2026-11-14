import { Game, clamp } from './core.js';
import { WORLDS, TRACKS, UPGRADES, SHIP_TRACK } from './data.js';
import { Renderer } from './renderer.js';
import { AudioManager } from './audio.js';
import { TOTAL_CELLS } from './levels.js';
import { landingFrame } from './landing.js';
import { PixelArt } from './pixel-art.js';
const $ = (id) => document.getElementById(id);
const show = (id, value = true) => $(id).classList.toggle('hidden', !value);
const formatTime = (t) =>
  `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const load = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(`zest:${key}`)) ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(`zest:${key}`, JSON.stringify(value));
  } catch {
    /* Private browsing can disable storage. */
  }
};
const renderer = new Renderer($('game-canvas'));
new PixelArt($('skip-landing-label').getContext('2d'), renderer.art.make).label(
  'SKIP INTRO',
  58,
  16,
  '#142335',
  14,
);
let game = null,
  paused = false,
  dialog = null,
  drawer = false,
  drawerPaused = false,
  previousFocus = null,
  last = performance.now(),
  hudTimer = 0,
  toastTimer = 0,
  launchTimer = null,
  drawerReturnTrack = 0;
let best = load('best-platformer', 0),
  assist = load('assist', false),
  reduced = load('motion', matchMedia('(prefers-reduced-motion: reduce)').matches);
const keys = new Set(),
  touch = { x: 0, jumpHeld: false },
  pointer = { down: false, x: 0, y: 0 },
  actions = { jump: false, dash: false, pulse: false };
renderer.reduced = reduced;
document.body.classList.toggle('reduced-motion', reduced);
const audio = new AudioManager((track, index, failed = false) => {
  $('music-label').textContent = failed
    ? 'AUDIO UNAVAILABLE · ADVENTURE CONTINUES'
    : 'NOW PLAYING / ' + String(index + 1).padStart(2, '0');
  $('now-playing-button').replaceChildren(
    document.createTextNode(track.title + ' '),
    Object.assign(document.createElement('span'), { textContent: '↗' }),
  );
  document
    .querySelectorAll('.track-row')
    .forEach((row, i) => row.classList.toggle('active', i === index));
});
audio.volume = clamp(Number(load('volume', 0.6)) || 0, 0, 1);
audio.fxVolume = clamp(Number(load('fx', 0.55)) || 0, 0, 1);
audio.muted = load('muted', false);
$('music-volume').value = audio.volume * 100;
$('fx-volume').value = audio.fxVolume * 100;
$('assist-toggle').checked = assist;
$('motion-toggle').checked = reduced;
function updateMute() {
  $('mute-button').textContent = audio.muted ? '♫̸' : '♪';
  $('mute-button').setAttribute('aria-label', audio.muted ? 'Unmute audio' : 'Mute audio');
  document.body.classList.toggle('music-playing', audio.unlocked && !audio.muted);
}
updateMute();
function activateAudio() {
  audio.unlock();
  updateMute();
}
function toast(text, seconds = 4) {
  $('toast').textContent = text;
  show('toast');
  toastTimer = seconds;
}
function clearInput() {
  keys.clear();
  touch.x = 0;
  touch.jumpHeld = false;
  pointer.down = false;
  actions.jump = actions.dash = actions.pulse = false;
  $('joystick-knob').style.transform = '';
}
function openPanel(id) {
  previousFocus = document.activeElement;
  dialog = id;
  show('overlay');
  for (const panel of document.querySelectorAll('#overlay .panel'))
    panel.classList.toggle('hidden', panel.id !== id);
  requestAnimationFrame(() => $(id).querySelector('button,input')?.focus({ preventScroll: true }));
  clearInput();
}
function closePanel() {
  show('overlay', false);
  dialog = null;
  previousFocus?.focus?.({ preventScroll: true });
}
function pause() {
  if (!game || !['playing', 'landing', 'ship'].includes(game.state) || paused || drawer || dialog)
    return;
  paused = true;
  audio.duck(true);
  openPanel('pause-panel');
}
function resume() {
  if (!paused || dialog !== 'pause-panel') return;
  paused = false;
  closePanel();
  audio.duck(false);
  clearInput();
}
function cabinUI(visible) {
  document.body.classList.toggle('aboard-ship', visible);
  show('ship-hud', visible);
  $('touch-pulse').textContent = visible ? 'USE / E' : 'PULSE';
  $('touch-pulse').setAttribute('aria-label', visible ? 'Interact with ship object' : 'Zest pulse');
}
function interact() {
  if (!paused && !drawer && !dialog) game?.interactShip();
}
function updateShipHUD() {
  const installed = UPGRADES.find((upgrade) => upgrade.id === game.ship.installed),
    target = game.shipTarget();
  const status = installed
    ? `${installed.name} installed. Follow the yellow arrows to the Airlock.`
    : 'Walk to an object and press E. Choose one upgrade for the next landing.';
  if ($('ship-status').textContent !== status) $('ship-status').textContent = status;
  $('ship-interact').disabled = !target;
  $('ship-prompt').textContent = !target
    ? installed
      ? 'Follow the yellow arrows → Airlock'
      : 'Explore the workshop'
    : target.type === 'airlock'
      ? installed
        ? 'Airlock · travel to the next planet'
        : 'Airlock · install an upgrade first'
      : installed
        ? `${target.name} · upgrade already installed`
        : `Inspect ${target.name}`;
}
function event(kind, data) {
  if (kind === 'landed') {
    clearInput();
    show('landing-cutscene', false);
    show('game-hud');
    toast(
      `Run, double-jump, dash. Collect ${game.nodes.length} seed cores and reach the ship. Your blaster fires automatically.`,
      7,
    );
    $('pause-button').focus({ preventScroll: true });
  }
  if (
    [
      'shoot',
      'kill',
      'dash',
      'pulse',
      'sample',
      'hurt',
      'pickup',
      'jump',
      'doubleJump',
      'bounce',
    ].includes(kind)
  )
    audio.fx(kind);
  if (kind === 'hurt') renderer.shake = 12;
  if (kind === 'sample')
    toast(
      game.scanned === game.nodes.length
        ? `All ${game.nodes.length} seed cores secured. Reach the ship at the far end of the world.`
        : `Seed core ${game.scanned}/${game.nodes.length} secured. Hull +10.`,
      4,
    );
  if (kind === 'boss') {
    toast('ROOTHEART DETECTED. Jump its low shots. Dash through the gaps. Pulse the swarm.', 6);
  }
  if (kind === 'bossDefeated')
    toast('The plague is gone. Reach the ship. It’s time to bring them home.', 6);
  if (kind === 'checkpoint')
    toast('Checkpoint online. Hull repaired. Your next fall brings you back here.', 3);
  if (kind === 'respawn') {
    renderer.snap = true;
    toast('Back at the beacon. Keep going, little bot.', 2.5);
  }
  if (kind === 'boarded') {
    clearInput();
    renderer.snap = true;
    cabinUI(true);
    show('toast', false);
    show('boss-hud', false);
    audio.play(SHIP_TRACK);
    $('header-status').textContent = 'ABOARD VESSY’S SHIP / WORKSHOP ONLINE';
    $('footer-center').textContent = WORLDS[game.world].debrief;
    $('ship-destination').textContent = `NEXT / ${WORLDS[game.world + 1].name}`;
    updateShipHUD();
  }
  if (kind === 'inspectUpgrade') {
    const upgrade = UPGRADES.find((item) => item.id === data.upgrade);
    $('debrief-text').textContent =
      'Install this upgrade for the rest of the expedition, or keep exploring the ship.';
    $('upgrade-eyebrow').textContent = `SHIP WORKSHOP / ${data.name.toUpperCase()}`;
    $('route-map').replaceChildren(
      ...WORLDS.map((world, i) => {
        const chip = document.createElement('span');
        chip.className = `route-stop ${i <= game.world ? 'complete' : ''} ${i === game.world + 1 ? 'next' : ''}`;
        chip.title = TRACKS[world.track].title;
        chip.textContent = `${String(world.track + 1).padStart(2, '0')} ${world.name}`;
        return chip;
      }),
    );
    $('next-world-label').textContent =
      `NEXT LANDING → ${WORLDS[game.world + 1].name.toUpperCase()}`;
    const button = document.createElement('button');
    button.className = 'upgrade-card';
    button.dataset.upgrade = upgrade.id;
    button.innerHTML = `<span class="upgrade-icon">${upgrade.icon}</span><span class="upgrade-tag">${upgrade.tag}</span><strong>${upgrade.name}</strong><p>${upgrade.description}</p><span class="install">INSTALL UPGRADE ↗</span>`;
    button.addEventListener('click', () => {
      activateAudio();
      game.chooseUpgrade(upgrade.id);
    });
    $('upgrade-choices').replaceChildren(button);
    openPanel('upgrade-panel');
  }
  if (kind === 'installed') {
    closePanel();
    clearInput();
    audio.fx('pickup');
    updateShipHUD();
    $('pause-button').focus({ preventScroll: true });
  }
  if (kind === 'shipLocked') {
    toast(
      game.ship.installed
        ? 'Upgrade installed. Follow the yellow arrows to the Airlock.'
        : 'Choose an upgrade at one of the workshop objects before heading out.',
      4,
    );
  }
  if (kind === 'depart') {
    clearInput();
    $('travel-destination').textContent = WORLDS[game.world + 1].name;
    openPanel('travel-panel');
    launchTimer = setTimeout(land, 1700);
  }
  if (kind === 'won' || kind === 'lost') finish(kind === 'won');
}
function updateWorld() {
  const world = WORLDS[game.world];
  $('world-code').textContent = world.code;
  $('world-name').textContent = world.name;
  $('header-status').textContent =
    `EXPEDITION 0457 · WORLD ${String(game.world + 1).padStart(2, '0')} / 09`;
  $('sample-pips').replaceChildren(...game.nodes.map(() => document.createElement('i')));
  $('footer-center').textContent = world.subtitle.toUpperCase();
}
function start() {
  clearTimeout(launchTimer);
  cabinUI(false);
  activateAudio();
  closePanel();
  drawer = false;
  show('soundtrack-drawer', false);
  paused = false;
  audio.duck(false);
  show('title-screen', false);
  show('game-hud', false);
  show('pause-button');
  show('toast', false);
  clearInput();
  // Landing music and camera position are set after construction or ship travel.
  game = new Game({
    assist,
    emit: (kind, data) => {
      if (kind !== 'world') event(kind, data);
    },
  });
  game.beginLanding();
  show('landing-cutscene');
  $('landing-caption').textContent = landingFrame(0, game.level.landing).caption;
  audio.play(WORLDS[0].track);
  renderer.snap = true;
  updateWorld();
  $('skip-landing').focus({ preventScroll: true });
}
function finish(won) {
  clearInput();
  show('boss-hud', false);
  audio.play(WORLDS[game.world].track);
  const newBest = game.score > best;
  if (newBest) {
    best = game.score;
    save('best-platformer', best);
  }
  updateBest();
  $('end-eyebrow').textContent = won
    ? 'TRANSMISSION / HABITAT CONFIRMED'
    : 'TRANSMISSION / SIGNAL LOST';
  $('end-title').innerHTML = won ? 'You found home.' : 'Small bot.<br>Brave attempt.';
  $('end-story').textContent = won
    ? '“VES–0457, we read you. The first ships are on their way.” Beneath an unfamiliar sun, the people of Planet Grapefruit will grow again. You were built to collect samples. You brought back a future.'
    : `The signal faded in ${WORLDS[game.world].name}. Your earlier worlds and upgrades are safe. Reboot this stage and give it another go.`;
  $('end-score').textContent = game.score.toLocaleString();
  $('end-samples').textContent = `${game.specimens}/${TOTAL_CELLS}`;
  $('retry-button').firstChild.textContent = won
    ? 'Another little adventure '
    : 'Retry this world ';
  $('end-time').textContent = formatTime(game.totalTime);
  $('best-score').textContent = newBest
    ? 'NEW PERSONAL BEST · GOOD WORK, LITTLE BOT.'
    : `PERSONAL BEST · ${best.toLocaleString()}`;
  openPanel('end-panel');
}
function land() {
  if (game?.state !== 'travel') return;
  if (drawer) return;
  clearTimeout(launchTimer);
  if (!game.landNextWorld()) return;
  cabinUI(false);
  clearInput();
  closePanel();
  renderer.snap = true;
  audio.play(WORLDS[game.world].track);
  toast(`${WORLDS[game.world].name} · ${WORLDS[game.world].mechanic}`, 6);
  updateWorld();
  if (document.hidden) pause();
}
function home() {
  clearTimeout(launchTimer);
  cabinUI(false);
  game = null;
  paused = false;
  closePanel();
  clearInput();
  show('game-hud', false);
  show('landing-cutscene', false);
  show('pause-button', false);
  show('title-screen');
  audio.duck(false);
  audio.play(0);
  $('header-status').textContent = 'SECTOR 04 · SIGNAL ONLINE';
  $('footer-center').textContent = 'A LITTLE HOPE GOES A LONG WAY.';
  $('launch-button').focus({ preventScroll: true });
}
function updateBest() {
  $('best-label').textContent = best ? `BEST / ${best.toLocaleString()}` : 'VES–0457';
}
function openSoundtrack() {
  if (drawer) return;
  activateAudio();
  if (audio.index < 0) audio.play(0);
  drawerReturnTrack = audio.index;
  drawerPaused = !!game && ['playing', 'landing', 'ship'].includes(game.state) && !paused;
  if (drawerPaused) {
    paused = true;
    clearInput();
  }
  drawer = true;
  previousFocus = document.activeElement;
  show('soundtrack-drawer');
  $('close-soundtrack').focus({ preventScroll: true });
}
function closeSoundtrack() {
  drawer = false;
  show('soundtrack-drawer', false);
  if (drawerPaused) {
    paused = false;
    drawerPaused = false;
  }
  audio.play(drawerReturnTrack);
  if (game?.state === 'travel' && dialog === 'travel-panel') land();
  previousFocus?.focus?.({ preventScroll: true });
}
const durations = ['3:09', '3:01', '3:45', '3:08', '3:33', '3:16', '3:19', '2:56', '3:08', '3:44'];
for (const [i, track] of TRACKS.entries()) {
  const button = document.createElement('button');
  button.className = 'track-row';
  button.innerHTML = `<span class="track-number">${String(i + 1).padStart(2, '0')}</span><span class="track-title">${track.title}<span class="track-role">${i === 0 ? 'TITLE' : `WORLD ${i} · ${WORLDS[i - 1].name.toUpperCase()}${i === SHIP_TRACK ? ' · SHIP WORKSHOP & TRAVEL' : ''}`}</span></span><span class="track-duration">${durations[i]}</span>`;
  button.addEventListener('click', () => {
    activateAudio();
    audio.play(i);
  });
  $('track-list').append(button);
}
$('launch-button').addEventListener('click', start);
$('skip-landing').addEventListener('click', () => {
  if (!paused && !drawer && !dialog) game?.finishLanding();
});
$('retry-button').addEventListener('click', () => {
  if (game?.state !== 'lost') {
    start();
    return;
  }
  activateAudio();
  game.retryWorld();
  closePanel();
  paused = false;
  renderer.snap = true;
  audio.duck(false);
  audio.play(WORLDS[game.world].track);
  updateWorld();
  toast(WORLDS[game.world].mechanic, 5);
});
$('home-button').addEventListener('click', home);
$('pause-button').addEventListener('click', pause);
$('resume-button').addEventListener('click', resume);
$('quit-button').addEventListener('click', home);
$('land-button').addEventListener('click', land);
$('ship-interact').addEventListener('click', interact);
$('upgrade-cancel').addEventListener('click', () => {
  closePanel();
  clearInput();
});
$('how-button').addEventListener('click', () => {
  activateAudio();
  if (audio.index < 0) audio.play(0);
  openPanel('briefing-panel');
});
$('briefing-close').addEventListener('click', closePanel);
$('soundtrack-button').addEventListener('click', openSoundtrack);
$('now-playing-button').addEventListener('click', openSoundtrack);
$('close-soundtrack').addEventListener('click', closeSoundtrack);
$('mute-button').addEventListener('click', () => {
  activateAudio();
  audio.toggle();
  if (audio.index < 0) audio.play(0);
  save('muted', audio.muted);
  updateMute();
});
$('music-volume').addEventListener('input', (e) => {
  audio.volume = Number(e.target.value) / 100;
  audio.update();
  save('volume', audio.volume);
});
$('fx-volume').addEventListener('input', (e) => {
  audio.fxVolume = Number(e.target.value) / 100;
  save('fx', audio.fxVolume);
});
$('assist-toggle').addEventListener('change', (e) => {
  assist = e.target.checked;
  if (game) game.assist = assist;
  save('assist', assist);
});
$('motion-toggle').addEventListener('change', (e) => {
  reduced = e.target.checked;
  renderer.reduced = reduced;
  document.body.classList.toggle('reduced-motion', reduced);
  save('motion', reduced);
});
function trapFocus(e) {
  const root = drawer ? $('soundtrack-drawer') : dialog ? $(dialog) : null;
  if (!root || e.code !== 'Tab') return;
  const focusable = [...root.querySelectorAll('button,input,a')].filter(
    (el) => !el.disabled && !el.classList.contains('hidden'),
  );
  if (!focusable.length) return;
  const first = focusable[0],
    last = focusable.at(-1);
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
document.addEventListener('keydown', (e) => {
  trapFocus(e);
  if (e.code === 'Escape') {
    e.preventDefault();
    if (drawer) closeSoundtrack();
    else if (dialog === 'briefing-panel') closePanel();
    else if (dialog === 'upgrade-panel') {
      closePanel();
      clearInput();
    } else if (dialog === 'pause-panel') resume();
    else if (!dialog) pause();
    return;
  }
  if (e.target instanceof HTMLInputElement) return;
  if (e.code === 'KeyM' && !e.repeat) {
    $('mute-button').click();
    return;
  }
  if (game?.state === 'landing' && !paused && !drawer && !dialog) {
    if (['Space', 'Enter'].includes(e.code)) {
      e.preventDefault();
      if (!e.repeat) game.finishLanding();
    } else if (e.code === 'KeyP' && !e.repeat) pause();
    return;
  }
  if (['playing', 'ship'].includes(game?.state) && !paused && !drawer && !dialog) {
    if (
      [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Space',
        'ShiftLeft',
        'ShiftRight',
      ].includes(e.code)
    )
      e.preventDefault();
    keys.add(e.code);
    if (game.state === 'ship') {
      if (e.code === 'KeyE') {
        e.preventDefault();
        if (!e.repeat) interact();
      }
    } else {
      if (!e.repeat && ['ShiftLeft', 'ShiftRight', 'KeyX'].includes(e.code)) actions.dash = true;
      if (!e.repeat && ['Space', 'KeyW', 'ArrowUp'].includes(e.code)) actions.jump = true;
      if (!e.repeat && e.code === 'KeyE') actions.pulse = true;
    }
    if (e.code === 'KeyP' && !e.repeat) pause();
  }
});
document.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => {
  clearInput();
  if (!drawer) pause();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInput();
    pause();
  }
});
$('game-canvas').addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button === 0) {
    pointer.down = true;
    pointer.x = e.offsetX;
    pointer.y = e.offsetY;
  }
});
$('game-canvas').addEventListener('pointermove', (e) => {
  pointer.x = e.offsetX;
  pointer.y = e.offsetY;
});
window.addEventListener('pointerup', () => (pointer.down = false));
let joystickId = null;
function joystickMove(e) {
  if (e.pointerId !== joystickId) return;
  const box = $('joystick').getBoundingClientRect(),
    x = e.clientX - box.left - box.width / 2,
    y = e.clientY - box.top - box.height / 2,
    len = Math.hypot(x, y),
    factor = Math.min(1, 34 / Math.max(1, len));
  touch.x = (x * factor) / 34;
  $('joystick-knob').style.transform = `translate(${x * factor}px,${y * factor}px)`;
}
$('joystick').addEventListener('pointerdown', (e) => {
  joystickId = e.pointerId;
  $('joystick').setPointerCapture(e.pointerId);
  joystickMove(e);
});
$('joystick').addEventListener('pointermove', joystickMove);
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
  $('joystick').addEventListener(name, () => {
    joystickId = null;
    touch.x = 0;
    $('joystick-knob').style.transform = '';
  });
$('touch-dash').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  actions.dash = true;
});
$('touch-pulse').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (game?.state === 'ship') interact();
  else actions.pulse = true;
});
$('touch-jump').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  $('touch-jump').setPointerCapture(e.pointerId);
  actions.jump = true;
  touch.jumpHeld = true;
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
  $('touch-jump').addEventListener(name, () => {
    touch.jumpHeld = false;
  });
new ResizeObserver(() => renderer.resize()).observe($('stage'));
function hud() {
  if (!game) return;
  if (game.ship) {
    updateShipHUD();
    return;
  }
  const p = game.player,
    percent = Math.ceil((p.hp / p.maxHp) * 100);
  $('hull-value').textContent = `${percent}%`;
  $('hull-fill').style.width = `${percent}%`;
  $('hull-fill').style.background = percent < 30 ? '#f5ad97' : '#d9f67e';
  $('score-value').textContent = String(game.score).padStart(6, '0');
  $('timer-value').textContent = formatTime(game.totalTime);
  $('objective').textContent = game.shipReady
    ? 'All cores secured. Reach the ship →'
    : game.bossSpawned && !game.bossDefeated
      ? 'Clear the Rootheart. Make this world safe.'
      : `Seed cores ${game.scanned}/${game.nodes.length} · ${WORLDS[game.world].mechanic}`;
  [...$('sample-pips').children].forEach((pip, i) =>
    pip.classList.toggle('filled', i < game.scanned),
  );
  $('dash-status').textContent = p.dashCd > 0 ? `${p.dashCd.toFixed(1)}s` : 'READY';
  $('pulse-status').textContent = p.pulseCd > 0 ? `${p.pulseCd.toFixed(1)}s` : 'READY';
  $('dash-fill').style.width = `${100 * (1 - p.dashCd / p.dashMax)}%`;
  $('pulse-fill').style.width = `${100 * (1 - p.pulseCd / 6)}%`;
  $('jump-status').textContent = p.inWater
    ? 'HOLD TO SWIM'
    : WORLDS[game.world].jet
      ? `FUEL ${Math.round((p.fuel / 1.4) * 100)}%`
      : p.grounded
        ? 'DOUBLE JUMP'
        : p.airJumps
          ? 'AIR JUMP READY'
          : 'LAND TO REFILL';
  $('route-progress-fill').style.width = `${(100 * p.x) / game.level.width}%`;
  const boss = game.enemies.find((e) => e.type === 'boss');
  show('boss-hud', !!boss);
  if (boss) $('boss-fill').style.width = `${(100 * boss.hp) / boss.maxHp}%`;
  renderer.minimap($('minimap'), game);
}
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const t = reduced ? 0 : now / 1000;
  if (game) {
    if (!paused && !dialog && !drawer) {
      const x =
        Number(keys.has('KeyD') || keys.has('ArrowRight')) -
        Number(keys.has('KeyA') || keys.has('ArrowLeft')) +
        touch.x;
      game.step(dt, {
        x,
        jump: actions.jump,
        jumpHeld: touch.jumpHeld || keys.has('Space') || keys.has('KeyW') || keys.has('ArrowUp'),
        down: keys.has('KeyS') || keys.has('ArrowDown'),
        dash: actions.dash,
        pulse: actions.pulse,
        aim: pointer.down ? renderer.screenToWorld(pointer.x, pointer.y) : null,
      });
      actions.jump = actions.dash = actions.pulse = false;
    }
    renderer.game(game, t, dt);
    if (game.state === 'landing') {
      const caption = landingFrame(game.landing.time, game.level.landing).caption;
      if ($('landing-caption').textContent !== caption) $('landing-caption').textContent = caption;
    }
    hudTimer += dt;
    if (hudTimer > 0.08) {
      hudTimer = 0;
      hud();
    }
    if (toastTimer > 0 && !paused && !dialog) {
      toastTimer -= dt;
      if (toastTimer <= 0) show('toast', false);
    }
  } else renderer.demo(t);
  requestAnimationFrame(frame);
}
updateBest();
requestAnimationFrame(frame);
if (new URLSearchParams(location.search).has('test'))
  window.__zest = {
    get game() {
      return game;
    },
    get paused() {
      return paused;
    },
    get audio() {
      return audio;
    },
    start,
    snapshot: () => game?.snapshot(),
    event,
  };
