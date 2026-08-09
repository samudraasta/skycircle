const fs = require('fs');
let content = fs.readFileSync('mentor/buku-saku.html', 'utf8');

const newBgBase64 = fs.readFileSync('bg_base64.txt', 'utf8');

// Replace base64BgBoy
content = content.replace(/const base64BgBoy = "data:image\/png;base64,.*?";/, `const base64BgBoy = "${newBgBase64}";`);
// Replace base64BgGirl
content = content.replace(/const base64BgGirl = "data:image\/png;base64,.*?";/, `const base64BgGirl = "${newBgBase64}";`);

// Change doc.addImage 'PNG' to 'JPEG' for the background
content = content.replace(/doc\.addImage\(safeBgSrc, 'PNG'/g, `doc.addImage(safeBgSrc, 'JPEG'`);

fs.writeFileSync('mentor/buku-saku.html', content, 'utf8');
console.log("Background updated successfully.");
