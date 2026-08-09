const fs = require('fs');
let content = fs.readFileSync('mentor/buku-saku.html', 'utf8');

const startStr = '        function renderHTML(safeImgSrc, safeBgSrc) {';
const endStr = '        }';

const startIndex = content.indexOf(startStr);
let endIndex = content.indexOf(endStr, startIndex + 100);

if (startIndex !== -1 && endIndex !== -1) {
    let temp = content.substring(startIndex, content.indexOf('    function showToast(msg)', startIndex));
    const finalEndIndex = startIndex + temp.lastIndexOf('}');
    
    const newRenderHTML = `        function renderHTML(safeImgSrc, safeBgSrc) {
            const toast = document.getElementById('toast');
            toast.textContent = 'Mempersiapkan ID Card...';
            toast.classList.add('show');
            
            function loadImageAsync(src) {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    if (src.startsWith('http')) img.crossOrigin = "anonymous";
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error('Image load failed'));
                    img.src = src;
                });
            }
            
            Promise.all([
                loadImageAsync(safeBgSrc).catch(e => null),
                loadImageAsync(safeImgSrc).catch(e => null)
            ]).then(([loadedBg, loadedFg]) => {
                try {
                    const { jsPDF } = window.jspdf;
                    const doc = new jsPDF({ unit: 'px', format: [400, 678] });
                    
                    // Background
                    let bgBase64 = safeBgSrc;
                    if (safeBgSrc.startsWith('data:')) {
                        bgBase64 = safeBgSrc.split(',')[1]; // Pasti menghapus prefix
                    }
                    try {
                        doc.addImage(bgBase64, 'JPEG', 0, 0, 400, 678);
                    } catch (e1) {
                        console.error('BG addImage error', e1);
                    }
                    
                    // Foreground
                    if (loadedFg && loadedFg.naturalWidth > 0) {
                        try {
                            const fgCanvas = document.createElement('canvas');
                            fgCanvas.width = 181; fgCanvas.height = 209;
                            const ctxFg = fgCanvas.getContext('2d');
                            ctxFg.fillStyle = '#ffffff';
                            ctxFg.fillRect(0, 0, 181, 209);
                            
                            const imgRatio = loadedFg.naturalWidth / loadedFg.naturalHeight;
                            const canvasRatio = 181 / 209;
                            let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
                            
                            if (imgRatio > canvasRatio) {
                                drawHeight = 209; drawWidth = loadedFg.naturalWidth * (209 / loadedFg.naturalHeight);
                                offsetX = (181 - drawWidth) / 2;
                            } else {
                                drawWidth = 181; drawHeight = loadedFg.naturalHeight * (181 / loadedFg.naturalWidth);
                                offsetY = (209 - drawHeight) / 2;
                            }
                            ctxFg.drawImage(loadedFg, offsetX, offsetY, drawWidth, drawHeight);
                            
                            const fgDataUrl = fgCanvas.toDataURL('image/jpeg', 1.0);
                            const fgBase64 = fgDataUrl.split(',')[1]; // Pasti menghapus prefix
                            doc.addImage(fgBase64, 'JPEG', 138.5, 197.5, 181, 209);
                        } catch (errFg) {
                            console.error("Gagal draw fg:", errFg);
                        }
                    }
                    
                    // Texts
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
            });`;
            
    content = content.substring(0, startIndex) + newRenderHTML + content.substring(finalEndIndex + 1);
    fs.writeFileSync('mentor/buku-saku.html', content, 'utf8');
    console.log("Fixes applied successfully.");
} else {
    console.log("Could not find the target string.");
}
