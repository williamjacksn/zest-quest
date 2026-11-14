// Original, code-painted pixel assets. All textures are cached; no network or image downloads.
import { seededRandom } from './core.js';
const TAU = Math.PI * 2;
const FONT = {
  '↑': '00100/01110/10101/00100/00100/00100/00000',
  '↓': '00000/00100/00100/00100/10101/01110/00100',
  A: '01110/10001/10001/11111/10001/10001/10001',
  B: '11110/10001/10001/11110/10001/10001/11110',
  C: '01111/10000/10000/10000/10000/10000/01111',
  D: '11110/10001/10001/10001/10001/10001/11110',
  E: '11111/10000/10000/11110/10000/10000/11111',
  F: '11111/10000/10000/11110/10000/10000/10000',
  G: '01111/10000/10000/10111/10001/10001/01110',
  H: '10001/10001/10001/11111/10001/10001/10001',
  I: '111/010/010/010/010/010/111',
  J: '00111/00010/00010/00010/10010/10010/01100',
  K: '10001/10010/10100/11000/10100/10010/10001',
  L: '10000/10000/10000/10000/10000/10000/11111',
  M: '10001/11011/10101/10101/10001/10001/10001',
  N: '10001/11001/10101/10011/10001/10001/10001',
  O: '01110/10001/10001/10001/10001/10001/01110',
  P: '11110/10001/10001/11110/10000/10000/10000',
  Q: '01110/10001/10001/10001/10101/10010/01101',
  R: '11110/10001/10001/11110/10100/10010/10001',
  S: '01111/10000/10000/01110/00001/00001/11110',
  T: '11111/00100/00100/00100/00100/00100/00100',
  U: '10001/10001/10001/10001/10001/10001/01110',
  V: '10001/10001/10001/10001/10001/01010/00100',
  W: '10001/10001/10001/10101/10101/10101/01010',
  X: '10001/10001/01010/00100/01010/10001/10001',
  Y: '10001/10001/01010/00100/00100/00100/00100',
  Z: '11111/00001/00010/00100/01000/10000/11111',
  0: '01110/10001/10011/10101/11001/10001/01110',
  1: '010/110/010/010/010/010/111',
  2: '01110/10001/00001/00010/00100/01000/11111',
  3: '11110/00001/00001/01110/00001/00001/11110',
  4: '10010/10010/10010/11111/00010/00010/00010',
  5: '11111/10000/10000/11110/00001/00001/11110',
  6: '01110/10000/10000/11110/10001/10001/01110',
  7: '11111/00001/00010/00100/01000/01000/01000',
  8: '01110/10001/10001/01110/10001/10001/01110',
  9: '01110/10001/10001/01111/00001/00001/01110',
  ' ': '000/000/000/000/000/000/000',
  '-': '000/000/000/111/000/000/000',
  '+': '00000/00100/00100/11111/00100/00100/00000',
  '/': '00001/00001/00010/00100/01000/10000/10000',
  ':': '0/1/0/0/1/0/0',
  '.': '0/0/0/0/0/0/1',
  ',': '00/00/00/00/00/01/10',
  '!': '1/1/1/1/1/0/1',
  '?': '1110/0001/0001/0110/0100/0000/0100',
  '>': '100/010/001/000/001/010/100',
  '<': '001/010/100/000/100/010/001',
  '%': '11001/11010/00010/00100/01000/01011/10011',
};
function mix(a, b, t) {
  const value = (n) => parseInt(n, 16);
  const result = [1, 3, 5].map((i) =>
    Math.round(value(a.slice(i, i + 2)) * (1 - t) + value(b.slice(i, i + 2)) * t)
      .toString(16)
      .padStart(2, '0'),
  );
  return '#' + result.join('');
}
function painter(canvas) {
  const c = canvas.getContext('2d');
  c.imageSmoothingEnabled = false;
  return {
    c,
    rect(x, y, w, h, color) {
      c.fillStyle = color;
      c.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
    },
    poly(points, color) {
      c.fillStyle = color;
      c.beginPath();
      points.forEach(([x, y], i) =>
        i ? c.lineTo(Math.round(x), Math.round(y)) : c.moveTo(Math.round(x), Math.round(y)),
      );
      c.closePath();
      c.fill();
    },
    disk(x, y, r, color) {
      c.fillStyle = color;
      for (let yy = -r; yy <= r; yy++) {
        const width = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy)));
        c.fillRect(Math.round(x - width), Math.round(y + yy), width * 2 + 1, 1);
      }
    },
    line(x, y, xx, yy, color, width = 1) {
      const count = Math.ceil(Math.max(Math.abs(xx - x), Math.abs(yy - y)));
      c.fillStyle = color;
      for (let i = 0; i <= count; i++) {
        const t = count ? i / count : 0;
        c.fillRect(Math.round(x + (xx - x) * t), Math.round(y + (yy - y) * t), width, width);
      }
    },
  };
}

