// Authored platform routes. Coordinates use a 720-high world; y increases downwards.
const platform = (x, y, w, kind = 'stone', extra = {}) => ({
  x,
  y,
  w,
  h: kind === 'ground' ? 240 : 22,
  kind,
  oneWay: kind !== 'ground',
  ...extra,
});
const ground = (a, b, y = 620, extra = {}) => platform(a, y, b - a, 'ground', extra);
const ledge = (x, y, w = 180, kind = 'stone', extra = {}) => platform(x, y, w, kind, extra);
const moving = (x, y, w, axis, range, period = 4) =>
  ledge(x, y, w, 'moving', { axis, range, period });
const hazard = (x, y, w, h, kind = 'thorns', extra = {}) => ({ x, y, w, h, kind, ...extra });
const cell = (x, y) => ({ x, y, done: false });
const enemy = (x, y, type = 'crawler', range = 100) => ({ x, y, type, range });

const LEVELS = [
  {
    width: 4480,
    start: { x: 100, y: 594 },
    landing: { x: 160, y: 620, walkTo: 265 },
    exit: { x: 4330, y: 576 },
    platforms: [
      ground(0, 720),
      ground(890, 1550, 600),
      ground(1750, 2390),
      ground(2580, 3260, 590),
      ground(3430, 4480),
      ledge(310, 505, 170),
      ledge(560, 405, 140),
      ledge(1100, 465, 190),
      ledge(1390, 385, 140),
      ledge(1890, 495, 150),
      ledge(2130, 400, 180),
      ledge(2760, 455, 180),
      ledge(3080, 365, 150),
      ledge(3660, 495, 180),
      ledge(3900, 400, 200),
    ],
    hazards: [
      hazard(500, 601, 105, 19),
      hazard(1230, 581, 130, 19),
      hazard(2050, 601, 130, 19),
      hazard(2820, 571, 130, 19),
      hazard(3690, 601, 170, 19),
    ],
    cells: [cell(630, 360), cell(2210, 355), cell(3990, 355)],
    checkpoints: [
      { x: 1030, y: 574 },
      { x: 2700, y: 564 },
      { x: 3540, y: 594 },
    ],
    enemies: [
      enemy(1080, 575),
      enemy(1840, 595),
      enemy(2460, 400, 'flyer', 160),
      enemy(3020, 565, 'spitter'),
      enemy(4050, 595, 'charger'),
    ],
    signs: [
      { x: 160, y: 535, text: 'SPACE / ↑  JUMP · AGAIN TO DOUBLE-JUMP' },
      { x: 530, y: 325, text: 'COLLECT ALL 5 SEED CORES' },
      { x: 700, y: 550, text: 'SHIFT / X  AIR DASH →' },
      { x: 1520, y: 515, text: 'PITS RETURN YOU TO YOUR LAST BEACON' },
    ],
  },
  {
    width: 4700,
    thrustDisabled: true,
    arrivalMessage: 'Your thruster got hit by a laser. It will self repair soon.',
    start: { x: 100, y: 594 },
    exit: { x: 4550, y: 576 },
    platforms: [
      ground(0, 600),
      ground(800, 1350),
      ground(1530, 2130),
      ground(2360, 3100),
      ground(3300, 3850),
      ground(4050, 4700),
      ledge(350, 500, 140),
      moving(650, 520, 125, 'y', 110, 4),
      ledge(970, 420, 200),
      ledge(1240, 335, 130),
      ledge(1680, 505, 150),
      moving(2040, 445, 140, 'x', 170, 4.5),
      ledge(2420, 380, 200),
      ledge(2750, 485, 160),
      moving(3150, 480, 130, 'y', 100, 3.7),
      ledge(3500, 400, 230),
      ledge(4110, 495, 170),
      ledge(4340, 400, 170),
    ],
    hazards: [
      hazard(1060, 375, 18, 245, 'laser', { period: 3.2, on: 1.2, phase: 0 }),
      hazard(1840, 440, 18, 180, 'laser', { period: 3.6, on: 1.1, phase: 1.7 }),
      hazard(2825, 365, 18, 255, 'laser', { period: 3.1, on: 1.1, phase: 0.8 }),
      hazard(3610, 355, 18, 265, 'laser', { period: 3.4, on: 1.4, phase: 1.7 }),
      hazard(4220, 601, 90, 19, 'spikes'),
    ],
    cells: [cell(1300, 290), cell(2520, 335), cell(4430, 355)],
    checkpoints: [
      { x: 1590, y: 594 },
      { x: 2450, y: 594 },
      { x: 4120, y: 594 },
    ],
    enemies: [
      enemy(940, 595, 'charger'),
      enemy(1710, 480, 'spitter'),
      enemy(2650, 420, 'flyer', 140),
      enemy(3450, 595),
      enemy(4310, 595, 'spitter'),
    ],
    signs: [
      { x: 220, y: 550, text: 'FREIGHT LIFTS · RIDE THE GLOWING PLATFORMS' },
      { x: 980, y: 330, text: 'LASERS PULSE · DASH THROUGH THE LIGHT' },
    ],
  },
  {
    width: 5100,
    start: { x: 100, y: 594 },
    exit: { x: 4950, y: 576 },
    platforms: [
      ground(0, 540),
      ground(1420, 1750),
      ground(2780, 3090),
      ground(4300, 5100),
      ledge(710, 515, 170),
      ledge(1050, 405, 180),
      ledge(1910, 480, 170),
      ledge(2260, 350, 190),
      ledge(2510, 510, 130),
      ledge(3250, 450, 180),
      moving(3620, 340, 170, 'y', 90, 5),
      ledge(3980, 490, 160),
      ledge(4510, 450, 170),
    ],
    hazards: [
      hazard(890, 245, 120, 120, 'rock'),
      hazard(2010, 75, 130, 120, 'rock'),
      hazard(3370, 75, 160, 130, 'rock'),
      hazard(4550, 601, 130, 19, 'spikes'),
    ],
    zones: [
      { x: 1800, y: 0, w: 850, h: 850, wind: 70 },
      { x: 3170, y: 0, w: 1000, h: 850, wind: -55 },
    ],
    cells: [cell(1130, 360), cell(2350, 305), cell(3690, 210)],
    checkpoints: [
      { x: 1510, y: 594 },
      { x: 2860, y: 594 },
      { x: 4380, y: 594 },
    ],
    enemies: [
      enemy(1160, 260, 'flyer', 170),
      enemy(2400, 220, 'flyer', 190),
      enemy(3460, 330, 'flyer', 190),
      enemy(4650, 595, 'spitter'),
    ],
    signs: [
      { x: 150, y: 535, text: 'HOLD JUMP TO THRUST · LAND TO REFILL FUEL' },
      { x: 1470, y: 535, text: 'WATCH YOUR FUEL · ASTEROIDS AHEAD' },
    ],
  },
  {
    width: 4900,
    start: { x: 100, y: 594 },
    exit: { x: 4750, y: 576 },
    platforms: [
      ground(0, 590),
      ground(1870, 2200),
      ground(3340, 3650),
      ground(4390, 4900),
      ledge(710, 500, 170),
      moving(1030, 405, 180, 'x', 115, 5),
      ledge(1430, 315, 200),
      moving(1680, 475, 150, 'y', 90, 4),
      ledge(2350, 465, 180),
      moving(2640, 345, 160, 'y', 100, 4.6),
      ledge(2980, 455, 190),
      ledge(3780, 495, 170),
      moving(4050, 370, 180, 'x', 100, 4.5),
      ledge(4460, 430, 170),
    ],
    hazards: [
      hazard(1480, 100, 90, 90, 'orbit', { axis: 'y', range: 80, period: 3 }),
      hazard(2810, 500, 85, 85, 'orbit', { axis: 'y', range: 100, period: 4 }),
      hazard(4080, 140, 85, 85, 'orbit', { axis: 'x', range: 95, period: 3.8 }),
    ],
    cells: [cell(1520, 270), cell(2720, 195), cell(4550, 385)],
    checkpoints: [
      { x: 1970, y: 594 },
      { x: 3440, y: 594 },
    ],
    enemies: [
      enemy(1110, 270, 'flyer', 180),
      enemy(2470, 340, 'flyer', 160),
      enemy(3500, 595, 'spitter'),
      enemy(4170, 250, 'flyer', 160),
    ],
    signs: [
      { x: 180, y: 530, text: 'LOW GRAVITY · THE ISLANDS DRIFT' },
      { x: 1930, y: 530, text: 'LOOK FOR THE HIGH ROUTE · FOLLOW THE SEEDS' },
    ],
  },
  {
    width: 4650,
    thrustDisabled: true,
    arrivalMessage: 'There is jelly stuck in your thrusters. It will evaporate soon.',
    start: { x: 100, y: 594 },
    exit: { x: 4500, y: 576 },
    platforms: [
      ground(0, 720),
      ground(1160, 1600),
      ground(2050, 2440),
      ground(2850, 3320),
      ground(3800, 4650),
      ledge(470, 600, 135, 'bounce'),
      ledge(850, 380, 200, 'jelly'),
      ledge(1330, 600, 135, 'bounce'),
      ledge(1690, 320, 210, 'jelly'),
      ledge(2210, 600, 135, 'bounce'),
      ledge(2520, 355, 190, 'jelly'),
      moving(2720, 435, 120, 'y', 70, 4),
      ledge(3020, 600, 135, 'bounce'),
      ledge(3420, 300, 220, 'jelly'),
      ledge(3980, 500, 160),
      ledge(4250, 395, 180),
    ],
    hazards: [
      hazard(870, 80, 90, 80, 'spore', { axis: 'x', range: 90, period: 4 }),
      hazard(1770, 70, 90, 80, 'spore', { axis: 'y', range: 60, period: 3 }),
      hazard(3440, 70, 90, 80, 'spore', { axis: 'x', range: 100, period: 4.2 }),
      hazard(4080, 601, 95, 19, 'thorns'),
    ],
    cells: [cell(1780, 275), cell(2610, 310), cell(3520, 255)],
    checkpoints: [
      { x: 1240, y: 594 },
      { x: 2930, y: 594 },
      { x: 3870, y: 594 },
    ],
    enemies: [
      enemy(1420, 470, 'flyer', 150),
      enemy(2310, 480, 'flyer', 130),
      enemy(3200, 595, 'spitter'),
      enemy(4300, 370, 'spitter'),
    ],
    signs: [
      { x: 160, y: 535, text: 'JELLY PADS BOUNCE · STEER WHILE AIRBORNE' },
      { x: 1190, y: 530, text: 'ONE GOOD BOUNCE CAN REACH THE UPPER ROUTE' },
    ],
  },
  {
    width: 5050,
    start: { x: 100, y: 594 },
    exit: { x: 4900, y: 576 },
    platforms: [
      ground(0, 620),
      ground(1530, 1840),
      ground(2760, 3140),
      ground(4150, 5050),
      ledge(760, 550, 170, 'crumble'),
      ledge(1030, 460, 160, 'crumble'),
      ledge(1290, 370, 160, 'crumble'),
      ledge(1670, 465, 170),
      ledge(1990, 520, 150, 'crumble'),
      ledge(2250, 425, 180, 'crumble'),
      ledge(2500, 335, 160, 'crumble'),
      ledge(2910, 475, 160),
      ledge(3290, 525, 160, 'crumble'),
      ledge(3550, 420, 170, 'crumble'),
      ledge(3830, 335, 180, 'crumble'),
      ledge(4280, 490, 170),
      ledge(4560, 385, 190),
    ],
    hazards: [
      hazard(1700, 260, 100, 110, 'crusher', { range: 230, period: 3.8 }),
      hazard(2910, 250, 100, 120, 'crusher', { range: 245, period: 4.1 }),
      hazard(4330, 260, 110, 120, 'crusher', { range: 235, period: 3.6 }),
      hazard(4710, 601, 100, 19, 'thorns'),
    ],
    cells: [cell(1370, 325), cell(2580, 290), cell(4650, 340)],
    checkpoints: [
      { x: 1590, y: 594 },
      { x: 2830, y: 594 },
      { x: 4210, y: 594 },
    ],
    enemies: [
      enemy(1770, 595, 'charger'),
      enemy(2400, 290, 'flyer', 160),
      enemy(3040, 595, 'spitter'),
      enemy(4540, 595, 'charger'),
    ],
    signs: [
      { x: 200, y: 535, text: 'BRITTLE ROOTS · JUMP BEFORE THEY CRUMBLE' },
      { x: 1580, y: 535, text: 'SEED PRESSES · WAIT FOR THE UPSWING' },
    ],
  },
  {
    width: 4900,
    start: { x: 100, y: 594 },
    exit: { x: 4750, y: 576 },
    platforms: [
      ground(0, 630),
      ground(630, 4300, 740),
      ground(4300, 4900),
      ledge(850, 550, 200, 'reef'),
      ledge(1300, 390, 180, 'reef'),
      ledge(1900, 590, 240, 'reef'),
      ledge(2400, 280, 220, 'reef'),
      ledge(2950, 495, 200, 'reef'),
      ledge(3530, 340, 220, 'reef'),
      ledge(3990, 525, 170, 'reef'),
    ],
    water: { x: 600, y: 190, w: 3720, h: 610 },
    zones: [
      { x: 900, y: 190, w: 900, h: 520, wind: 110 },
      { x: 2350, y: 190, w: 800, h: 520, wind: -120 },
      { x: 3500, y: 190, w: 700, h: 520, wind: 100 },
    ],
    hazards: [
      hazard(1110, 650, 180, 90, 'coral'),
      hazard(1710, 190, 130, 210, 'coral'),
      hazard(2180, 605, 180, 135, 'coral'),
      hazard(2860, 190, 120, 190, 'coral'),
      hazard(3270, 600, 180, 140, 'coral'),
      hazard(3890, 190, 110, 180, 'coral'),
    ],
    cells: [cell(1400, 340), cell(2480, 230), cell(3610, 290)],
    checkpoints: [
      { x: 700, y: 660 },
      { x: 2100, y: 535 },
      { x: 4050, y: 475 },
      { x: 4400, y: 594 },
    ],
    enemies: [
      enemy(1550, 510, 'flyer', 150),
      enemy(2610, 450, 'flyer', 170),
      enemy(3730, 470, 'flyer', 140),
      enemy(4510, 595, 'spitter'),
    ],
    signs: [
      { x: 160, y: 535, text: 'WATER AHEAD · HOLD JUMP TO SWIM UP' },
      { x: 850, y: 250, text: 'RIDE THE CURRENTS · KEEP CLEAR OF CORAL' },
    ],
    thrusterWet: true,
    arrivalMessage: 'Your thruster got wet, it no longer works.',
  },
  {
    width: 4950,
    start: { x: 100, y: 594 },
    exit: { x: 4800, y: 576 },
    platforms: [
      ground(0, 880, 620, { conveyor: 95 }),
      ground(1050, 1900, 620, { conveyor: -85 }),
      ground(2100, 2950, 620, { conveyor: 120 }),
      ground(3140, 3900, 620, { conveyor: -100 }),
      ground(4090, 4950, 620, { conveyor: 110 }),
      ledge(450, 475, 180),
      ledge(740, 385, 150),
      ledge(1250, 470, 180),
      ledge(1570, 375, 180),
      ledge(2280, 460, 200),
      ledge(2600, 355, 170),
      moving(2990, 480, 120, 'y', 95, 3.6),
      ledge(3330, 465, 180),
      ledge(3640, 365, 170),
      ledge(4240, 480, 190),
      ledge(4530, 390, 190),
    ],
    hazards: [
      hazard(680, 435, 65, 185, 'vent', { period: 3, on: 0.85, phase: 0.3 }),
      hazard(1410, 420, 65, 200, 'vent', { period: 3.4, on: 1.1, phase: 1.2 }),
      hazard(2420, 405, 70, 215, 'vent', { period: 3.1, on: 1, phase: 0.7 }),
      hazard(3450, 410, 70, 210, 'vent', { period: 3.3, on: 1.1, phase: 1.7 }),
      hazard(4390, 410, 70, 210, 'vent', { period: 2.8, on: 0.9, phase: 0.1 }),
    ],
    cells: [cell(820, 340), cell(2680, 310), cell(4610, 345)],
    checkpoints: [
      { x: 1140, y: 594 },
      { x: 2160, y: 594 },
      { x: 4180, y: 594 },
    ],
    enemies: [
      enemy(1320, 595, 'charger'),
      enemy(2340, 435, 'spitter'),
      enemy(3590, 595, 'charger'),
      enemy(4650, 595, 'spitter'),
    ],
    signs: [
      { x: 150, y: 535, text: 'CONVEYORS CARRY MOMENTUM INTO YOUR JUMPS' },
      { x: 1120, y: 535, text: 'JUICE VENTS HISS BEFORE THEY ERUPT' },
    ],
    arrivalMessage: 'Your thruster dried off!',
  },
  {
    width: 5650,
    thrustDisabled: true,
    arrivalMessage: 'The Rootheart has jammed your thrusters. Little legs, big finale!',
    start: { x: 100, y: 594 },
    exit: { x: 5480, y: 576 },
    platforms: [
      ground(0, 640),
      ground(1820, 2180),
      ground(3300, 5650),
      ledge(780, 535, 170, 'phase', { period: 4, phase: 0 }),
      ledge(1040, 445, 170, 'phase', { period: 4, phase: 0.3 }),
      ledge(1330, 350, 180, 'phase', { period: 4, phase: 0.6 }),
      moving(1570, 500, 170, 'x', 60, 4),
      ledge(1960, 455, 180),
      ledge(2350, 520, 160, 'crumble'),
      ledge(2600, 420, 170, 'phase', { period: 4.4, phase: 0.5 }),
      ledge(2880, 330, 180, 'phase', { period: 4.4, phase: 1 }),
      ledge(3080, 500, 170),
      ledge(3470, 470, 180),
      ledge(3750, 370, 190),
      ledge(4230, 475, 180),
      ledge(4750, 430, 180),
      ledge(5160, 490, 160),
    ],
    hazards: [
      hazard(3660, 601, 120, 19, 'thorns'),
      hazard(2470, 120, 75, 75, 'orbit', { axis: 'y', range: 100, period: 4 }),
    ],
    cells: [cell(1420, 305), cell(2960, 285), cell(3840, 325)],
    checkpoints: [
      { x: 1900, y: 594 },
      { x: 3380, y: 594 },
      { x: 4150, y: 594 },
    ],
    enemies: [
      enemy(1160, 280, 'flyer', 150),
      enemy(2030, 595, 'charger'),
      enemy(2800, 240, 'flyer', 150),
      enemy(3530, 595, 'spitter'),
    ],
    boss: { x: 4880, y: 510 },
    signs: [
      { x: 160, y: 535, text: 'PHASE BRIDGES FLICKER · WAIT, THEN COMMIT' },
      { x: 3350, y: 535, text: 'ALL FIVE SEEDS UNLOCK THE HABITAT' },
      { x: 4200, y: 335, text: 'ROOTHEART · JUMP ITS LOW SHOTS · PULSE THE SWARM' },
    ],
  },
];

