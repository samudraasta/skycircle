    function exportClassProfiles(grade) {
        if (!allData || allData.length === 0) {
            showToast('Data belum termuat, tunggu sebentar...');
            return;
        }

        const classProfiles = allData.filter(p => p.kelompok && p.kelompok.includes(' ' + grade + '-'));
        
        if (classProfiles.length === 0) {
            showToast('Tidak ada data untuk Kelas ' + grade);
            return;
        }

        const toast = document.getElementById('toast');
        toast.textContent = 'Menyiapkan Export Kelas ' + grade + '...';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);

        const printWindow = window.open('', '_blank');
        
        let htmlContent = `
        <html>
        <head>
            <title>Export ID Card - Kelas ${grade}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                @page { size: 54mm 86mm; margin: 0; }
                body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #f0f0f0; }
                .id-card-page {
                    width: 54mm;
                    height: 86mm;
                    page-break-after: always;
                    position: relative;
                    overflow: hidden;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    margin: 0 auto;
                }
                .canva-photo {
                    position: absolute;
                    top: 25.5mm;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 25.4mm;
                    height: 31mm;
                    border-radius: 1.5mm;
                    overflow: hidden;
                    background: #eee;
                    z-index: 1;
                }
                .canva-photo img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .canva-name {
                    position: absolute;
                    top: 59mm;
                    left: 0;
                    width: 100%;
                    text-align: center;
                    font-size: 13px;
                    font-weight: 800;
                    line-height: 1.1;
                    z-index: 2;
                    padding: 0 4mm;
                    box-sizing: border-box;
                    color: white;
                }
                .canva-school {
                    position: absolute;
                    top: 67mm;
                    left: 0;
                    width: 100%;
                    text-align: center;
                    font-size: 8px;
                    font-weight: 600;
                    z-index: 2;
                    color: white;
                }
                .canva-group {
                    position: absolute;
                    top: 71mm;
                    left: 0;
                    width: 100%;
                    text-align: center;
                    font-size: 8px;
                    font-weight: 700;
                    z-index: 2;
                    color: #ffd700;
                }
                @media print {
                    body { background: white; }
                    .id-card-page { margin: 0; box-shadow: none; border: none; }
                }
            </style>
        </head>
        <body>
        `;

        classProfiles.forEach(p => {
            const mainName = p.panggilan ? p.panggilan : (p.nama || 'Mentee');
            let finalImgSrc = 'https://ui-avatars.com/api/?name='+encodeURIComponent(mainName)+'&background=random&color=fff&size=512';
            if (p.fotoId && p.fotoId !== '-') {
                finalImgSrc = \`https://wsrv.nl/?url=https://lh3.googleusercontent.com/d/\${p.fotoId}&w=400&h=520&fit=cover\`;
            } else if (p.fotoURL && p.fotoURL !== '-') {
                finalImgSrc = p.fotoURL;
            }

            const safeBgSrc = bgBase64BoyReplacement;

            htmlContent += \`
            <div class="id-card-page" style="background-image: url('\${safeBgSrc}');">
                <div class="canva-photo">
                    <img src="\${finalImgSrc}" crossorigin="anonymous" />
                </div>
                <div class="canva-name">\${mainName}</div>
                <div class="canva-school">\${p.sekolah || ''}</div>
                <div class="canva-group">\${p.kelompok || ''}</div>
            </div>
            \`;
        });

        htmlContent += `
            <script>
                window.onload = () => {
                    setTimeout(() => {
                        window.print();
                    }, 1000);
                };
            </script>
        </body>
        </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
    }
