const fs = require('fs');
let html = fs.readFileSync('mentor/buku-saku.html', 'utf8');
const bgBase64 = fs.readFileSync('bg_base64.txt', 'utf8').trim();
let newLogic = fs.readFileSync('export_logic_v2.js', 'utf8');
newLogic = newLogic.replace('bgBase64BoyReplacement', '`' + bgBase64 + '`');

// Replace the old exportClassProfiles function completely
const regex = /function exportClassProfiles\(grade\)\s*\{[\s\S]*?printWindow\.focus\(\);\s*\}/;
html = html.replace(regex, newLogic);

fs.writeFileSync('mentor/buku-saku.html', html);
console.log('Injected V2');
