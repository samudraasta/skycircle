const fs = require('fs');
let content = fs.readFileSync('mentor/buku-saku.html', 'utf8');

const regex = /function renderHTML\(safeImgSrc, safeBgSrc\) \{[\s\S]*?\}, 500\);\n        \}/;

const newRenderHTML = `function renderHTML(safeImgSrc, safeBgSrc) {
            const container = document.getElementById('idCardContainer');
            const imgCors = safeImgSrc.startsWith('http') ? 'crossorigin="anonymous"' : '';
            container.innerHTML = \`
            <div id="idCard" style="position: relative; width: 400px; height: 678px; overflow: hidden; border-radius: 12px; color: \${themeColor}; font-family: 'Inter', sans-serif; background: #fff;">
                <img id="idCardBg" src="\${safeBgSrc}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" />
                <div class="canva-photo" style="position: absolute; top: 197.5px; left: 138.5px; width: 181px; height: 209px; z-index: 5; display: flex; justify-content: center; align-items: center; background: transparent;">
                    <img id="idCardImg" src="\${safeImgSrc}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 2px;" \${imgCors} />
                </div>
                <div class="canva-text text-name" style="position: absolute; right: 53.5px; bottom: 107px; width: 320px; text-align: right; font-size: 20px; font-weight: 800; text-transform: uppercase; z-index: 10;">\${mainName}</div>
                <div class="canva-text text-dob" style="position: absolute; right: 53.5px; bottom: 62px; width: 320px; text-align: right; font-size: 18px; font-weight: 800; text-transform: uppercase; z-index: 10;">\${dob}</div>
                <div class="canva-text text-class" style="position: absolute; right: 53.5px; bottom: 29px; width: 320px; text-align: right; font-size: 20px; font-weight: 800; text-transform: uppercase; z-index: 10;">\${teamName}</div>
            </div>
            \`;
            
            const bgImg = document.getElementById('idCardBg');
            const fgImg = document.getElementById('idCardImg');
            
            Promise.all([
                new Promise(r => { if(bgImg.complete) r(); else { bgImg.onload = r; bgImg.onerror = r; } }),
                new Promise(r => { if(fgImg.complete) r(); else { fgImg.onload = r; fgImg.onerror = r; } })
            ]).then(() => {
                setTimeout(() => {
                    const element = document.getElementById('idCard');
                    const opt = {
                        margin: 0,
                        filename: \`IDCard_\${mainName}.pdf\`,
                        image: { type: 'jpeg', quality: 1.0 },
                        html2canvas: { scale: 3, useCORS: true, backgroundColor: '#ffffff' },
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
