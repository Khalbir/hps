const fs = require('fs');

// Read logo.png
const buffer = fs.readFileSync('public/logo.png');
console.log('Logo PNG buffer byte size:', buffer.length);