export class PixelArt {
  constructor(context, createCanvas) {
    this.c = context;
    this.make = createCanvas;
    this.cache = new Map();
  }
  asset(key, w, h, paint) {
    if (!this.cache.has(key)) {
      const canvas = this.make(w, h);
      paint(painter(canvas));
      this.cache.set(key, canvas);
    }
    return this.cache.get(key);
  }
  sprite(image, x, y, scale = 2, flip = false) {
    const c = this.c;
    c.save();
    c.translate(Math.round(x), Math.round(y));
    if (flip) c.scale(-1, 1);
    c.imageSmoothingEnabled = false;
    c.drawImage(
      image,
      (-image.width * scale) / 2,
      (-image.height * scale) / 2,
      image.width * scale,
      image.height * scale,
    );
    c.restore();
  }
  label(value, x, y, color, size = 9, align = 'center') {
    const text = String(value)
      .toUpperCase()
      .replace(/[–—−]/g, '-')
      .replace(/…/g, '...')
      .replace(/→|↗/g, '>')
      .replace(/×/g, 'X')
      .replace(/·/g, '.');
    const lines = [];
    if (text.length > 32 && size < 10) {
      let line = '';
      for (const word of text.split(' ')) {
        if (line.length + word.length > 30) {
          lines.push(line);
          line = '';
        }
        line += (line ? ' ' : '') + word;
      }
      if (line) lines.push(line);
    } else lines.push(text);
    const glyph = (char) => (FONT[char] || FONT['?']).split('/');
    const widths = lines.map((line) =>
      [...line].reduce((n, char) => n + glyph(char)[0].length + 1, 0),
    );
    const key = `label:${text}:${color}`;
    if (this.cache.size > 600)
      for (const k of this.cache.keys()) {
        if (k.startsWith('label:')) this.cache.delete(k);
      }
    const image = this.asset(key, Math.max(...widths) + 2, lines.length * 10 + 1, (p) => {
      for (let row = 0; row < lines.length; row++) {
        let xx = 1;
        for (const char of lines[row]) {
          const data = glyph(char);
          for (let yy = 0; yy < 7; yy++)
            for (let i = 0; i < data[yy].length; i++)
              if (data[yy][i] === '1') {
                p.rect(xx + i + 1, row * 10 + yy + 1, 1, 1, '#0c1424');
                p.rect(xx + i, row * 10 + yy, 1, 1, color);
              }
          xx += data[0].length + 1;
        }
      }
    });
    const c = this.c,
      m = c.getTransform(),
      px = Math.round(m.a * x + m.c * y + m.e),
      py = Math.round(m.b * x + m.d * y + m.f),
      scale = Math.max(1, Math.round((size * Math.hypot(m.a, m.b)) / 7));
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.imageSmoothingEnabled = false;
    const left =
      align === 'left'
        ? px
        : align === 'right'
          ? px - image.width * scale
          : px - (image.width * scale) / 2;
    c.drawImage(image, Math.round(left), py - 7 * scale, image.width * scale, image.height * scale);
    c.restore();
  }
  bot(frame = 0, aim = 0) {
    return this.asset(`bot:${frame}:${aim}`, 30, 36, (p) => {
      const O = '#111c30',
        S = '#56757e',
        M = '#a9bab2',
        L = '#edf3cb',
        H = '#fffde3',
        A = '#eea579',
        D = '#a76453',
        G = '#224450',
        E = '#d6ff76';
      p.rect(14, 1, 2, 7, O);
      p.rect(13, 0, 4, 3, S);
      p.rect(14, 0, 2, 2, E);
      p.rect(3, 13, 24, 15, O);
      p.rect(1, 15, 4, 10, O);
      p.rect(25, 15, 4, 10, O);
      p.rect(2, 15, 4, 8, D);
      p.rect(3, 15, 3, 5, A);
      p.rect(25, 15, 3, 7, D);
      p.rect(25, 15, 2, 4, A);
      p.rect(5, 8, 20, 21, O);
      p.rect(7, 6, 16, 24, O);
      p.rect(6, 9, 18, 17, S);
      p.rect(8, 7, 14, 22, M);
      p.rect(8, 8, 12, 17, L);
      p.rect(7, 10, 2, 14, L);
      p.rect(9, 7, 11, 2, H);
      p.rect(21, 10, 2, 15, S);
      p.rect(8, 11, 14, 10, O);
      p.rect(9, 12, 12, 8, G);
      p.rect(10, 12, 9, 2, '#426e70');
      p.rect(10, 13, 3, 1, '#78a29c');
      const blink = frame === 3,
        look = aim;
      for (const x of [11, 17]) {
        p.rect(x + look, 15, 2, blink ? 1 : 3, E);
        if (!blink) p.rect(x + look, 15, 1, 1, H);
      }
      p.rect(14, 19, 3, 1, '#94c391');
      p.rect(10, 24, 9, 4, S);
      p.rect(11, 24, 7, 1, '#dceab6');
      p.rect(11, 26, 1, 1, '#263d48');
      p.rect(13, 26, 1, 1, '#263d48');
      p.rect(15, 26, 1, 1, '#263d48');
      p.rect(21, 25, 2, 2, A);
      const a = frame === 1 ? 1 : 0,
        b = frame === 2 ? 1 : 0;
      p.rect(7, 29 + a, 7, 6 - a, O);
      p.rect(17, 29 + b, 7, 6 - b, O);
      p.rect(8, 29 + a, 5, 3, M);
      p.rect(18, 29 + b, 5, 3, M);
      p.rect(7, 33, 7, 2, S);
      p.rect(17, 33, 7, 2, S);
      p.rect(8, 29 + a, 4, 1, L);
      p.rect(18, 29 + b, 4, 1, L);
      p.rect(25, 20, 5, 4, O);
      p.rect(26, 20, 3, 2, S);
      p.rect(29, 21, 1, 1, E);
      p.rect(4, 11, 2, 3, '#68949b');
    });
  }
  enemy(type, frame = 0, flash = false) {
    return this.asset(
      `enemy:${type}:${frame}:${flash}`,
      type === 'boss' ? 90 : 36,
      type === 'boss' ? 94 : 36,
      (p) => {
        const O = '#21182f',
          D = flash ? '#f5e7d3' : '#62416e',
          M = flash ? '#fff7e2' : '#a067a6',
          L = flash ? '#fff' : '#d5a4cc',
          E = '#e4f69e';
        if (type === 'boss') {
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * TAU,
              cx = 45 + Math.cos(a) * 30,
              cy = 44 + Math.sin(a) * 30;
            p.disk(cx, cy, 13, O);
            p.disk(cx - 1, cy - 2, 11, D);
            p.disk(cx - 4, cy - 5, 6, M);
            p.rect(cx - 5, cy - 6, 3, 2, L);
          }
          for (let i = 0; i < 5; i++) {
            const x = 14 + i * 14;
            p.line(45, 55, x, 85, O, 7);
            p.line(44, 55, x, 84, '#5b735b', 4);
            p.line(x, 84, x + (i % 2 ? 9 : -9), 91, '#7c9869', 3);
          }
          p.disk(45, 44, 29, O);
          p.disk(45, 43, 26, '#79496f');
          p.disk(43, 40, 22, '#986080');
          p.disk(40, 37, 17, '#ba7e96');
          p.disk(45, 43, 18, '#333545');
          p.rect(31, 34, 29, 18, '#20283b');
          p.rect(33, 36, 8, 9, '#f2c690');
          p.rect(50, 36, 8, 9, '#f2c690');
          p.rect(35, 38, 3, 5, '#fff1be');
          p.rect(52, 38, 3, 5, '#fff1be');
          p.rect(37, 50, 17, 6, O);
          for (let x = 38; x < 54; x += 4) p.rect(x, 50, 2, 3, '#e5c0b8');
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * TAU;
            p.rect(44 + Math.cos(a) * 23, 43 + Math.sin(a) * 23, 3, 3, '#99b28c');
          }
          p.rect(43, 13, 5, 4, '#f6c898');
          return;
        }
        if (type === 'charger') {
          for (let i = 0; i < 3; i++) {
            p.rect(7 + i * 9, 24 + (i % 2 === frame ? 1 : 0), 5, 6, O);
            p.rect(8 + i * 9, 24, 3, 3, '#bc8c6b');
          }
          p.poly(
            [
              [2, 20],
              [5, 10],
              [11, 5],
              [25, 5],
              [31, 11],
              [34, 20],
              [28, 26],
              [9, 26],
            ],
            O,
          );
          p.poly(
            [
              [5, 19],
              [8, 11],
              [14, 7],
              [24, 8],
              [29, 13],
              [31, 20],
              [25, 24],
              [10, 24],
            ],
            '#b17b5b',
          );
          p.poly(
            [
              [8, 14],
              [15, 8],
              [24, 9],
              [28, 14],
              [25, 18],
              [10, 18],
            ],
            '#dfae7c',
          );
          p.line(17, 9, 17, 23, '#725559', 2);
          p.rect(8, 18, 6, 6, O);
          p.rect(22, 18, 6, 6, O);
          p.rect(10, 19, 3, 3, E);
          p.rect(23, 19, 3, 3, E);
          p.poly(
            [
              [4, 14],
              [1, 7],
              [9, 12],
            ],
            '#e8d8aa',
          );
          p.poly(
            [
              [28, 12],
              [34, 7],
              [31, 16],
            ],
            '#e8d8aa',
          );
          return;
        }
        if (type === 'spitter') {
          p.rect(12, 18, 12, 13, O);
          p.rect(14, 18, 8, 12, '#7d9d78');
          p.rect(15, 19, 3, 10, '#b2cb90');
          p.poly(
            [
              [2, 17],
              [4, 9],
              [12, 3],
              [24, 3],
              [32, 10],
              [34, 17],
              [29, 21],
              [7, 21],
            ],
            O,
          );
          p.poly(
            [
              [4, 16],
              [7, 10],
              [13, 5],
              [23, 5],
              [29, 10],
              [32, 17],
              [25, 18],
              [9, 18],
            ],
            M,
          );
          p.rect(10, 7, 8, 3, L);
          p.rect(22, 10, 4, 3, '#f3c4d7');
          p.rect(7, 14, 4, 2, '#dca6ce');
          p.rect(12, 20, 12, 7, O);
          p.rect(14, 21, 3, 3, E);
          p.rect(21, 21, 3, 3, E);
          p.rect(17, 25, 4, 6, '#47716a');
          p.rect(18, 25, 2, 3, '#9edb97');
          return;
        }
        if (type === 'flyer') {
          const y = frame % 2 ? 11 : 19;
          p.poly(
            [
              [14, 15],
              [8, y - 4],
              [1, y],
              [3, y + 7],
              [14, 23],
            ],
            O,
          );
          p.poly(
            [
              [22, 15],
              [28, y - 4],
              [35, y],
              [33, y + 7],
              [22, 23],
            ],
            O,
          );
          p.poly(
            [
              [13, 16],
              [7, y - 1],
              [3, y + 1],
              [5, y + 4],
              [14, 20],
            ],
            L,
          );
          p.poly(
            [
              [23, 16],
              [29, y - 1],
              [33, y + 1],
              [31, y + 4],
              [22, 20],
            ],
            L,
          );
        }
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU;
          p.rect(16 + Math.cos(a) * 12, 16 + Math.sin(a) * 12, 5, 5, O);
          p.rect(17 + Math.cos(a) * 12, 16 + Math.sin(a) * 12, 3, 3, M);
        }
        p.disk(18, 18, 12, O);
        p.disk(18, 17, 10, D);
        p.disk(16, 14, 7, M);
        p.rect(11, 10, 5, 2, L);
        p.rect(10, 16, 6, 6, O);
        p.rect(21, 16, 6, 6, O);
        p.rect(12, 17, 3, 3, E);
        p.rect(22, 17, 3, 3, E);
        p.rect(16, 24, 6, 2, O);
        p.rect(17, 24, 4, 1, '#eabac8');
        p.rect(8, 28 + (frame % 2), 5, 3, O);
        p.rect(23, 29 - (frame % 2), 5, 3, O);
      },
    );
  }
  shipStation(kind) {
    return this.asset(`ship-station:${kind}`, 64, 72, (p) => {
      const outline = '#111d30',
        metal = '#557680',
        light = '#c1d5cd',
        dark = '#293f53';
      p.rect(5, 64, 54, 6, outline);
      p.rect(8, 62, 48, 5, metal);
      p.rect(9, 62, 46, 2, light);
      if (kind === 'rapid') {
        p.rect(12, 15, 40, 48, outline);
        p.rect(15, 18, 34, 42, metal);
        p.rect(17, 20, 30, 12, '#e8bb91');
        p.rect(20, 4, 23, 14, outline);
        p.rect(22, 6, 19, 10, '#9e795d');
        for (let x = 24; x < 40; x += 6) p.rect(x, 9, 3, 3, '#443a36');
        p.rect(19, 35, 25, 22, outline);
        p.rect(29, 33, 7, 8, light);
        p.rect(26, 47, 12, 10, '#eee7cf');
        p.rect(38, 49, 5, 5, '#eee7cf');
        p.rect(39, 50, 2, 3, outline);
        p.rect(27, 47, 10, 2, '#6d4938');
        p.rect(45, 36, 3, 3, '#c2e88e');
      } else if (kind === 'spread') {
        p.rect(7, 6, 50, 54, outline);
        p.rect(10, 9, 44, 48, metal);
        p.rect(13, 12, 38, 41, dark);
        for (const [x, y] of [
          [16, 18],
          [29, 29],
          [40, 18],
        ]) {
          p.rect(x, y, 8, 20, outline);
          p.rect(x + 2, y, 4, 15, '#b8c8f5');
          p.rect(x + 2, y + 15, 8, 4, metal);
          p.rect(x + 1, y + 4, 6, 3, '#e8bb91');
        }
        p.rect(15, 55, 34, 4, light);
      } else if (kind === 'power') {
        p.rect(9, 4, 46, 60, outline);
        p.rect(12, 7, 6, 55, metal);
        p.rect(46, 7, 6, 55, metal);
        p.rect(16, 7, 32, 9, light);
        p.rect(29, 15, 6, 13, metal);
        p.rect(20, 25, 24, 5, '#e8bb91');
        p.disk(32, 38, 10, '#f3bf78');
        p.disk(32, 38, 7, '#e98e60');
        p.line(32, 31, 32, 44, '#f7d898', 2);
        p.line(25, 37, 39, 37, '#f7d898', 2);
        p.rect(18, 49, 28, 4, light);
        p.rect(23, 53, 18, 9, '#f3bf78');
        p.rect(26, 54, 3, 6, '#fff1b4');
      } else if (kind === 'speed') {
        p.rect(7, 18, 50, 9, light);
        for (const x of [13, 36]) {
          p.rect(x, 9, 16, 37, outline);
          p.rect(x + 3, 12, 10, 27, metal);
          p.rect(x + 5, 16, 6, 14, '#8ddcd9');
          p.rect(x - 1, 37, 18, 9, dark);
          p.poly(
            [
              [x + 2, 46],
              [x + 8, 61],
              [x + 14, 46],
            ],
            '#8ddcd9',
          );
          p.rect(x + 6, 46, 4, 8, '#e9f3c4');
        }
        p.rect(7, 59, 50, 4, metal);
      } else if (kind === 'hull') {
        p.poly(
          [
            [17, 2],
            [47, 2],
            [55, 12],
            [55, 58],
            [48, 64],
            [16, 64],
            [9, 58],
            [9, 12],
          ],
          outline,
        );
        p.rect(13, 12, 38, 46, metal);
        p.rect(17, 16, 30, 40, '#243b4e');
        p.rect(22, 29, 20, 20, '#91a8a3');
        p.rect(25, 33, 14, 8, '#263d4a');
        p.rect(27, 35, 3, 3, '#c2e88e');
        p.rect(34, 35, 3, 3, '#c2e88e');
        p.rect(24, 50, 5, 6, outline);
        p.rect(35, 50, 5, 6, outline);
        p.rect(27, 4, 10, 16, '#f0a9b6');
        p.rect(24, 9, 16, 6, '#f0a9b6');
        p.rect(14, 19, 2, 34, light);
      } else if (kind === 'scan') {
        p.rect(7, 53, 50, 10, metal);
        p.rect(9, 55, 46, 3, light);
        for (const [x, color] of [
          [12, '#c2e88e'],
          [27, '#f3bf78'],
          [42, '#8ddcd9'],
        ]) {
          p.rect(x, 24, 10, 29, outline);
          p.rect(x + 2, 27, 6, 23, '#49777d');
          p.rect(x + 3, 37, 5, 13, color);
          p.rect(x + 2, 25, 6, 3, light);
          p.rect(x, 51, 10, 3, light);
          p.rect(x + 3, 29, 2, 7, '#c9eee1');
        }
        p.rect(27, 7, 4, 14, '#c2e88e');
        p.poly(
          [
            [29, 13],
            [16, 5],
            [17, 15],
            [29, 19],
          ],
          '#8cb876',
        );
        p.poly(
          [
            [30, 11],
            [42, 3],
            [41, 13],
            [30, 18],
          ],
          '#c2e88e',
        );
      }
    });
  }
  ship(hatch = 0) {
    hatch = Math.round(hatch * 4) / 4;
    return this.asset(`ship:${hatch}`, 42, 64, (p) => {
      const O = '#111d30',
        S = '#557680',
        L = '#dbe4bf';
      p.poly(
        [
          [12, 32],
          [3, 45],
          [0, 56],
          [12, 52],
          [30, 52],
          [41, 56],
          [38, 45],
          [30, 32],
        ],
        O,
      );
      p.poly(
        [
          [11, 37],
          [5, 47],
          [4, 52],
          [12, 49],
        ],
        '#d99072',
      );
      p.poly(
        [
          [31, 37],
          [37, 47],
          [38, 52],
          [30, 49],
        ],
        '#d99072',
      );
      p.poly(
        [
          [20, 0],
          [15, 4],
          [10, 13],
          [10, 47],
          [14, 55],
          [28, 55],
          [32, 47],
          [32, 13],
          [27, 4],
          [22, 0],
        ],
        O,
      );
      p.poly(
        [
          [20, 3],
          [14, 12],
          [13, 46],
          [17, 52],
          [26, 52],
          [29, 46],
          [29, 13],
          [24, 4],
        ],
        S,
      );
      p.rect(15, 13, 11, 28, L);
      p.rect(16, 10, 8, 3, '#f2edcf');
      p.rect(16, 18, 10, 17, O);
      p.rect(17, 19, 8, 13, '#4a969d');
      p.rect(17, 20, 5, 4, '#a1e7d7');
      p.rect(19, 24, 6, 6, '#65b5bc');
      p.rect(18, 42, 6, 3, '#eeac7d');
      p.rect(13, 48, 16, 4, '#b87b65');
      p.rect(15, 53, 12, 5, O);
      p.rect(17, 54, 8, 2, '#e9bc83');
      p.rect(8, 54, 3, 8, O);
      p.rect(31, 54, 3, 8, O);
      p.rect(5, 61, 9, 3, S);
      p.rect(28, 61, 9, 3, S);
      p.rect(28, 14, 2, 6, '#f0c891');
      if (hatch > 0) {
        p.rect(12, 33, 18, 27, O);
        p.rect(13, 34, 16, 25, '#a1e7d7');
        p.rect(14, 35, 14, 23, S);
        p.rect(21 - Math.round(7 * hatch), 35, Math.round(14 * hatch), 23, O);
        p.rect(14, 58, 14, 2, '#e9bc83');
      }
    });
  }
  planet(citrus = false) {
    return this.asset(`planet:${citrus}`, 160, 160, (p) => {
      const random = seededRandom(citrus ? 12 : 48),
        colors = citrus
          ? ['#53394b', '#895263', '#b66a6c', '#dd8a7b', '#f4ad8a', '#f8d0a0']
          : ['#28304a', '#3a4c6b', '#557b86', '#7aa995', '#a6c7a0', '#d6d6af'];
      for (let y = 0; y < 160; y++)
        for (let x = 0; x < 160; x++) {
          const dx = (x - 80) / 77,
            dy = (y - 80) / 77,
            r = Math.hypot(dx, dy);
          if (r > 1) continue;
          const z = Math.sqrt(1 - r * r),
            light = -dx * 0.35 - dy * 0.4 + z * 0.7;
          let shade = Math.max(0, Math.min(5, Math.floor(light * 5 + (random() - 0.5) * 0.8)));
          let col = colors[shade];
          if (citrus) {
            const a = Math.atan2(dy, dx);
            if (r > 0.91) col = r > 0.97 ? '#bac6a5' : '#f4c39b';
            else if (Math.abs(Math.sin(a * 5)) < 0.035 / r || r < 0.07) col = '#e9ad93';
            else if (random() < 0.14) col = colors[Math.min(5, shade + 1)];
          } else if (Math.sin(dx * 13 + Math.cos(dy * 10) * 2) + Math.cos(dy * 18 + dx * 5) > 0.75)
            col = colors[Math.max(0, shade - 1)];
          p.rect(x, y, 1, 1, col);
        }
    });
  }
  material(world, kind) {
    const key = `material:${world.theme}:${kind}`;
    return this.asset(key, 64, 64, (p) => {
      const random = seededRandom(world.track * 990 + kind.length),
        metal = ['factory', 'orange', 'plague'].includes(world.theme),
        base = world.ground,
        shade = mix(base, '#101729', 0.35),
        light = mix(base, world.color, 0.28);
      p.rect(0, 0, 64, 64, base);
      if (metal) {
        for (let y = 0; y < 64; y += 16)
          for (let x = 0; x < 64; x += 32) {
            p.rect(x, y, 31, 15, shade);
            p.rect(x + 1, y + 1, 29, 12, base);
            p.rect(x + 1, y + 1, 28, 1, light);
            p.rect(x + 3, y + 3, 2, 2, '#7a8b8d');
            p.rect(x + 27, y + 11, 2, 2, '#152638');
            if ((x + y) % 32 === 0)
              for (let i = 0; i < 5; i++) p.rect(x + 8 + i * 3, y + 5, 1, 6, shade);
          }
      } else if (world.theme === 'forest') {
        for (let y = 0; y < 64; y += 12) {
          p.rect(0, y, 64, 2, shade);
          for (let i = 0; i < 5; i++) {
            const x = random() * 64;
            p.rect(x, y + 3, 3 + random() * 15, 1, light);
            p.rect(x + 4, y + 6, 8, 1, shade);
          }
        }
      } else {
        for (let i = 0; i < 44; i++) {
          const x = Math.floor(random() * 32) * 2,
            y = Math.floor(random() * 32) * 2,
            w = 2 + Math.floor(random() * 5) * 2,
            h = 2 + Math.floor(random() * 3) * 2;
          p.poly(
            [
              [x, y + 2],
              [x + 2, y],
              [x + w, y],
              [x + w + 2, y + h],
              [x, y + h],
            ],
            i % 3 ? shade : light,
          );
          p.rect(x + 2, y, Math.max(2, w - 2), 1, light);
        }
        if (world.theme === 'jelly')
          for (let i = 0; i < 10; i++) {
            const x = random() * 64,
              y = random() * 64;
            p.disk(x, y, 2, '#e8bcdf33');
          }
      }
    });
  }
  prop(theme, index = 0) {
    return this.asset(`prop:${theme}:${index % 3}`, 40, 44, (p) => {
      const O = '#162734',
        random = seededRandom((index % 3) + 91);
      if (['factory', 'orange', 'plague'].includes(theme)) {
        if (index % 3 === 0) {
          p.rect(5, 16, 30, 27, O);
          p.rect(7, 18, 26, 23, '#586a71');
          p.rect(8, 19, 24, 2, '#93a29b');
          p.rect(10, 23, 20, 15, '#2e4857');
          for (let x = 11; x < 30; x += 4) p.rect(x, 24, 1, 12, '#89988d');
          p.rect(17, 19, 5, 2, theme === 'orange' ? '#f2bc73' : '#b9dc9b');
        } else if (index % 3 === 1) {
          p.rect(15, 5, 4, 38, O);
          p.rect(16, 6, 2, 34, '#8caba8');
          p.rect(6, 8, 24, 3, O);
          p.rect(7, 8, 22, 1, '#99aaa5');
          p.rect(14, 0, 6, 5, '#b1d687');
          p.rect(18, 1, 1, 2, '#f3efbd');
          p.rect(10, 40, 17, 3, '#455d69');
        } else {
          p.rect(6, 26, 28, 17, O);
          p.rect(8, 27, 24, 14, '#6a8073');
          p.rect(10, 28, 20, 2, '#b3c48d');
          p.line(10, 31, 29, 39, '#314858', 2);
          p.line(29, 31, 10, 39, '#314858', 2);
          p.rect(18, 31, 4, 5, '#dda477');
        }
        return;
      }
      if (theme === 'jelly') {
        p.rect(17, 19, 7, 24, O);
        p.rect(18, 19, 4, 22, '#9b91bd');
        p.disk(20, 17, 16, O);
        p.disk(20, 15, 14, '#966dae');
        p.disk(16, 11, 9, '#c995d5');
        p.rect(9, 12, 6, 3, '#f2b7da');
        p.rect(24, 16, 4, 3, '#e1a7dd');
        p.rect(7, 22, 27, 2, '#d3a7de');
      } else if (theme === 'sea') {
        for (let i = 0; i < 5; i++) {
          const x = 5 + i * 7,
            h = 15 + random() * 25;
          p.line(x, 42, x + Math.sin(i) * 5, 42 - h, O, 4);
          p.line(x, 41, x + Math.sin(i) * 5, 42 - h, '#b57897', 2);
          p.line(x, 30, x + 6, 22, '#e2a6b3', 2);
          p.rect(x + Math.sin(i) * 5 - 1, 42 - h, 4, 3, '#f2c5bc');
        }
      } else {
        const green = theme === 'star' ? '#a5bf75' : '#6fa580';
        p.line(20, 43, 20, 14, O, 3);
        for (let i = 0; i < 5; i++) {
          const y = 36 - i * 5,
            dir = i % 2 ? 1 : -1;
          p.poly(
            [
              [20, y],
              [20 + dir * 14, y - 10],
              [20 + dir * 11, y - 3],
            ],
            O,
          );
          p.poly(
            [
              [20, y - 1],
              [20 + dir * 12, y - 8],
              [20 + dir * 9, y - 3],
            ],
            green,
          );
        }
        if (theme === 'star') {
          p.poly(
            [
              [20, 0],
              [23, 9],
              [33, 11],
              [25, 17],
              [27, 26],
              [20, 21],
              [12, 26],
              [14, 17],
              [7, 11],
              [17, 9],
            ],
            '#e8d38f',
          );
          p.rect(18, 11, 5, 5, '#fff2b1');
        } else
          for (let i = 0; i < 3; i++) {
            p.rect(17 + i * 4, 8 + i * 3, 3, 3, '#d0d793');
          }
      }
    });
  }
  landmark(world, variant = 0, far = false) {
    return this.asset(`landmark:${world.theme}:${variant % 4}:${far}`, 256, 256, (p) => {
      const random = seededRandom(world.track * 231 + (variant % 4)),
        theme = world.theme,
        shadow = far ? mix(world.dark, world.sky, 0.6) : mix(world.ground, world.dark, 0.3),
        mid = far ? mix(world.sky, world.secondary, 0.17) : mix(world.ground, world.secondary, 0.3),
        light = far ? mix(world.sky, world.secondary, 0.28) : mix(world.ground, world.color, 0.48),
        edge = mix(light, world.color, 0.35);
      const foliage = (cx, cy, r) => {
        p.disk(cx + 3, cy + 6, r, shadow);
        p.disk(cx, cy, r - 2, mid);
        for (let i = 0; i < r * 3; i++) {
          const a = random() * TAU,
            rr = Math.sqrt(random()) * (r - 4),
            x = cx + Math.cos(a) * rr,
            y = cy + Math.sin(a) * rr;
          p.rect(x, y, 2 + random() * 4, 1 + random() * 2, i % 3 ? light : shadow);
        }
        p.line(cx - r * 0.6, cy - r * 0.55, cx + r * 0.1, cy - r * 0.75, edge, 2);
      };
      if (['plague', 'factory', 'orange'].includes(theme)) {
        for (let b = 0; b < 4; b++) {
          const x = b * 65 - 4,
            h = 70 + Math.floor(random() * 130),
            y = 256 - h,
            w = 47 + random() * 13;
          p.rect(x, y, w, h, shadow);
          p.rect(x + 2, y + 2, w - 4, h - 2, mid);
          p.rect(x + 2, y + 2, w - 4, 2, light);
          p.rect(x + 5, y + 7, w - 10, 7, shadow);
          for (let yy = y + 23; yy < 251; yy += 13)
            for (let xx = x + 7; xx < x + w - 5; xx += 10) {
              p.rect(xx, yy, 5, 7, shadow);
              if (random() > 0.35) p.rect(xx + 1, yy + 1, 3, 2, light);
            }
          p.rect(x + 10, y - 8, 2, 8, mid);
          p.rect(x + 9, y - 9, 4, 2, edge);
          if (theme !== 'plague') {
            p.rect(x + w - 8, y + 20, 6, h - 20, shadow);
            p.rect(x + w - 7, y + 20, 2, h - 20, light);
            for (let yy = y + 25; yy < 256; yy += 25) p.rect(x + w - 10, yy, 10, 3, mid);
          }
        }
        if (theme === 'plague') {
          for (let i = 0; i < 3; i++) {
            const x = 40 + i * 80;
            p.line(x, 255, x + 12, 170, shadow, 11);
            p.line(x + 12, 170, x - 3, 90, shadow, 8);
            p.line(x + 12, 175, x + 43, 130, mid, 4);
            p.line(x + 3, 210, x - 15, 170, mid, 4);
            for (let j = 0; j < 7; j++) {
              const y = 100 + j * 20;
              p.rect(x + Math.sin(j) * 9, y, 3, 5, light);
            }
          }
        } else {
          p.rect(12, 57, 221, 8, shadow);
          p.rect(15, 58, 216, 3, light);
          p.rect(230, 57, 8, 160, shadow);
          p.rect(231, 60, 3, 154, light);
          for (let x = 24; x < 227; x += 21) {
            p.rect(x, 54, 4, 15, mid);
            p.rect(x + 1, 55, 2, 4, edge);
          }
          p.rect(86, 120, 72, 45, shadow);
          p.rect(89, 122, 66, 40, mid);
          for (let i = 0; i < 6; i++) p.rect(94 + i * 9, 130, 4, 22, shadow);
          p.rect(92, 125, 61, 2, light);
          if (theme === 'orange') {
            p.disk(185, 91, 27, shadow);
            p.disk(183, 89, 24, '#987259');
            p.disk(179, 85, 19, '#b38962');
            for (let i = 0; i < 8; i++)
              p.line(
                182,
                89,
                182 + Math.cos((i / 8) * TAU) * 20,
                89 + Math.sin((i / 8) * TAU) * 20,
                '#d4ad79',
              );
          }
        }
      } else if (theme === 'forest' || theme === 'final') {
        if (theme === 'final') {
          p.disk(130, 222, 93, shadow);
          p.disk(130, 218, 87, mid);
          p.rect(33, 224, 195, 32, shadow);
          for (let i = 0; i < 8; i++) {
            const a = Math.PI + (i / 7) * Math.PI;
            p.line(130, 218, 130 + Math.cos(a) * 87, 218 + Math.sin(a) * 87, light, 1);
          }
          for (let i = 0; i < 3; i++) p.rect(44, 178 + i * 17, 175, 1, light);
          p.rect(94, 207, 67, 49, shadow);
          p.rect(103, 212, 49, 44, mid);
          p.rect(106, 216, 13, 20, light);
          p.rect(135, 216, 13, 20, light);
        } else {
          p.poly(
            [
              [100, 256],
              [108, 111],
              [87, 65],
              [101, 65],
              [123, 119],
              [144, 82],
              [155, 83],
              [135, 138],
              [142, 256],
            ],
            shadow,
          );
          p.poly(
            [
              [113, 256],
              [117, 105],
              [128, 124],
              [131, 256],
            ],
            mid,
          );
          for (let y = 120; y < 250; y += 13) {
            p.rect(119, y, 3, 7, light);
            p.rect(127, y + 4, 2, 5, shadow);
          }
          for (let i = 0; i < 8; i++) {
            const a = i * 0.8,
              r = 43 + random() * 17;
            foliage(125 + Math.cos(a) * 65, 70 + Math.sin(a) * 38, r);
          }
          for (let i = 0; i < 8; i++) {
            const x = 40 + random() * 180,
              y = 65 + random() * 56;
            p.disk(x, y, 5, '#95765b');
            p.rect(x - 2, y - 2, 3, 2, '#c8a974');
            p.line(x, y - 5, x + 2, y - 8, light);
          }
        }
      } else if (theme === 'jelly') {
        for (let i = 0; i < 3; i++) {
          const x = 48 + i * 82,
            h = 85 + random() * 65;
          p.rect(x - 8, 256 - h, 18, h, shadow);
          p.rect(x - 5, 256 - h, 6, h, mid);
          p.rect(x + 4, 256 - h, 2, h, light);
          p.disk(x, 256 - h, 45, shadow);
          p.disk(x - 2, 250 - h, 40, mid);
          for (let xx = x - 37; xx < x + 38; xx += 7) p.rect(xx, 259 - h, 4, 12, light);
          for (let j = 0; j < 45; j++) {
            const a = random() * TAU,
              r = random() * 32;
            p.rect(x + Math.cos(a) * r, 246 - h + Math.sin(a) * r, 3, 2, j % 3 ? light : shadow);
          }
          p.line(x - 26, 233 - h, x - 6, 218 - h, edge, 3);
        }
      } else if (theme === 'sea') {
        if (variant % 2) {
          p.poly(
            [
              [10, 256],
              [18, 134],
              [58, 134],
              [62, 256],
            ],
            shadow,
          );
          p.rect(21, 145, 30, 111, mid);
          for (let y = 149; y < 249; y += 15) p.rect(23, y, 25, 2, light);
          p.poly(
            [
              [148, 256],
              [148, 92],
              [171, 92],
              [187, 256],
            ],
            shadow,
          );
          p.rect(151, 100, 12, 140, mid);
          p.rect(41, 139, 120, 11, shadow);
          p.rect(44, 140, 114, 3, light);
        }
        for (let i = 0; i < 5; i++) {
          const x = i * 62,
            h = 50 + random() * 130;
          let ox = x,
            oy = 256;
          for (let j = 1; j < 7; j++) {
            const y = 256 - (h * j) / 6,
              xx = x + Math.sin(j * 0.8 + i) * 11;
            p.line(ox, oy, xx, y, mid, 3);
            p.poly(
              [
                [xx, y + 10],
                [xx + (j % 2 ? 14 : -14), y - 4],
                [xx + (j % 2 ? 9 : -9), y + 10],
              ],
              light,
            );
            ox = xx;
            oy = y;
          }
        }
        for (let i = 0; i < 12; i++) {
          const x = random() * 256,
            y = random() * 180;
          p.rect(x, y, 5, 2, light);
          p.rect(x + 5, y - 1, 2, 4, mid);
        }
      } else {
        for (let i = 0; i < 5; i++) {
          const x = 20 + random() * 215,
            y = 30 + random() * 210,
            r = 18 + random() * 29;
          p.poly(
            [
              [x - r, y - 5],
              [x - r * 0.6, y - r],
              [x + r * 0.4, y - r],
              [x + r, y],
              [x + r * 0.6, y + r],
              [x - r * 0.5, y + r],
            ],
            shadow,
          );
          p.poly(
            [
              [x - r + 3, y - 5],
              [x - r * 0.6, y - r + 2],
              [x + r * 0.4, y - r + 2],
              [x + r - 4, y],
              [x + r * 0.3, y + 4],
            ],
            mid,
          );
          for (let j = 0; j < 12; j++) {
            const xx = x + (random() - 0.5) * r,
              yy = y + (random() - 0.5) * r;
            p.rect(xx, yy, 2 + random() * 5, 2, j % 3 ? light : shadow);
          }
          if (theme === 'star') {
            p.line(x, y - r, x, y - r - 26, mid, 2);
            p.poly(
              [
                [x, y - r - 42],
                [x + 4, y - r - 32],
                [x + 15, y - r - 30],
                [x + 6, y - r - 23],
                [x + 8, y - r - 12],
                [x, y - r - 19],
                [x - 8, y - r - 12],
                [x - 6, y - r - 23],
                [x - 15, y - r - 30],
                [x - 4, y - r - 32],
              ],
              light,
            );
            p.rect(x - 2, y - r - 30, 4, 4, edge);
          } else {
            p.disk(x + 7, y + 8, r * 0.26, shadow);
            p.line(x - r * 0.4, y - r * 0.6, x + r * 0.1, y - r * 0.7, light, 2);
          }
        }
      }
    });
  }
  scenery(renderer, t) {
    const c = this.c,
      world = renderer.worldData,
      w = renderer.w,
      h = renderer.h,
      z = renderer.zoom || 1;
    const top = world.dark,
      bottom = world.sky;
    for (let band = 0; band < 12; band++) {
      const y = Math.floor((band * h) / 12),
        height = Math.ceil(h / 12),
        col = mix(top, bottom, band / 11);
      c.fillStyle = col;
      c.fillRect(0, y, w, height);
      if (band > 0) {
        c.fillStyle = mix(top, bottom, (band - 0.5) / 11);
        for (let x = (band % 2) * 4; x < w; x += 8) c.fillRect(x, y - 2, 2, 2);
      }
    }
    renderer.background(t);
    const planet = this.planet(world.theme === 'plague' || world.theme === 'orange');
    c.globalAlpha = 0.65;
    this.sprite(
      planet,
      w * 0.78 - renderer.camera.x * 0.025,
      h * 0.24,
      world.theme === 'jet' ? 0.9 : 1.4,
    );
    c.globalAlpha = 1;
    // Broken mountain silhouettes frame the horizon behind the architectural layers.
    c.save();
    c.translate(w / 2 - renderer.camera.x * z * 0.08, h / 2 - renderer.camera.y * z * 0.65);
    c.scale(z, z);
    const start = Math.floor((renderer.camera.x * 0.08 - w / (2 * z)) / 360) - 1;
    for (let i = start; i < start + Math.ceil(w / z / 360) + 3; i++) {
      const x = i * 360,
        peak = 240 + Math.sin(i * 9) * 85;
      c.fillStyle = mix(world.sky, world.dark, 0.4);
      c.beginPath();
      c.moveTo(x - 100, 850);
      c.lineTo(x + 10, peak + 90);
      c.lineTo(x + 75, peak + 105);
      c.lineTo(x + 140, peak);
      c.lineTo(x + 220, peak + 160);
      c.lineTo(x + 350, peak + 95);
      c.lineTo(x + 460, 850);
      c.fill();
    }
    c.restore();
    for (let layer = 0; layer < 2; layer++) {
      const parallax = layer ? 0.44 : 0.2;
      c.save();
      c.translate(w / 2 - renderer.camera.x * z * parallax, h / 2 - renderer.camera.y * z);
      c.scale(z, z);
      const begin = Math.floor((renderer.camera.x * parallax - w / (2 * z)) / 470) - 1;
      c.globalAlpha = layer ? 0.65 : 0.32;
      for (let i = begin; i < begin + Math.ceil(w / z / 470) + 4; i++) {
        const image = this.landmark(world, ((i % 4) + 4) % 4, !layer);
        c.drawImage(image, i * 470, layer ? 130 : 80, 512, 512);
      }
      c.restore();
    }
    c.globalAlpha = 1;
  }
  platform(f, world, t) {
    const c = this.c,
      metal = ['factory', 'orange', 'plague'].includes(world.theme),
      edge = f.kind === 'moving' ? world.secondary : f.kind === 'crumble' ? '#d7b38b' : world.color;
    if (f.kind === 'moving') {
      c.setLineDash([2, 6]);
      c.strokeStyle = '#78909b77';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(
        f.baseX + f.w / 2 - (f.axis === 'x' ? f.range : 0),
        f.baseY - (f.axis === 'y' ? f.range : 0),
      );
      c.lineTo(
        f.baseX + f.w / 2 + (f.axis === 'x' ? f.range : 0),
        f.baseY + (f.axis === 'y' ? f.range : 0),
      );
      c.stroke();
      c.setLineDash([]);
    }
    if (!f.solid) {
      c.globalAlpha = f.kind === 'phase' ? 0.18 : 0.09;
      c.fillStyle = edge;
      c.fillRect(f.x, f.y, f.w, f.h);
      c.globalAlpha = 1;
      return;
    }
    c.globalAlpha = f.warning ? 0.65 : 1;
    const depth = f.oneWay ? (metal ? 30 : world.theme === 'jelly' ? 42 : 48) : f.h;
    const tex = this.material(world, f.kind);
    c.save();
    c.beginPath();
    if (!f.oneWay || metal) c.rect(f.x, f.y, f.w, depth);
    else {
      c.moveTo(f.x, f.y);
      c.lineTo(f.x + f.w, f.y);
      c.lineTo(f.x + f.w - 8, f.y + 25);
      c.lineTo(f.x + f.w * 0.65, f.y + depth);
      c.lineTo(f.x + 12, f.y + depth - 8);
      c.closePath();
    }
    c.clip();
    const start = Math.max(f.x, Math.floor(f.x / 64) * 64);
    for (let y = f.y; y < f.y + depth; y += 64)
      for (let x = start; x < f.x + f.w; x += 64) c.drawImage(tex, x, y, 64, 64);
    c.restore();
    c.fillStyle = '#132332';
    c.fillRect(f.x - 2, f.y + 3, f.w + 4, 5);
    c.fillStyle = edge;
    c.fillRect(f.x, f.y, f.w, 4);
    c.fillStyle = mix(edge, '#fff8d6', 0.35);
    c.fillRect(f.x + 2, f.y, Math.max(1, f.w - 4), 1);
    c.fillStyle = mix(edge, world.ground, 0.35);
    c.fillRect(f.x + 2, f.y + 5, f.w - 4, 4);
    if (metal) {
      for (let x = f.x + 8; x < f.x + f.w - 5; x += 24) {
        c.fillStyle = '#172b39';
        c.fillRect(x, f.y + 13, 5, 5);
        c.fillStyle = '#99a7a0';
        c.fillRect(x, f.y + 13, 2, 2);
      }
      if (f.oneWay) {
        for (const x of [f.x + 10, f.x + f.w - 20]) {
          c.fillStyle = '#394e5c';
          c.fillRect(x, f.y + 29, 10, 12);
          c.fillStyle = '#7f989b';
          c.fillRect(x + 2, f.y + 29, 2, 9);
        }
      }
    } else {
      const random = seededRandom(Math.round(f.baseX) + world.track);
      for (let x = f.x + 8; x < f.x + f.w - 5; x += 14) {
        c.fillStyle = edge;
        c.fillRect(x, f.y - 2 - Math.floor(random() * 3), 2, 4);
        c.fillRect(x + 4, f.y - 1, 3, 2);
      }
      if (f.oneWay && world.theme !== 'jelly') {
        for (let x = f.x + 22; x < f.x + f.w - 15; x += 31) {
          c.fillStyle = mix(world.secondary, '#294839', 0.35);
          c.fillRect(x, f.y + depth - 8, 2, 10 + (x % 13));
          c.fillRect(x - 3, f.y + depth + 2, 5, 2);
        }
      }
    }
    if (f.kind === 'bounce') {
      c.fillStyle = '#5c3d75';
      c.fillRect(f.x, f.y - 11, f.w, 15);
      c.fillStyle = '#e1a7ee';
      c.fillRect(f.x + 5, f.y - 13, f.w - 10, 5);
      for (let x = f.x + 12; x < f.x + f.w - 8; x += 16) {
        c.fillStyle = '#ffdcf0';
        c.fillRect(x, f.y - 10, 6, 2);
        c.fillStyle = '#9b67b9';
        c.fillRect(x + 4, f.y - 4, 7, 3);
      }
    }
    if (f.kind === 'crumble') {
      c.strokeStyle = f.crumble > 0 ? '#edc08c' : '#192d31';
      c.lineWidth = 2;
      for (let x = f.x + 16; x < f.x + f.w - 8; x += 33) {
        c.beginPath();
        c.moveTo(x, f.y + 7);
        c.lineTo(x + 6, f.y + 17);
        c.lineTo(x + 2, f.y + 26);
        c.lineTo(x + 12, f.y + 33);
        c.stroke();
      }
    }
    if (f.kind === 'phase') {
      for (let x = f.x + 6; x < f.x + f.w - 5; x += 12) {
        c.fillStyle = '#d8d0ff88';
        c.fillRect(x, f.y + 13, 5, 2);
      }
      c.fillStyle = '#d8d0ff';
      c.fillRect(f.x + f.w / 2 - 3, f.y + 25, 6, 3);
    }
    if (f.conveyor) {
      for (let x = f.x + 6; x < f.x + f.w - 10; x += 18) {
        const shift = Math.round(t * f.conveyor * 0.3) % 18;
        c.fillStyle = '#ddad70';
        c.fillRect(x + shift, f.y + 10, 7, 3);
        c.fillStyle = '#283e4d';
        c.fillRect(x + shift + 3, f.y + 10, 3, 3);
      }
    }
    // Placed dressing stops short of the jumping lane and never changes collision geometry.
    if (f.kind !== 'bounce' && f.kind !== 'phase' && f.w > 140) {
      const random = seededRandom(Math.round(f.baseX) * 13 + world.track);
      for (let x = f.x + 42; x < f.x + f.w - 45; x += 180 + Math.floor(random() * 70)) {
        if (random() > 0.25) {
          c.globalAlpha = 0.85;
          const prop = this.prop(world.theme, Math.floor(random() * 3));
          c.drawImage(prop, x - 20, f.y - 44, 40, 44);
        }
      }
    }
    c.globalAlpha = 1;
  }
  robot(x, y, t, angle, dashing, flash, player) {
    const frame =
        player && Math.abs(player.vx) > 30 && player.grounded
          ? 1 + (Math.floor(t * 9) % 2)
          : Math.floor(t * 2) % 13 === 0
            ? 3
            : 0,
      face = player?.face ?? 1;
    if (dashing) {
      for (let i = 3; i > 0; i--) {
        this.c.globalAlpha = 0.08 * (4 - i);
        this.sprite(this.bot(frame, 0), x - face * i * 15, y, 1.7, face < 0);
      }
      this.c.globalAlpha = 1;
    }
    this.sprite(this.bot(frame, Math.sin(angle) < -0.3 ? -1 : 0), x, y - 2, 1.7, face < 0);
  }
  hazardImage(kind, world, frame = 0) {
    return this.asset(
      `hazard:${kind}:${world.track}:${frame}`,
      48,
      kind === 'coral' ? 80 : kind === 'vent' ? 96 : 56,
      (p) => {
        const O = '#172439',
          S = '#577a83',
          L = '#a4b8ae',
          random = seededRandom(world.track * 89 + frame);
        if (kind === 'laser') {
          p.rect(2, 11, 44, 26, O);
          p.rect(4, 13, 40, 22, S);
          p.rect(6, 13, 36, 3, L);
          for (let x = 7; x < 42; x += 8) {
            p.rect(x, 18, 4, 8, '#273f53');
            p.rect(x, 18, 2, 2, '#c3d5b1');
          }
          p.rect(11, 30, 26, 11, O);
          p.rect(14, 32, 20, 7, '#b37a9e');
          p.rect(17, 34, 14, 4, '#efc0d7');
          p.rect(4, 39, 5, 4, '#d9c18c');
          p.rect(39, 39, 5, 4, '#d9c18c');
          return;
        }
        if (kind === 'crusher') {
          p.rect(2, 0, 44, 56, O);
          p.rect(4, 2, 40, 51, S);
          p.rect(5, 3, 37, 3, L);
          p.rect(7, 10, 34, 35, '#799369');
          p.disk(24, 27, 15, O);
          p.disk(23, 26, 13, '#b48b69');
          p.disk(20, 23, 9, '#d0ac7d');
          p.disk(21, 25, 6, '#9c745b');
          p.rect(17, 18, 6, 2, '#e7c695');
          p.rect(5, 45, 38, 8, O);
          for (let x = 7; x < 41; x += 8) {
            p.poly(
              [
                [x, 46],
                [x + 5, 46],
                [x, 52],
                [x - 5, 52],
              ],
              '#d5b585',
            );
          }
          for (const x of [7, 38])
            for (const y of [7, 39]) {
              p.rect(x, y, 3, 3, O);
              p.rect(x, y, 1, 1, L);
            }
          return;
        }
        if (kind === 'vent') {
          p.rect(2, 83, 44, 13, O);
          p.rect(4, 84, 40, 10, S);
          p.rect(5, 84, 37, 2, L);
          for (let x = 7; x < 41; x += 7) {
            p.rect(x, 88, 3, 6, '#283e4d');
            p.rect(x + 1, 88, 1, 2, '#d3a482');
          }
          for (let i = 0; i < 20; i++) {
            const y = 4 + i * 4,
              width = 4 + i * 0.7,
              jitter = Math.sin(i * 2 + frame) * 4;
            p.rect(24 - width / 2 + jitter, y, width, 5, i % 3 ? '#d67e67' : '#a66465');
            p.rect(23 - width * 0.25 + jitter, y, width * 0.5, 5, i % 2 ? '#f3af79' : '#efca8e');
            if (i > 10) p.rect(24 + jitter, y, 2, 5, '#fff3c3');
          }
          return;
        }
        if (kind === 'coral') {
          for (let i = 0; i < 5; i++) {
            let x = 5 + i * 9,
              y = 78;
            const height = 30 + random() * 40;
            for (let j = 0; j < 5; j++) {
              const xx = x + Math.sin(j + i) * 3,
                yy = 78 - (height * j) / 4;
              p.line(x, y, xx, yy, O, 5);
              p.line(x + 1, y, xx + 1, yy, '#c28d9f', 3);
              if (j > 0) {
                const dir = j % 2 ? 1 : -1;
                p.line(xx, yy + 8, xx + dir * 7, yy - 2, '#dcabb4', 2);
                p.rect(xx + dir * 7 - 1, yy - 3, 3, 3, '#f5d2be');
              }
              x = xx;
              y = yy;
            }
            p.rect(x, y, 4, 4, '#f5d2be');
          }
          return;
        }
        if (kind === 'thorns' || kind === 'spikes') {
          for (let i = 0; i < 4; i++) {
            const x = 3 + i * 12;
            p.poly(
              [
                [x - 3, 55],
                [x + 4, 27 + (i % 2) * 5],
                [x + 9, 55],
              ],
              O,
            );
            p.poly(
              [
                [x, 54],
                [x + 4, 31 + (i % 2) * 5],
                [x + 6, 54],
              ],
              '#acc58d',
            );
            p.rect(x + 3, 38 + (i % 2) * 5, 1, 10, '#e9edbd');
            p.line(x, 49, x - 3, 44, '#d0d8a5', 2);
            p.rect(x - 1, 54, 8, 2, '#627c73');
          }
          return;
        }
        const spore = kind === 'spore',
          mid = spore ? '#be8cb1' : '#7b829a',
          hi = spore ? '#e8b5cf' : '#b5b0bc',
          dark = spore ? '#79587f' : '#4a536f';
        p.poly(
          [
            [3, 19],
            [9, 8],
            [21, 4],
            [36, 8],
            [45, 20],
            [43, 40],
            [31, 50],
            [13, 48],
            [3, 36],
          ],
          O,
        );
        p.poly(
          [
            [5, 20],
            [11, 10],
            [22, 6],
            [35, 10],
            [43, 21],
            [40, 39],
            [30, 47],
            [14, 45],
            [5, 35],
          ],
          dark,
        );
        p.poly(
          [
            [6, 21],
            [13, 11],
            [23, 7],
            [34, 11],
            [39, 22],
            [29, 27],
            [11, 29],
          ],
          mid,
        );
        p.line(13, 11, 23, 8, hi, 2);
        for (let i = 0; i < 13; i++) {
          const x = 10 + random() * 28,
            y = 13 + random() * 27,
            r = 2 + random() * 4;
          p.disk(x, y, r, dark);
          if (i % 3 === 0) p.line(x - r, y - r, x + r, y - r, hi);
        }
        if (spore) {
          p.disk(24, 25, 10, dark);
          p.disk(23, 23, 7, mid);
          p.disk(21, 21, 4, hi);
          p.rect(19, 19, 3, 2, '#ffe1df');
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * TAU,
              x = 24 + Math.cos(a) * 21,
              y = 26 + Math.sin(a) * 24;
            p.rect(x, y, 4, 4, O);
            p.rect(x, y, 2, 2, hi);
          }
        }
      },
    );
  }
  environment(h, world, t) {
    const c = this.c,
      kind = h.kind;
    const draw = (image, x, y, w, h) => {
      c.imageSmoothingEnabled = false;
      c.drawImage(image, x, y, w, h);
    };
    if (kind === 'laser') {
      const image = this.hazardImage('laser', world);
      draw(image, h.x - 20, h.y - 32, h.w + 40, 42);
      c.save();
      c.translate(h.x + h.w / 2, h.y + h.h + 21);
      c.scale(1, -1);
      draw(image, -h.w / 2 - 20, -21, h.w + 40, 42);
      c.restore();
      if (h.active) {
        c.fillStyle = '#c787ac44';
        c.fillRect(h.x - 5, h.y, h.w + 10, h.h);
        c.fillStyle = '#b86ea4';
        c.fillRect(h.x + 2, h.y, h.w - 4, h.h);
        c.fillStyle = '#ffe1eb';
        c.fillRect(h.x + h.w / 2 - 1, h.y, 2, h.h);
        for (let y = h.y + (Math.floor(t * 45) % 14); y < h.y + h.h; y += 14) {
          c.fillStyle = '#f7b5db';
          c.fillRect(h.x + 3, y, h.w - 6, 4);
        }
      } else {
        c.fillStyle = '#a174a455';
        for (let y = h.y; y < h.y + h.h; y += 12) c.fillRect(h.x + h.w / 2, y, 2, 4);
      }
      if (h.warning) this.label('!', h.x + h.w / 2, h.y - 40, '#f2d692', 12);
      return;
    }
    if (kind === 'crusher') {
      c.fillStyle = '#172b3c';
      c.fillRect(h.x + h.w / 2 - 7, 0, 14, h.y);
      c.fillStyle = '#8c9c91';
      c.fillRect(h.x + h.w / 2 - 3, 0, 3, h.y);
      for (let y = 10; y < h.y; y += 20) {
        c.fillStyle = '#546f77';
        c.fillRect(h.x + h.w / 2 - 9, y, 18, 4);
      }
      draw(this.hazardImage(kind, world), h.x, h.y, h.w, h.h);
      if (h.warning) this.label('!', h.x + h.w / 2, 600, '#ffd18b', 12);
      return;
    }
    if (kind === 'vent') {
      const image = this.hazardImage(kind, world, Math.floor(t * 7) % 3);
      if (h.active) draw(image, h.x, h.y, h.w, h.h);
      else {
        c.drawImage(image, 0, 83, 48, 13, h.x, h.y + h.h - 24, h.w, 24);
        if (h.warning) {
          for (let i = 0; i < 5; i++) {
            c.fillStyle = i % 2 ? '#e6b78d99' : '#e1d0ad66';
            c.fillRect(h.x + 8 + i * 10, h.y + h.h - 30 - ((t * 35 + i * 13) % 48), 4, 5);
          }
        }
      }
      return;
    }
    if (kind === 'coral') {
      draw(this.hazardImage(kind, world), h.x, h.y, h.w, h.h);
      return;
    }
    if (kind === 'rock' || kind === 'orbit' || kind === 'spore') {
      draw(this.hazardImage(kind, world), h.x - 3, h.y - 3, h.w + 6, h.h + 6);
      return;
    }
    const image = this.hazardImage('thorns', world);
    for (let x = h.x; x < h.x + h.w; x += 32)
      c.drawImage(image, 0, 26, 48, 30, x, h.y - 7, Math.min(32, h.x + h.w - x), h.h + 7);
  }
  core(world) {
    return this.asset(`core:${world.track}`, 28, 32, (p) => {
      p.poly(
        [
          [14, 1],
          [18, 9],
          [27, 11],
          [21, 18],
          [22, 28],
          [14, 24],
          [6, 28],
          [7, 18],
          [1, 11],
          [10, 9],
        ],
        '#203043',
      );
      p.poly(
        [
          [14, 4],
          [17, 11],
          [24, 12],
          [19, 17],
          [20, 24],
          [14, 21],
          [8, 24],
          [9, 17],
          [4, 12],
          [11, 11],
        ],
        world.color,
      );
      p.poly(
        [
          [14, 7],
          [16, 12],
          [20, 13],
          [17, 17],
          [17, 20],
          [13, 18],
          [10, 20],
          [11, 16],
          [8, 13],
          [12, 12],
        ],
        '#f0f3c0',
      );
      p.rect(12, 12, 5, 6, '#fff9d7');
      p.rect(12, 12, 2, 2, '#ffffff');
      p.rect(13, 28, 3, 3, world.secondary);
      p.rect(4, 3, 2, 2, '#b7d9b4');
      p.rect(24, 22, 2, 2, '#b7d9b4');
    });
  }
  beacon(active, frame = 0) {
    return this.asset(`beacon:${active}:${frame}`, 28, 48, (p) => {
      const O = '#172739',
        S = '#577d83',
        L = active ? '#bce9b6' : '#7f9eaa';
      p.rect(4, 41, 21, 7, O);
      p.rect(6, 42, 17, 4, S);
      p.rect(10, 29, 10, 14, O);
      p.rect(12, 30, 6, 12, S);
      p.rect(8, 15, 15, 18, O);
      p.rect(10, 17, 11, 12, S);
      p.rect(11, 18, 9, 7, '#203e4e');
      p.rect(12, 19, 7, 4, L);
      p.rect(12, 27, 2, 1, '#e4c88c');
      p.rect(16, 27, 2, 1, '#e4c88c');
      p.rect(14, 2, 2, 14, O);
      p.rect(14, 3, 1, 12, '#a0bba8');
      p.rect(11, 0, 7, 4, L);
      p.rect(12, 0, 3, 1, '#e8f9c7');
      if (active) {
        p.rect(6 - frame * 3, 7, 2, 4, '#add3b6');
        p.rect(22 + frame * 3, 7, 2, 4, '#add3b6');
      }
      p.rect(3, 45, 24, 2, '#96ada1');
    });
  }
  pickup(heal) {
    return this.asset(`pickup:${heal}`, 16, 16, (p) => {
      p.rect(2, 3, 12, 12, '#162c3c');
      p.rect(4, 1, 8, 2, '#162c3c');
      p.rect(3, 4, 10, 10, heal ? '#5c9a91' : '#d6b675');
      p.rect(4, 4, 8, 2, heal ? '#abe0ba' : '#f2d998');
      if (heal) {
        p.rect(7, 6, 2, 6, '#eff3d0');
        p.rect(5, 8, 6, 2, '#eff3d0');
      } else {
        p.poly(
          [
            [8, 6],
            [11, 9],
            [8, 12],
            [5, 9],
          ],
          '#fff3bf',
        );
      }
      p.rect(4, 14, 8, 1, '#355b69');
    });
  }
  drawEnemy(e, t) {
    const frame = Math.floor(t * 6) % 2,
      scale = e.type === 'boss' ? 1.8 : 1.45;
    this.sprite(this.enemy(e.type, frame, e.flash > 0), e.x, e.y, scale, e.direction < 0);
    if (e.windup > 0) this.label('!', e.x, e.y - 32, '#ffd18b', 12);
    if (e.hp < e.maxHp && e.type !== 'boss') {
      const c = this.c;
      c.fillStyle = '#152132';
      c.fillRect(e.x - 21, e.y - 32, 42, 4);
      c.fillStyle = '#e3a4c9';
      c.fillRect(e.x - 20, e.y - 31, (40 * e.hp) / e.maxHp, 2);
    }
  }
}
