const sharp = require('sharp');
const fs = require('fs');

async function convert() {
  console.log('Processing public/logo.png with sharp...');
  
  const image = sharp('public/logo.png');
  const metadata = await image.metadata();
  console.log(`Dimensions: ${metadata.width}x${metadata.height}, Format: ${metadata.format}`);

  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  console.log(`Buffer length: ${data.length}, width: ${info.width}, height: ${info.height}, channels: ${info.channels}`);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Detect checkerboard pattern & white background
    const isNeutralGreyOrWhite = (r > 170 && g > 170 && b > 170) && Math.abs(r - g) < 22 && Math.abs(g - b) < 22 && Math.abs(r - b) < 22;

    if (isNeutralGreyOrWhite) {
      data[i + 3] = 0; // Transparent alpha
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toFile('public/logo-clean.png');

  fs.copyFileSync('public/logo-clean.png', 'public/logo.png');
  console.log('✅ Clean transparent PNG generated at public/logo-clean.png & updated public/logo.png!');
}

convert().catch(console.error);
