/**
 * Generates app/favicon.ico — a 32×32 anti-aliased green circle (#4A5C3A)
 * encoded as a PNG-in-ICO (modern ICO format, no external dependencies).
 */
const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

// ── CRC32 (needed for PNG chunks) ────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf    = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length);
  const crcInput  = Buffer.concat([typeBytes, data]);
  const crcBuf    = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

// ── Draw a 32×32 anti-aliased circle ────────────────────────────────────────
function makeCirclePNG(size, hexColour) {
  const r = parseInt(hexColour.slice(1, 3), 16);
  const g = parseInt(hexColour.slice(3, 5), 16);
  const b = parseInt(hexColour.slice(5, 7), 16);
  const cx = (size - 1) / 2;
  const radius = size / 2 - 0.5;

  // Build raw RGBA scanlines, each prefixed with filter-type byte 0 (None).
  const scanlines = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // PNG filter: None
    for (let x = 0; x < size; x++) {
      const dist  = Math.sqrt((x - cx) ** 2 + (y - cx) ** 2);
      let   alpha = 0;
      if      (dist <= radius - 0.5) alpha = 255;
      else if (dist <= radius + 0.5) alpha = Math.round((radius + 0.5 - dist) * 255);
      const i = 1 + x * 4;
      row[i]     = r;
      row[i + 1] = g;
      row[i + 2] = b;
      row[i + 3] = alpha;
    }
    scanlines.push(row);
  }

  const raw        = Buffer.concat(scanlines);
  const compressed = zlib.deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 6; // colour type: RGBA
  ihdr[10] = 0; // compression method
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace: none

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Wrap PNG(s) in an ICO container ─────────────────────────────────────────
function buildICO(images) {
  // images: [{ size, png }]
  const count = images.length;

  // ICONDIR header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = ICO
  header.writeUInt16LE(count, 4);

  // ICONDIRENTRY (16 bytes each) + image blobs
  const entries = [];
  const blobs   = [];
  let   offset  = 6 + count * 16;

  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size; // width  (0 means 256)
    entry[1] = size >= 256 ? 0 : size; // height
    entry[2] = 0;                       // colour count (0 = truecolour)
    entry[3] = 0;                       // reserved
    entry.writeUInt16LE(1,  4);         // planes
    entry.writeUInt16LE(32, 6);         // bits per pixel
    entry.writeUInt32LE(png.length, 8); // image data size
    entry.writeUInt32LE(offset,    12); // offset in file
    entries.push(entry);
    blobs.push(png);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...blobs]);
}

// ── Main ─────────────────────────────────────────────────────────────────────
const colour  = '#4A5C3A';
const png32   = makeCirclePNG(32, colour);
const png16   = makeCirclePNG(16, colour);
const ico     = buildICO([
  { size: 16, png: png16 },
  { size: 32, png: png32 },
]);

const outPath = path.join(__dirname, '..', 'app', 'favicon.ico');
fs.writeFileSync(outPath, ico);
console.log(`favicon.ico written (${ico.length} bytes) → ${outPath}`);
