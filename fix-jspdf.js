const fs = require('fs');
let content = fs.readFileSync('mentor/buku-saku.html', 'utf8');

const regex = /        function renderHTML\(safeImgSrc, safeBgSrc\) \{[\s\S]*?\}, 100\);\n            \}\);\n        \}/;

const newRenderHTML = `        function renderHTML(safeImgSrc, safeBgSrc) {
            const toast = document.getElementById('toast');
            toast.textContent = 'Mempersiapkan ID Card...';
            toast.classList.add('show');
            
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
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF({ unit: 'px', format: [400, 678] });
                    
                    const bgCanvas = document.createElement('canvas');
                    bgCanvas.width = 400; bgCanvas.height = 678;
                    bgCanvas.getContext('2d').drawImage(preloadBg, 0, 0, 400, 678);
                    doc.addImage(bgCanvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, 0, 400, 678);
                    
                    const fgCanvas = document.createElement('canvas');
                    fgCanvas.width = 181; fgCanvas.height = 209;
                    const ctxFg = fgCanvas.getContext('2d');
                    ctxFg.fillStyle = '#ffffff';
                    ctxFg.fillRect(0, 0, 181, 209);
                    
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
                    doc.addImage(fgCanvas.toDataURL('image/jpeg', 1.0), 'JPEG', 138.5, 197.5, 181, 209);
                    
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(themeColor);
                    
                    doc.setFontSize(20);
                    doc.text(mainName, 346.5, 571, { align: 'right' });
                    
                    doc.setFontSize(18);
                    doc.text(dob, 346.5, 616, { align: 'right' });
                    
                    doc.setFontSize(20);
                    doc.text(teamName, 346.5, 649, { align: 'right' });
                    
                    doc.save(\`IDCard_\${mainName.replace(/\\s+/g, '_')}.pdf\`);
                    toast.textContent = 'ID Card berhasil diunduh!';
                    setTimeout(() => toast.classList.remove('show'), 2000);
                } catch(e) {
                    console.error('PDF generation error:', e);
                    toast.textContent = 'Gagal membuat ID Card';
                    setTimeout(() => toast.classList.remove('show'), 2000);
                }
            });
        }`;

if(regex.test(content)) {
    content = content.replace(regex, newRenderHTML);
    fs.writeFileSync('mentor/buku-saku.html', content, 'utf8');
    console.log("Fixes applied successfully.");
} else {
    console.log("Could not find the target string.");
}
