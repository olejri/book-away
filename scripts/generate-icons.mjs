// One-off icon generator for VoiceDraft PWA icons.
// Produces dark-mode brand icons with a microphone glyph.
// Run with: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const BG = [0x0a, 0x0a, 0x0a]; // #0a0a0a
const BRAND = [0x4f, 0x6e, 0xf7]; // #4f6ef7

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // rest 0
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeIcon(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  // Safe-zone padding for maskable: keep art within central ~80%.
  const scale = maskable ? 0.62 : 0.78;
  const micW = size * 0.22 * (scale / 0.78);
  const micTop = cx - size * 0.30 * (scale / 0.78);
  const micBottom = cx + size * 0.02 * (scale / 0.78);
  const micR = micW / 2;
  const standTop = micBottom;
  const standBottom = cx + size * 0.22 * (scale / 0.78);
  const mouthR = size * 0.20 * (scale / 0.78);

  const set = (x, y, c) => {
    const i = (y * size + x) * 4;
    rgba[i] = c[0];
    rgba[i + 1] = c[1];
    rgba[i + 2] = c[2];
    rgba[i + 3] = 255;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let c = BG;
      const fx = x + 0.5;
      const fy = y + 0.5;

      // Microphone capsule (rounded rectangle).
      const inCapsuleX = Math.abs(fx - cx) <= micR;
      if (inCapsuleX && fy >= micTop + micR && fy <= micBottom - micR) c = BRAND;
      // top cap
      if (Math.hypot(fx - cx, fy - (micTop + micR)) <= micR && fy < micTop + micR)
        c = BRAND;
      // bottom cap
      if (
        Math.hypot(fx - cx, fy - (micBottom - micR)) <= micR &&
        fy > micBottom - micR
      )
        c = BRAND;

      // Arc holder under the capsule (open ring).
      const dArc = Math.hypot(fx - cx, fy - micBottom);
      if (
        dArc <= mouthR &&
        dArc >= mouthR - size * 0.035 &&
        fy >= micBottom
      )
        c = BRAND;

      // Vertical stand.
      if (Math.abs(fx - cx) <= size * 0.018 && fy >= standTop && fy <= standBottom)
        c = BRAND;
      // Base.
      if (
        Math.abs(fx - cx) <= mouthR * 0.6 &&
        Math.abs(fy - standBottom) <= size * 0.018
      )
        c = BRAND;

      set(x, y, c);
    }
  }
  return encodePng(size, size, rgba);
}

writeFileSync(join(outDir, "icon-192.png"), makeIcon(192));
writeFileSync(join(outDir, "icon-512.png"), makeIcon(512));
writeFileSync(join(outDir, "icon-512-maskable.png"), makeIcon(512, { maskable: true }));
writeFileSync(join(outDir, "apple-touch-icon.png"), makeIcon(180));
console.log("Icons generated in", outDir);

