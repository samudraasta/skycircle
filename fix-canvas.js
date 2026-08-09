const fs = require('fs');
let content = fs.readFileSync('mentor/buku-saku.html', 'utf8');

const regex = /        function renderHTML\(safeImgSrc, safeBgSrc\) \{[\s\S]*?\}, 250\);\n            \}\);\n        \}/;

const newRenderHTML = `        function renderHTML(safeImgSrc, safeBgSrc) {
            const container = document.getElementById('idCardContainer');
            container.innerHTML = \`
            <div id="idCard" style="position: relative; width: 400px; height: 678px; background-color: #fff; overflow: hidden; color: \${themeColor}; font-family: 'Inter', sans-serif;">
                <div id="canvasBgWrapper" style="position: absolute; top: 0; left: 0; width: 400px; height: 678px; z-index: 0;"></div>
                <div id="canvasFgWrapper" style="position: absolute; top: 197.5px; left: 138.5px; width: 181px; height: 209px; z-index: 5; border-radius: 2px; overflow: hidden;"></div>
                <div class="canva-text text-name" style="position: absolute; right: 53.5px; bottom: 107px; width: 320px; text-align: right; font-size: 20px; font-weight: 800; text-transform: uppercase; z-index: 10;">\${mainName}</div>
                <div class="canva-text text-dob" style="position: absolute; right: 53.5px; bottom: 62px; width: 320px; text-align: right; font-size: 18px; font-weight: 800; text-transform: uppercase; z-index: 10;">\${dob}</div>
                <div class="canva-text text-class" style="position: absolute; right: 53.5px; bottom: 29px; width: 320px; text-align: right; font-size: 20px; font-weight: 800; text-transform: uppercase; z-index: 10;">\${teamName}</div>
            </div>
            \`;
            
            const preloadBg = new Image();
            preloadBg.src = safeBgSrc;
            
            const preloadFg = new Image();
            if (safeImgSrc.startsWith('http')) preloadFg.crossOrigin = "anonymous";
            preloadFg.src = safeImgSrc;
            
            Promise.all([
                new Promise(r => { if(preloadBg.complete) r(); else { preloadBg.onload = r; preloadBg.onerror = r; } }),
                new Promise(r => { if(preloadFg.complete) r(); else { preloadFg.onload = r; preloadFg.onerror = r; } })
            ]).then(() => {
                try {
                    const bgCanvas = document.createElement('canvas');
                    bgCanvas.width = 400; bgCanvas.height = 678;
                    bgCanvas.getContext('2d').drawImage(preloadBg, 0, 0, 400, 678);
                    document.getElementById('canvasBgWrapper').appendChild(bgCanvas);
                } catch(e) { console.error('bgCanvas error', e); }
                
                try {
                    const fgCanvas = document.createElement('canvas');
                    fgCanvas.width = 181; fgCanvas.height = 209;
                    const ctxFg = fgCanvas.getContext('2d');
                    
                    if (preloadFg.width && preloadFg.height) {
                        const imgRatio = preloadFg.width / preloadFg.height;
                        const canvasRatio = 181 / 209;
                        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
                        if (imgRatio > canvasRatio) {
                            drawHeight = 209; drawWidth = preloadFg.width * (209 / preloadFg.height);
                            offsetX = (181 - drawWidth) / 2;
                        } else {
                            drawWidth = 181; drawHeight = preloadFg.height * (181 / preloadFg.width);
                            offsetY = (209 - drawHeight) / 2;
                        }
                        ctxFg.drawImage(preloadFg, offsetX, offsetY, drawWidth, drawHeight);
                    } else {
                        ctxFg.drawImage(preloadFg, 0, 0, 181, 209);
                    }
                    document.getElementById('canvasFgWrapper').appendChild(fgCanvas);
                } catch(e) { console.error('fgCanvas error', e); }
                
                // Bring to viewport momentarily to ensure rasterization, but behind everything
                container.style.top = '0px';
                container.style.left = '0px';
                container.style.zIndex = '-9999';
                
                setTimeout(() => {
                    const element = document.getElementById('idCard');
                    const opt = {
                        margin: 0,
                        filename: \`IDCard_\${mainName.replace(/\\s+/g, '_')}.pdf\`,
                        image: { type: 'jpeg', quality: 1.0 },
                        html2canvas: { scale: 3, useCORS: true, backgroundColor: '#ffffff' },
                        jsPDF: { unit: 'px', format: [400, 678], orientation: 'portrait' }
                    };
                    
                    html2pdf().set(opt).from(element).save().then(() => {
                        container.style.top = '-9999px';
                        container.style.left = '-9999px';
                        toast.textContent = 'ID Card berhasil diunduh!';
                        setTimeout(() => toast.classList.remove('show'), 2000);
                    }).catch(err => {
                        container.style.top = '-9999px';
                        container.style.left = '-9999px';
                        console.error('PDF generation error:', err);
                        toast.textContent = 'Gagal membuat ID Card';
                        setTimeout(() => toast.classList.remove('show'), 2000);
                    });
                }, 100);
            });
        }`;

if(regex.test(content)) {
    content = content.replace(regex, newRenderHTML);
    fs.writeFileSync('mentor/buku-saku.html', content, 'utf8');
    console.log("Fixes applied successfully.");
} else {
    console.log("Could not find the target string.");
}
