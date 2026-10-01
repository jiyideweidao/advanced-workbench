'use strict';

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const { crc32 } = require('./zip');

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function roundedRectCoverage(u, v, radius) {
  const cx = Math.min(Math.max(u, radius), 1 - radius);
  const cy = Math.min(Math.max(v, radius), 1 - radius);
  const dx = u - cx;
  const dy = v - cy;
  return Math.sqrt(dx * dx + dy * dy) <= radius ? 1 : 0;
}

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function sample(u, v) {
  const base = roundedRectCoverage(u, v, 0.22);
  if (!base) return null;

  const t = Math.min(1, Math.max(0, (u * 0.5 + v * 0.5)));
  let r = Math.round(79 + (200 - 79) * t);
  let g = Math.round(124 + (107 - 124) * t);
  let b = Math.round(255 + (255 - 255) * t);

  if (pointInTriangle(u, v, 0.40, 0.32, 0.40, 0.62, 0.68, 0.47)) {
    r = 255; g = 255; b = 255;
  }
  if (u > 0.30 && u < 0.70 && v > 0.68 && v < 0.735) {
    r = 255; g = 255; b = 255;
  }
  return [r, g, b];
}

function renderIcon(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const S = 4;
  const n = S * S;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < S; sy += 1) {
        for (let sx = 0; sx < S; sx += 1) {
          const u = (x + (sx + 0.5) / S) / size;
          const v = (y + (sy + 0.5) / S) / size;
          const c = sample(u, v);
          if (c) { r += c[0]; g += c[1]; b += c[2]; a += 1; }
        }
      }
      const idx = (y * size + x) * 4;
      if (a > 0) {
        rgba[idx] = Math.round(r / a);
        rgba[idx + 1] = Math.round(g / a);
        rgba[idx + 2] = Math.round(b / a);
        rgba[idx + 3] = Math.round((a / n) * 255);
      }
    }
  }
  return rgba;
}

// 生成 Windows .ico（内嵌 PNG，Vista+ 支持）。用于桌面快捷方式与任务栏图标。
function encodeIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  entries.forEach((e, i) => {
    const b = i * 16;
    dir[b] = e.size >= 256 ? 0 : e.size;
    dir[b + 1] = e.size >= 256 ? 0 : e.size;
    dir[b + 2] = 0;
    dir[b + 3] = 0;
    dir.writeUInt16LE(1, b + 4);
    dir.writeUInt16LE(32, b + 6);
    dir.writeUInt32LE(e.png.length, b + 8);
    dir.writeUInt32LE(offset, b + 12);
    offset += e.png.length;
  });
  return Buffer.concat([header, dir].concat(entries.map((e) => e.png)));
}

function writeIcons(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const targets = [
    { name: 'icon.png', size: 256 },
    { name: 'icon-512.png', size: 512 },
    { name: 'tray.png', size: 32 }
  ];
  const written = [];
  for (const t of targets) {
    const file = path.join(outDir, t.name);
    fs.writeFileSync(file, encodePng(t.size, t.size, renderIcon(t.size)));
    written.push(file);
  }
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const icoEntries = icoSizes.map((size) => ({ size, png: encodePng(size, size, renderIcon(size)) }));
  const icoFile = path.join(outDir, 'icon.ico');
  fs.writeFileSync(icoFile, encodeIco(icoEntries));
  written.push(icoFile);
  return written;
}

if (require.main === module) {
  const out = process.argv[2] || path.join(__dirname, '..', 'build');
  const files = writeIcons(out);
  files.forEach((f) => console.log('icon written:', f, fs.statSync(f).size + ' bytes'));
}

module.exports = { encodePng, encodeIco, renderIcon, writeIcons };