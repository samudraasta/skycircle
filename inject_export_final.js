const fs = require('fs');

let html = fs.readFileSync('mentor/buku-saku.html', 'utf8');
const bgBase64 = fs.readFileSync('bg_base64.txt', 'utf8').trim();
let exportLogic = fs.readFileSync('export_logic.js', 'utf8');

// Replace placeholder with actual base64
exportLogic = exportLogic.replace('bgBase64BoyReplacement', '`' + bgBase64 + '`');

const exportUI = `
        <div style="text-align: center; color: #075e54; font-weight: 700; font-size: 14px; margin-top: 20px; margin-bottom: 4px;"><i class="fas fa-file-export"></i> EXPORT PROFIL (PRINT BATCH)</div>
        <div style="display: flex; gap: 10px;">
            <button onclick="exportClassProfiles('X')" style="flex: 1; background: #128c7e; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><i class="fas fa-print"></i> Kelas X</button>
            <button onclick="exportClassProfiles('XI')" style="flex: 1; background: #2563eb; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><i class="fas fa-print"></i> Kelas XI</button>
            <button onclick="exportClassProfiles('XII')" style="flex: 1; background: #7c3aed; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"><i class="fas fa-print"></i> Kelas XII</button>
        </div>
    </div>
    <!-- LAYAR 1.5:`;

html = html.replace('    </div>\n\n    <!-- LAYAR 1.5:', exportUI);
html = html.replace('    function checkQueryParamsOnLoad() {', exportLogic + '\n\n    function checkQueryParamsOnLoad() {');

fs.writeFileSync('mentor/buku-saku.html', html);
console.log('Successfully injected.');
