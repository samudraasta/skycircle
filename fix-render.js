const fs = require('fs');
let content = fs.readFileSync('mentor/buku-saku.html', 'utf8');

const regex = /        function renderHTML\(safeImgSrc, safeBgSrc\) \{[\s\S]*?\}, 100\);\n            \}\);\n        \}/;

const newRenderHTML = `        function renderHTML(safeImgSrc, safeBgSrc) {
            const container = document.getElementById('idCardContainer');
            container.innerHTML = \`
            <div id="idCard" style="position: relative; width: 400px; height: 678px; color: \${themeColor}; font-family: 'Inter', sans-serif; background-color: #fff; background-image: url('\${safeBgSrc}'); background-size: cover; background-position: center;">
                <div class="canva-photo" style="position: absolute; top: 197.5px; left: 138.5px; width: 181px; height: 209px; z-index: 5; background-image: url('\${safeImgSrc}'); background-size: cover; background-position: center; border-radius: 2px;">
                </div>
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
                setTimeout(() => {
                    const element = document.getElementById('idCard');
                    const opt = {
                        margin: 0,
                        filename: \`IDCard_\${mainName.replace(/\\s+/g, '_')}.pdf\`,
                        image: { type: 'jpeg', quality: 1.0 },
                        html2canvas: { scale: 3, useCORS: true, logging: true, backgroundColor: '#ffffff' },
                        jsPDF: { unit: 'px', format: [400, 678], orientation: 'portrait' }
                    };
                    
                    html2pdf().set(opt).from(element).save().then(() => {
                        toast.textContent = 'ID Card berhasil diunduh!';
                        setTimeout(() => toast.classList.remove('show'), 2000);
                    }).catch(err => {
                        console.error('PDF generation error:', err);
                        toast.textContent = 'Gagal membuat ID Card';
                        setTimeout(() => toast.classList.remove('show'), 2000);
                    });
                }, 250);
            });
        }`;

if(regex.test(content)) {
    content = content.replace(regex, newRenderHTML);
    fs.writeFileSync('mentor/buku-saku.html', content, 'utf8');
    console.log("Fixes applied successfully.");
} else {
    console.log("Could not find the target string.");
}
