const fs = require('fs');
const zlib = require('zlib');

function processPng(inputPath, outputPath) {
  const data = fs.readFileSync(inputPath);

  // Read IHDR chunk length & type
  let pos = 8;
  const ihdrLen = data.readUInt32BE(pos);
  const ihdrType = data.toString('ascii', pos + 4, pos + 8);
  
  if (ihdrType !== 'IHDR') {
    throw new Error('Expected IHDR chunk first!');
  }

  const width = data.readUInt32BE(pos + 8);
  const height = data.readUInt32BE(pos + 12);
  const bitDepth = data[pos + 16];
  const colorType = data[pos + 17];

  console.log(`Image dimensions: ${width}x${height}, Bit Depth: ${bitDepth}, Color Type: ${colorType}`);

  pos += 12 + ihdrLen; // Skip IHDR

  const idatChunks = [];

  while (pos < data.length) {
    const length = data.readUInt32BE(pos);
    const type = data.toString('ascii', pos + 4, pos + 8);

    if (type === 'IDAT') {
      idatChunks.push(data.slice(pos + 8, pos + 8 + length));
    }
    pos += 12 + length;
  }

  const compressed = Buffer.concat(idatChunks);
  const uncompressed = zlib.inflateSync(compressed);

  console.log(`Uncompressed data length: ${uncompressed.length} bytes`);

  const bytesPerPixel = 4; // RGBA
  const stride = width * bytesPerPixel + 1;

  let modifiedPixels = 0;

  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;

    for (let x = 0; x < width; x++) {
      const pxOffset = rowStart + 1 + x * bytesPerPixel;
      const r = uncompressed[pxOffset];
      const g = uncompressed[pxOffset + 1];
      const b = uncompressed[pxOffset + 2];

      // Detect fake checkerboard background (white & light grey pixels near edges/background)
      const isCheckerboard = (r > 175 && g > 175 && b > 175) && Math.abs(r - g) < 18 && Math.abs(g - b) < 18;
      
      if (isCheckerboard) {
        uncompressed[pxOffset + 3] = 0; // Set Alpha to 0 (Fully Transparent)
        modifiedPixels++;
      }
    }
  }

  console.log(`Modified ${modifiedPixels} background pixels to transparent!`);

  const newCompressed = zlib.deflateSync(uncompressed);

  // Build new PNG
  const chunks = [];
  chunks.push(data.slice(0, 8)); // Signature

  pos = 8;
  while (pos < data.length) {
    const length = data.readUInt32BE(pos);
    const type = data.toString('ascii', pos + 4, pos + 8);

    if (type === 'IDAT') {
      pos += 12 + length;
      continue;
    }

    if (type === 'IEND') {
      const idatLengthBuf = Buffer.alloc(4);
      idatLengthBuf.writeUInt32BE(newCompressed.length, 0);

      const idatTypeBuf = Buffer.from('IDAT', 'ascii');
      const idatDataToCrc = Buffer.concat([idatTypeBuf, newCompressed]);
      const crc = crc32(idatDataToCrc);
      
      const idatCrcBuf = Buffer.alloc(4);
      idatCrcBuf.writeInt32BE(crc, 0);

      chunks.push(idatLengthBuf);
      chunks.push(idatTypeBuf);
      chunks.push(newCompressed);
      chunks.push(idatCrcBuf);

      chunks.push(data.slice(pos, pos + 12 + length));
      break;
    }

    chunks.push(data.slice(pos, pos + 12 + length));
    pos += 12 + length;
  }

  const finalBuffer = Buffer.concat(chunks);
  fs.writeFileSync(outputPath, finalBuffer);
  console.log(`✅ Successfully saved transparent logo to ${outputPath}!`);
}

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) | 0;
}

try {
  processPng('public/logo.png', 'public/logo-transparent.png');
} catch (e) {
  console.error('Error processing PNG:', e);
}
