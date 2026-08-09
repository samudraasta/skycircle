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
            toast.textContent = 'Menyiapkan dialog cetak PDF...';
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 1500);

            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(\`
                <html>
                <head>
                    <title>IDCard_\${mainName}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
                    <style>
                        @page {
                            size: 400px 678px;
                            margin: 0;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .id-card {
                            position: relative;
                            width: 400px;
                            height: 678px;
                            background-color: #fff;
                            background-image: url('\${safeBgSrc}');
                            background-size: cover;
                            background-position: center;
                            color: \${themeColor};
                            font-family: 'Inter', sans-serif;
                            overflow: hidden;
                        }
                        .photo {
                            position: absolute;
                            top: 197.5px;
                            left: 138.5px;
                            width: 181px;
                            height: 209px;
                            background-image: url('\${safeImgSrc}');
                            background-size: cover;
                            background-position: center;
                            border-radius: 2px;
                        }
                        .text {
                            position: absolute;
                            right: 53.5px;
                            width: 320px;
                            text-align: right;
                            text-transform: uppercase;
                            z-index: 10;
                        }
                        .name { bottom: 107px; font-size: 20px; font-weight: 800; }
                        .dob { bottom: 62px; font-size: 18px; font-weight: 800; }
                        .kelas { bottom: 29px; font-size: 20px; font-weight: 800; }
                    </style>
                </head>
                <body>
                    <div class="id-card">
                        <div class="photo"></div>
                        <div class="text name">\${mainName}</div>
                        <div class="text dob">\${dob}</div>
                        <div class="text kelas">\${teamName}</div>
                    </div>
                    <script>
                        window.onload = function() {
                            setTimeout(() => {
                                window.print();
                            }, 500);
                        };
                    </script>
                </body>
                </html>
            \`);
            doc.close();
            
            setTimeout(() => {
                if(document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 60000); // Hapus iframe setelah 1 menit agar tidak menumpuk
        }`;
            
    content = content.substring(0, startIndex) + newRenderHTML + content.substring(finalEndIndex + 1);
    fs.writeFileSync('mentor/buku-saku.html', content, 'utf8');
    console.log("Fixes applied successfully.");
} else {
    console.log("Could not find the target string.");
}
