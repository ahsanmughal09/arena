import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createPng(width, height, pixelFn) {
  // 1. Raw scanline data: 1 byte filter (0) + width * 4 bytes RGBA per line
  const rawLineLen = 1 + width * 4;
  const rawData = Buffer.alloc(height * rawLineLen);

  for (let y = 0; y < height; y++) {
    const lineOffset = y * rawLineLen;
    rawData[lineOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pxOffset = lineOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);

  // Helper for PNG chunk
  function makeChunk(type, data) {
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const typeAndData = Buffer.concat([typeBuf, data]);
    const crcVal = zlib.crc32(typeAndData);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal >>> 0, 0);
    return Buffer.concat([lenBuf, typeAndData, crcBuf]);
  }

  // PNG Header
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth 8
  ihdrData[9] = 6;  // color type 6 (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT Chunk
  const idatChunk = makeChunk('IDAT', idatData);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Icon Pixel Generator: Premium Ludo Dice Icon with 4 color corner accents
function generateLudoIcon(x, y, w, h) {
  const nx = (x / w) * 2 - 1; // -1 to 1
  const ny = (y / h) * 2 - 1; // -1 to 1
  const distCenter = Math.sqrt(nx * nx + ny * ny);

  // Rounded squircle background
  const squircle = Math.pow(Math.abs(nx), 3.2) + Math.pow(Math.abs(ny), 3.2);
  if (squircle > 0.88) {
    return [0, 0, 0, 0]; // Transparent outside
  }

  // Outer gradient: Dark Blue/Indigo (#0F172A to #1E1B4B)
  let r = 15 + Math.floor((1 - ny) * 10);
  let g = 23 + Math.floor((1 - ny) * 12);
  let b = 42 + Math.floor((1 - ny) * 30);
  let a = 255;

  // 4 Corner Color Accents (Red top-left, Green top-right, Yellow bottom-left, Blue bottom-right)
  const margin = 0.55;
  if (nx < -margin && ny < -margin) { // Top-Left Red
    r = 239; g = 68; b = 68;
  } else if (nx > margin && ny < -margin) { // Top-Right Green
    r = 46; g = 213; b = 115;
  } else if (nx < -margin && ny > margin) { // Bottom-Left Yellow
    r = 255; g = 165; b = 2;
  } else if (nx > margin && ny > margin) { // Bottom-Right Blue
    r = 30; g = 144; b = 255;
  }

  // Centered Dice Body (3D Rounded Cube)
  const cubeSize = 0.48;
  if (Math.abs(nx) < cubeSize && Math.abs(ny) < cubeSize) {
    const cubeNx = nx / cubeSize;
    const cubeNy = ny / cubeSize;
    const cubeDist = Math.pow(Math.abs(cubeNx), 4) + Math.pow(Math.abs(cubeNy), 4);

    if (cubeDist < 0.82) {
      // White/Indigo Gradient Dice Face
      const shine = (1 - cubeNy) * 35;
      r = Math.min(255, 235 + Math.floor(shine));
      g = Math.min(255, 238 + Math.floor(shine));
      b = Math.min(255, 250);

      // Dice Dots (6 Dots pattern)
      const dotPositions = [
        [-0.45, -0.45], [0.45, -0.45],
        [-0.45, 0],     [0.45, 0],
        [-0.45, 0.45],  [0.45, 0.45]
      ];

      let isDot = false;
      for (const [dx, dy] of dotPositions) {
        const dist = Math.sqrt(Math.pow(cubeNx - dx, 2) + Math.pow(cubeNy - dy, 2));
        if (dist < 0.14) {
          isDot = true;
          break;
        }
      }

      if (isDot) {
        // Glowing Indigo/Purple Dots
        r = 79; g = 70; b = 229;
      }
    }
  }

  return [r, g, b, a];
}

const publicDir = path.join(__dirname, '..', 'public');

console.log('Generating 192x192 PWA Icon...');
const png192 = createPng(192, 192, generateLudoIcon);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

console.log('Generating 512x512 PWA Icon...');
const png512 = createPng(512, 512, generateLudoIcon);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

console.log('Generating Apple Touch Icon...');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png192);

console.log('Generating Maskable Icon...');
fs.writeFileSync(path.join(publicDir, 'maskable-icon.png'), png512);

console.log('All PWA Icons generated successfully!');
