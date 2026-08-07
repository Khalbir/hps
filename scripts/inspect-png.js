const fs = require('fs');

const data = fs.readFileSync('public/logo.png');
console.log('PNG Header Signature:', data.slice(0, 8));

let pos = 8;
while (pos < data.length) {
  const len = data.readUInt32BE(pos);
  const type = data.toString('ascii', pos + 4, pos + 8);
  console.log(`Chunk: ${type}, length: ${len}`);
  pos += 12 + len;
}
