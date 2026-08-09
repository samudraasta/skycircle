const fs = require('fs');
let content = fs.readFileSync('mentor/buku-saku.html', 'utf8');

const oldRenderHTML = `            function renderHTML(safeImgSrc, safeBgSrc) {
                const container = document.getElementById('idCardContainer');
                container.innerHTML = \`
                <div id="idCard" style="position: relative; width: 400px; height: 678px; overflow: hidden; border-radius: 12px; color: \${themeColor}; font-family: 'Inter', sans-serif; background: #fff;">
                    <img id="idCardBg" src="\${safeBgSrc}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" crossorigin="anonymous" />
                    <div class="canva-photo" style="position: absolute; top: 197.5px; left: 138.5px; width: 181px; height: 209px; z-index: 5; display: flex; justify-content: center; align-items: center; background: transparent;">
                        <img id="idCardImg" src="\${safeImgSrc}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 2px;" crossorigin="anonymous" />
                    </div>`;

const newRenderHTML = `            function renderHTML(safeImgSrc, safeBgSrc) {
                const container = document.getElementById('idCardContainer');
                const imgCors = safeImgSrc.startsWith('http') ? 'crossorigin="anonymous"' : '';
                container.innerHTML = \`
                <div id="idCard" style="position: relative; width: 400px; height: 678px; overflow: hidden; border-radius: 12px; color: \${themeColor}; font-family: 'Inter', sans-serif; background: #fff;">
                    <img id="idCardBg" src="\${safeBgSrc}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" />
                    <div class="canva-photo" style="position: absolute; top: 197.5px; left: 138.5px; width: 181px; height: 209px; z-index: 5; display: flex; justify-content: center; align-items: center; background: transparent;">
                        <img id="idCardImg" src="\${safeImgSrc}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 2px;" \${imgCors} />
                    </div>`;

if(content.includes(oldRenderHTML)) {
    content = content.replace(oldRenderHTML, newRenderHTML);
    fs.writeFileSync('mentor/buku-saku.html', content, 'utf8');
    console.log("Fixes applied successfully.");
} else {
    console.log("Could not find the target string.");
}
