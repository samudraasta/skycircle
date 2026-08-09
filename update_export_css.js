const fs = require('fs');

let html = fs.readFileSync('mentor/buku-saku.html', 'utf8');

// Find where the style starts in exportClassProfiles
const startStyle = html.indexOf('<style>', html.indexOf('Export ID Card'));
const endBody = html.indexOf('</body>', startStyle);

const newStyleAndHtml = `<style>
                    @page { size: 54mm 86mm; margin: 0; }
                    body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #fff; }
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
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .photo {
                        position: absolute;
                        top: 25.5mm;
                        left: 13.85mm;
                        width: 25.4mm;
                        height: 31mm;
                        border-radius: 1mm;
                        overflow: hidden;
                        background-color: #eee;
                    }
                    .photo img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    .text {
                        position: absolute;
                        right: 7.5mm;
                        width: 40mm;
                        text-align: right;
                        text-transform: uppercase;
                        z-index: 10;
                        color: #1e88e5; /* Default blue, but safeBgSrc implies a specific background. If needed, this could be dynamic, but in the screenshot it's blue. Wait, the old jsPDF had doc.setTextColor(30,136,229) */
                    }
                    .name { top: 56.5mm; font-size: 11px; font-weight: 800; }
                    .dob { top: 64.5mm; font-size: 11px; font-weight: 800; }
                    .kelas { top: 69mm; font-size: 11px; font-weight: 800; }
                    @media print {
                        body { background: white; }
                        .id-card-page { margin: 0; box-shadow: none; border: none; }
                    }
                </style>
            </head>
            <body>
            \`;

            classProfiles.forEach(p => {
                const mainName = p.panggilan ? p.panggilan : (p.nama || 'Mentee');
                let finalImgSrc = 'https://ui-avatars.com/api/?name='+encodeURIComponent(mainName)+'&background=random&color=fff&size=512';
                if (p.fotoId && p.fotoId !== '-') {
                    finalImgSrc = \`https://wsrv.nl/?url=https://lh3.googleusercontent.com/d/\${p.fotoId}&w=400&h=520&fit=cover\`;
                } else if (p.fotoURL && p.fotoURL !== '-') {
                    finalImgSrc = p.fotoURL;
                }

                let dobStr = p.ttl || '';
                let dobArr = dobStr.split(', ');
                let dob = dobArr.length > 1 ? dobArr[1] : dobStr;
                // Formating date logic could go here, but simple string is ok for now.
                // In jsPDF we had logic to split dob if comma was present.
                // Let's grab the same logic used in renderHTML:
                const safeBgSrc = bgBase64BoyReplacement;

                htmlContent += \`
                <div class="id-card-page" style="background-image: url('\${safeBgSrc}');">
                    <div class="photo">
                        <img src="\${finalImgSrc}" crossorigin="anonymous" />
                    </div>
                    <div class="text name">\${mainName}</div>
                    <div class="text dob">\${dob}</div>
                    <div class="text kelas">\${p.kelompok || ''}</div>
                </div>
                \`;
            });

            htmlContent += \`
                \\x3Cscript>
                    window.onload = () => {
                        setTimeout(() => {
                            window.print();
                        }, 1000);
                    };
                \\x3C/script>
            </body>`;

const bgBase64 = fs.readFileSync('bg_base64.txt', 'utf8').trim();
const finalReplacement = newStyleAndHtml.replace('bgBase64BoyReplacement', '`' + bgBase64 + '`');

html = html.substring(0, startStyle) + finalReplacement + html.substring(endBody + 7);

fs.writeFileSync('mentor/buku-saku.html', html);
console.log('Successfully updated CSS');
