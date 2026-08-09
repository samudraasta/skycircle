const fs = require('fs');
let content = fs.readFileSync('mentor/buku-saku.html', 'utf8');

// Fix CSS width for canva-text
content = content.replace(
    'width: 250px;\n            text-align: right;',
    'width: 320px;\n            text-align: right;'
);

// Fix Date Logic
const oldDateLogic = `        let dob = p.tanggalLahir || '-';
        if (dob !== '-') {
            const dObj = new Date(dob);
            if (!isNaN(dObj.getTime())) {
                dob = \`\${String(dObj.getDate()).padStart(2, '0')} / \${String(dObj.getMonth()+1).padStart(2, '0')} / \${dObj.getFullYear()}\`;
            }
        }`;
const newDateLogic = `        let dobStr = p.tanggalLahir || '-';
        if (p.extraFields) {
            const tlField = p.extraFields.find(ef => ef.label.toLowerCase().includes('lahir'));
            if (tlField && tlField.value) dobStr = tlField.value;
        }
        let dob = '-';
        if (dobStr !== '-') {
            const dObj = new Date(dobStr);
            if (!isNaN(dObj.getTime())) {
                dob = \`\${String(dObj.getDate()).padStart(2, '0')} / \${String(dObj.getMonth()+1).padStart(2, '0')} / \${dObj.getFullYear()}\`;
            } else {
                const mapBln = {'januari':1,'februari':2,'maret':3,'april':4,'mei':5,'juni':6,'juli':7,'agustus':8,'september':9,'oktober':10,'november':11,'desember':12};
                const parts = dobStr.toLowerCase().split(' ');
                if (parts.length >= 3) {
                    const d = parseInt(parts[0]);
                    const m = mapBln[parts[1]];
                    const y = parseInt(parts[2]);
                    if (!isNaN(d) && m && !isNaN(y)) {
                        dob = \`\${String(d).padStart(2, '0')} / \${String(m).padStart(2, '0')} / \${y}\`;
                    } else dob = p.tanggalLahir;
                } else dob = p.tanggalLahir;
            }
        }`;
content = content.replace(oldDateLogic, newDateLogic);

// Fix renderHTML
const oldRenderHTML = `            function renderHTML(safeImgSrc, safeBgSrc) {
                const container = document.getElementById('idCardContainer');
                container.innerHTML = \`
                <div id="idCard" style="background-image: url('\${safeBgSrc}'); background-size: cover; color: \${themeColor}; overflow: hidden;">
                    <div class="canva-photo">
                        <img src="\${safeImgSrc}" crossorigin="anonymous" />
                    </div>
                    <div class="canva-text text-name">\${mainName}</div>
                    <div class="canva-text text-dob">\${dob}</div>
                    <div class="canva-text text-class">\${teamName}</div>
                </div>
                \`;
                
                setTimeout(() => {
                    const element = document.getElementById('idCard');
                    const opt = {
                        margin: 0,
                        filename: \`IDCard_\${mainName}.pdf\`,
                        image: { type: 'jpeg', quality: 1.0 },
                        html2canvas: { scale: 3, useCORS: true, backgroundColor: '#ffffff' },
                        jsPDF: { unit: 'px', format: [400, 680], orientation: 'portrait' }
                    };
                    
                    html2pdf().set(opt).from(element).save().then(() => {
                        toast.textContent = 'ID Card berhasil diunduh!';
                        setTimeout(() => toast.classList.remove('show'), 2000);
                    }).catch(err => {
                        console.error('PDF generation error:', err);
                        toast.textContent = 'Gagal membuat ID Card';
                        setTimeout(() => toast.classList.remove('show'), 2000);
                    });
                }, 500);
            }`;

const newRenderHTML = `            function renderHTML(safeImgSrc, safeBgSrc) {
                const container = document.getElementById('idCardContainer');
                container.innerHTML = \`
                <div id="idCard" style="position: relative; width: 400px; height: 678px; overflow: hidden; border-radius: 12px; color: \${themeColor}; font-family: 'Inter', sans-serif; background: #fff;">
                    <img id="idCardBg" src="\${safeBgSrc}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" crossorigin="anonymous" />
                    <div class="canva-photo" style="position: absolute; top: 197.5px; left: 138.5px; width: 181px; height: 209px; z-index: 5; display: flex; justify-content: center; align-items: center; background: transparent;">
                        <img id="idCardImg" src="\${safeImgSrc}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 2px;" crossorigin="anonymous" />
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
content = content.replace(oldRenderHTML, newRenderHTML);

// Fix missing data URI prefix if Apps Script only returns raw base64
const oldFetchRes = `                if (res.status === 'success' && res.dataUri) {
                    renderHTML(res.dataUri, bgImageUrl);
                } else {`;
const newFetchRes = `                if (res.status === 'success' && res.dataUri) {
                    let dUri = res.dataUri;
                    if (!dUri.startsWith('data:')) dUri = 'data:image/jpeg;base64,' + dUri;
                    renderHTML(dUri, bgImageUrl);
                } else {`;
content = content.replace(oldFetchRes, newFetchRes);

fs.writeFileSync('mentor/buku-saku.html', content, 'utf8');
console.log("Fixes applied successfully.");