// Insert two authored chapters into each route, preserving existing jump distances.
// Cuts sit on safe floor between cores; coordinates here refer to the original route.
const CHAPTER_CUTS = [
  [1040, 2990],
  [1600, 3350],
  [1580, 2930],
  [2030, 3500],
  [2100, 3220],
  [1560, 2800],
  [1700, 3200],
  [1800, 3830],
  [1960, 3400],
];
const CHAPTER_LENGTH = 1600;
export const CORES_PER_WORLD = 5;

function chapter(index, variant) {
  let platforms,
    hazards,
    cells,
    checkpoints,
    enemies,
    zones = [],
    sign;
  if (index === 0) {
    platforms = variant
      ? [
          ground(0, 400),
          ground(610, 1020),
          ground(1210, 1600),
          ledge(220, 495),
          ledge(500, 390),
          ledge(790, 300),
          ledge(1100, 420),
          ledge(1330, 335),
        ]
      : [
          ground(0, 350),
          ground(520, 900),
          ground(1080, 1600),
          ledge(180, 500),
          ledge(430, 415),
          ledge(700, 340),
          ledge(1010, 450),
          ledge(1260, 355),
        ];
    cells = [cell(variant ? 880 : 790, variant ? 255 : 295)];
    hazards = [
      hazard(180, 601, 105, 19),
      hazard(variant ? 700 : 620, 601, 125, 19),
      hazard(1330, 601, 110, 19),
    ];
    checkpoints = [
      { x: 100, y: 594 },
      { x: variant ? 950 : 820, y: 594 },
    ];
    enemies = [
      enemy(560, variant ? 365 : 390, 'spitter'),
      enemy(1000, 240, 'flyer', 100),
      enemy(1450, 595, 'charger'),
    ];
    sign = 'THE OLD QUARTER · KEEP TO THE ROOFTOPS';
  } else if (index === 1) {
    platforms = variant
      ? [
          ground(0, 360),
          ground(650, 980),
          ground(1250, 1600),
          ledge(160, 500),
          moving(440, 440, 150, 'y', 85, 4),
          ledge(730, 340),
          moving(1030, 390, 150, 'x', 85, 4.8),
          ledge(1310, 450),
        ]
      : [
          ground(0, 440),
          ground(660, 1100),
          ground(1300, 1600),
          ledge(250, 500),
          moving(480, 440, 150, 'x', 90, 4.5),
          ledge(820, 360),
          moving(1110, 480, 150, 'y', 75, 3.8),
          ledge(1340, 400),
        ];
    cells = [cell(variant ? 820 : 910, variant ? 295 : 315)];
    hazards = [
      hazard(variant ? 610 : 740, 395, 18, 225, 'laser', { period: 3.7, on: 1.2, phase: 0.9 }),
      hazard(1210, 375, 18, 245, 'laser', { period: 3.5, on: 1.1, phase: 2 }),
    ];
    checkpoints = [
      { x: 100, y: 594 },
      { x: variant ? 900 : 1030, y: 594 },
    ];
    enemies = [
      enemy(370, 595, 'charger'),
      enemy(variant ? 810 : 910, 250, 'flyer', 100),
      enemy(1430, 595, 'spitter'),
    ];
    sign = 'FREIGHT ANNEX · TIME THE LIFTS AND LASERS';
  } else if (index === 2) {
    platforms = variant
      ? [
          ground(0, 260),
          ground(680, 970),
          ground(1360, 1600),
          ledge(410, 460),
          ledge(800, 335),
          ledge(1100, 445),
          moving(1280, 335, 150, 'y', 70, 4.5),
        ]
      : [
          ground(0, 300),
          ground(730, 980),
          ground(1380, 1600),
          ledge(470, 490),
          ledge(850, 370),
          ledge(1150, 460),
          ledge(1340, 370),
        ];
    cells = [cell(variant ? 890 : 940, variant ? 290 : 325)];
    hazards = [hazard(560, 140, 100, 95, 'rock'), hazard(1080, 135, 115, 100, 'rock')];
    zones = [{ x: 330, y: 0, w: 950, h: 850, wind: variant ? -80 : 80 }];
    checkpoints = [
      { x: 100, y: 594 },
      { x: 790, y: 594 },
    ];
    enemies = [
      enemy(540, 300, 'flyer', 95),
      enemy(1050, 240, 'flyer', 110),
      enemy(1460, 595, 'spitter'),
    ];
    sign = 'DEEP-SPACE TRANSFER · REST TO REFILL JET FUEL';
  } else if (index === 3) {
    platforms = variant
      ? [
          ground(0, 360),
          ground(1030, 1250),
          ground(1460, 1600),
          ledge(260, 515),
          moving(570, 420, 170, 'x', 80, 4.7),
          ledge(850, 320),
          ledge(1150, 460),
          ledge(1360, 365),
        ]
      : [
          ground(0, 300),
          ground(900, 1150),
          ground(1400, 1600),
          moving(470, 500, 170, 'x', 70, 4),
          ledge(750, 390),
          moving(1140, 370, 150, 'y', 65, 4.5),
          ledge(1320, 450),
        ];
    cells = [cell(variant ? 940 : 840, variant ? 275 : 345)];
    hazards = [
      hazard(640, 120, 70, 70, 'orbit', { axis: 'y', range: 75, period: 3.8 }),
      hazard(1230, 190, 70, 70, 'orbit', { axis: 'x', range: 65, period: 4.3 }),
    ];
    checkpoints = [
      { x: 100, y: 594 },
      { x: variant ? 1100 : 1010, y: 594 },
    ];
    enemies = [
      enemy(560, 290, 'flyer', 100),
      enemy(1080, 240, 'flyer', 100),
      enemy(1510, 595, 'spitter'),
    ];
    sign = 'THE DRIFT GARDENS · WAIT FOR YOUR ISLAND';
  } else if (index === 4) {
    platforms = variant
      ? [
          ground(0, 400),
          ground(700, 1070),
          ground(1350, 1600),
          ledge(240, 600, 135, 'bounce'),
          ledge(520, 335, 190, 'jelly'),
          ledge(860, 600, 135, 'bounce'),
          ledge(1120, 280, 190, 'jelly'),
          ledge(1410, 450),
        ]
      : [
          ground(0, 360),
          ground(660, 1040),
          ground(1320, 1600),
          ledge(170, 600, 135, 'bounce'),
          ledge(430, 340, 190, 'jelly'),
          ledge(750, 600, 135, 'bounce'),
          ledge(1040, 310, 190, 'jelly'),
          ledge(1330, 450),
        ];
    cells = [cell(variant ? 1210 : 1130, variant ? 235 : 265)];
    hazards = [
      hazard(500, 110, 70, 70, 'spore', { axis: 'x', range: 70, period: 4 }),
      hazard(1130, 70, 65, 65, 'spore', { axis: 'y', range: 40, period: 3.5 }),
    ];
    checkpoints = [
      { x: 100, y: 594 },
      { x: variant ? 1030 : 980, y: 594 },
    ];
    enemies = [
      enemy(500, 250, 'flyer', 90),
      enemy(990, 400, 'flyer', 90),
      enemy(1490, 595, 'spitter'),
    ];
    sign = 'UPPER JELLY FIELDS · BOUNCE, THEN AIR-STEER';
  } else if (index === 5) {
    platforms = variant
      ? [
          ground(0, 400),
          ground(900, 1180),
          ground(1390, 1600),
          ledge(490, 520, 170, 'crumble'),
          ledge(750, 420, 170, 'crumble'),
          ledge(990, 315),
          ledge(1220, 440, 170, 'crumble'),
          ledge(1420, 350),
        ]
      : [
          ground(0, 350),
          ground(870, 1100),
          ground(1370, 1600),
          ledge(470, 530, 170, 'crumble'),
          ledge(710, 440, 170, 'crumble'),
          ledge(940, 350),
          ledge(1200, 450, 170, 'crumble'),
          ledge(1400, 380),
        ];
    cells = [cell(variant ? 1080 : 1030, variant ? 270 : 305)];
    hazards = [
      hazard(variant ? 530 : 980, variant ? 220 : 160, 95, 100, 'crusher', {
        range: variant ? 240 : 210,
        period: 4,
      }),
      hazard(1460, 601, 85, 19, 'thorns'),
    ];
    checkpoints = [
      { x: 100, y: 594 },
      { x: variant ? 930 : 900, y: 594 },
    ];
    enemies = [
      enemy(570, 300, 'flyer', 80),
      enemy(1080, 230, 'flyer', 85),
      enemy(1510, 595, 'charger'),
    ];
    sign = 'THE DEEP ROOTS · KEEP A JUMP IN RESERVE';
  } else if (index === 6) {
    platforms = variant
      ? [
          ground(0, 1600, 740),
          ledge(200, 480, 180, 'reef'),
          ledge(600, 300, 180, 'reef'),
          ledge(980, 550, 190, 'reef'),
          ledge(1300, 330, 180, 'reef'),
        ]
      : [
          ground(0, 1600, 740),
          ledge(250, 560, 180, 'reef'),
          ledge(620, 400, 180, 'reef'),
          ledge(960, 280, 190, 'reef'),
          ledge(1270, 520, 180, 'reef'),
        ];
    cells = [cell(variant ? 690 : 1050, variant ? 250 : 230)];
    hazards = variant
      ? [hazard(430, 590, 150, 150, 'coral'), hazard(860, 190, 115, 260, 'coral')]
      : [hazard(520, 190, 115, 250, 'coral'), hazard(1120, 590, 150, 150, 'coral')];
    zones = [
      { x: 180, y: 190, w: 540, h: 520, wind: variant ? -110 : 130 },
      { x: 820, y: 190, w: 550, h: 520, wind: variant ? 120 : -100 },
    ];
    checkpoints = variant
      ? [
          { x: 290, y: 454 },
          { x: 1350, y: 304 },
        ]
      : [
          { x: 310, y: 534 },
          { x: 1350, y: 494 },
        ];
    enemies = [
      enemy(400, 380, 'flyer', 80),
      enemy(820, 450, 'flyer', 90),
      enemy(1370, 420, 'flyer', 90),
    ];
    sign = 'THE SUNKEN GARDENS · FOLLOW THE CLEAR WATER';
  } else if (index === 7) {
    platforms = variant
      ? [
          ground(0, 380, 620, { conveyor: -130 }),
          ground(580, 1030, 620, { conveyor: 150 }),
          ground(1260, 1600, 620, { conveyor: -90 }),
          ledge(170, 495),
          ledge(450, 395),
          ledge(760, 310),
          moving(1080, 450, 150, 'y', 70, 4),
          ledge(1320, 360),
        ]
      : [
          ground(0, 440, 620, { conveyor: 120 }),
          ground(650, 1050, 620, { conveyor: -100 }),
          ground(1250, 1600, 620, { conveyor: 135 }),
          ledge(250, 475),
          ledge(520, 380),
          ledge(820, 290),
          ledge(1120, 420),
          ledge(1360, 330),
        ];
    cells = [cell(variant ? 850 : 910, variant ? 265 : 245)];
    hazards = [
      hazard(variant ? 660 : 390, 405, 65, 215, 'vent', { period: 3.4, on: 1, phase: 1.1 }),
      hazard(variant ? 1330 : 960, 400, 65, 220, 'vent', { period: 3.7, on: 1.1, phase: 2 }),
    ];
    checkpoints = [
      { x: 100, y: 594 },
      { x: variant ? 820 : 760, y: 594 },
    ];
    enemies = [
      enemy(270, 595, 'charger'),
      enemy(900, 220, 'flyer', 85),
      enemy(1450, 595, 'spitter'),
    ];
    sign = 'THE PRESSING LINE · RIDE THE BELTS, MIND THE VENTS';
  } else {
    platforms = variant
      ? [
          ground(0, 350),
          ground(950, 1200),
          ground(1430, 1600),
          ledge(490, 530, 170, 'crumble'),
          ledge(740, 430, 170, 'phase', { period: 4.5, phase: 0.4 }),
          ledge(1010, 330),
          ledge(1260, 450, 170, 'phase', { period: 4.5, phase: 1 }),
        ]
      : [
          ground(0, 300),
          ground(980, 1180),
          ground(1400, 1600),
          ledge(440, 520, 170, 'phase', { period: 4.3, phase: 0 }),
          ledge(690, 420, 170, 'phase', { period: 4.3, phase: 0.4 }),
          ledge(940, 330),
          moving(1210, 450, 160, 'x', 60, 4.6),
        ];
    cells = [cell(variant ? 1100 : 1030, 285)];
    hazards = [
      hazard(variant ? 620 : 760, 140, 70, 70, 'orbit', { axis: 'y', range: 65, period: 4 }),
    ];
    checkpoints = [
      { x: 100, y: 594 },
      { x: variant ? 1040 : 1080, y: 594 },
    ];
    enemies = [
      enemy(480, 310, 'flyer', 90),
      enemy(1100, 240, 'flyer', 90),
      enemy(1510, 595, 'charger'),
    ];
    sign = 'THE LAST CROSSING · EVERY SEED IS A PROMISE';
  }
  return {
    platforms,
    hazards,
    cells,
    checkpoints,
    enemies,
    zones,
    // Introduce this guide in the first chapter only; the later chapter repeats it.
    signs: variant ? [] : [{ x: 100, y: index === 6 ? 250 : 520, text: sign }],
  };
}

function insertChapter(level, index, cut, variant) {
  const floor = level.platforms.find((p) => !p.oneWay && cut >= p.x && cut < p.x + p.w);
  if (!floor) throw new Error(`Chapter needs safe floor at ${cut}`);
  const dy = index === 6 ? 0 : floor.y - 620;
  const part = chapter(index, variant);
  // Split floor/current rectangles at the seam rather than stretching existing gaps.
  const split = (items) =>
    items.flatMap((item) => {
      if (item.x >= cut) return [{ ...item, x: item.x + CHAPTER_LENGTH }];
      if (item.x + item.w > cut)
        return [
          { ...item, w: cut - item.x },
          { ...item, x: cut + CHAPTER_LENGTH, w: item.x + item.w - cut },
        ];
      return [item];
    });
  level.platforms = split(level.platforms);
  level.zones = split(level.zones ?? []);
  for (const name of ['hazards', 'cells', 'checkpoints', 'enemies', 'signs'])
    for (const item of level[name]) if (item.x >= cut) item.x += CHAPTER_LENGTH;
  for (const name of ['platforms', 'hazards', 'cells', 'checkpoints', 'enemies', 'zones', 'signs'])
    level[name].push(...part[name].map((item) => ({ ...item, x: item.x + cut, y: item.y + dy })));
  if (level.water) {
    if (level.water.x >= cut) level.water.x += CHAPTER_LENGTH;
    else if (level.water.x + level.water.w > cut) level.water.w += CHAPTER_LENGTH;
  }
  if (level.boss && level.boss.x >= cut) level.boss.x += CHAPTER_LENGTH;
  if (level.exit.x >= cut) level.exit.x += CHAPTER_LENGTH;
  level.width += CHAPTER_LENGTH;
}

const EXPEDITIONS = LEVELS.map((original, index) => {
  const level = structuredClone(original);
  level.baseWidth = level.width;
  // Work from right to left so both insertion points stay in original coordinates.
  insertChapter(level, index, CHAPTER_CUTS[index][1], 1);
  insertChapter(level, index, CHAPTER_CUTS[index][0], 0);
  level.cells.sort((a, b) => a.x - b.x);
  level.checkpoints.sort((a, b) => a.x - b.x);
  return level;
});

export function createLevel(index) {
  const level = structuredClone(EXPEDITIONS[index]);
  if (level.arrivalMessage)
    level.signs.unshift({
      x: level.start.x,
      y: level.start.y - 110,
      text: level.arrivalMessage,
    });
  level.platforms.forEach((p, i) => {
    p.id = i;
    p.baseX = p.x;
    p.baseY = p.y;
    p.dx = 0;
    p.dy = 0;
    p.solid = true;
    p.crumble = 0;
    p.restore = 0;
  });
  level.hazards.forEach((h) => {
    h.baseX = h.x;
    h.baseY = h.y;
    h.active = true;
    h.warning = false;
  });
  level.checkpoints.forEach((c) => (c.active = false));
  level.zones ??= [];
  level.zest = level.platforms
    .filter((p) => p.oneWay)
    .flatMap((p) => [0.25, 0.5, 0.75].map((f) => ({ x: p.x + p.w * f, y: p.y - 50, done: false })));
  level.medkits = level.checkpoints.map((c) => ({ x: c.x + 55, y: c.y - 10, done: false }));
  return level;
}
export const TOTAL_CELLS = EXPEDITIONS.reduce((n, l) => n + l.cells.length, 0);
