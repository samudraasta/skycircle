import re

with open("mentor/buku-saku.html", "r") as f:
    html = f.read()

# 1. Add html2pdf script
if "html2pdf" not in html:
    html = html.replace("</head>", '    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>\n</head>')

# 2. Add ID Card CSS
css_to_add = """
        /* ID Card Template Styling */
        #idCardContainer {
            position: absolute; top: -9999px; left: -9999px;
            width: 400px; height: 600px;
            background: #fff; z-index: -100;
        }
        #idCard {
            width: 400px; height: 600px;
            background-color: #fff;
            font-family: 'Inter', sans-serif;
            position: relative;
            box-sizing: border-box;
            color: #1e293b;
        }
        .idc-header {
            height: 110px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .idc-header-text h1 { margin: 0; font-size: 32px; font-weight: 800; letter-spacing: 2px; }
        .idc-header-text p { margin: 4px 0 0; font-size: 16px; opacity: 0.9; font-weight: 500;}
        
        .idc-body {
            position: relative;
            height: 490px;
            padding: 30px;
            display: flex; flex-direction: column; align-items: center;
        }
        .idc-vertical-text {
            position: absolute;
            left: -110px; top: 250px;
            transform: rotate(-90deg);
            font-size: 18px; font-weight: 800; color: #cbd5e1;
            letter-spacing: 6px; text-transform: uppercase;
            width: 300px; text-align: center;
        }
        .idc-photo-container {
            width: 200px; height: 260px;
            border: 6px solid;
            border-radius: 12px;
            overflow: hidden;
            background: #f1f5f9;
            display: flex; justify-content: center; align-items: center;
            margin-bottom: 35px;
            margin-top: 10px;
            position: relative; z-index: 10;
        }
        .idc-photo-container img {
            width: 100%; height: 100%; object-fit: cover;
        }
        .idc-info-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 18px;
            position: relative; z-index: 10;
        }
        .idc-info-table td {
            vertical-align: bottom;
            border-bottom: 1px dashed #94a3b8;
            padding-bottom: 4px;
        }
        .idc-label {
            font-size: 14px; font-weight: 700; color: #64748b;
            text-transform: uppercase; letter-spacing: 1px;
            width: 45%;
        }
        .idc-value {
            font-size: 22px; font-weight: 800;
            text-align: right;
            text-transform: uppercase;
        }
"""
if "#idCardContainer" not in html:
    html = html.replace("</style>", css_to_add + "\n    </style>")

# 3. Add #idCardContainer DOM element
if 'id="idCardContainer"' not in html:
    html = html.replace("</body>", '    <div id="idCardContainer"></div>\n</body>')

# 4. Change the share button in renderSlider
btn_old = r"""<button class="share-icon-btn" title="Bagikan Profil" onclick="shareProfile\('.*?'\)">\s*<i class="fas fa-share-alt"></i>\s*</button>"""
btn_new = """<button class="share-icon-btn" title="Unduh ID Card" onclick="shareProfile(${i})">
                        <i class="fas fa-id-badge"></i>
                    </button>"""
html = re.sub(btn_old, btn_new, html)

# 5. Replace shareProfile function
js_old = """    function shareProfile(nama, kelas) {
        const link = `https://skycircle.id/mentor/buku-saku.html?kelas=${encodeURIComponent(kelas)}&nama=${encodeURIComponent(nama)}`;
        navigator.clipboard.writeText(link).then(() => {
            const toast = document.getElementById('toast');
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        });
    }"""
js_new = """    function shareProfile(index) {
        const p = displayedProfiles[index];
        if (!p) return;
        
        const isBoy = p.kelas && p.kelas.toUpperCase().includes('BC');
        const themeColor = isBoy ? '#1e40af' : '#be185d';
        
        const mainName = p.panggilan ? p.panggilan : (p.nama || 'Mentee');
        const teamName = p.kelas || 'Sky Circle';
        const dob = p.tanggalLahir || '-';
        
        // Load image as Base64 to avoid CORS issues in canvas
        let imgUrl = p.fotoId && p.fotoId !== '-' ? `https://lh3.googleusercontent.com/d/${p.fotoId}=s400` : 'https://ui-avatars.com/api/?name='+encodeURIComponent(mainName);
        
        const toast = document.getElementById('toast');
        toast.innerText = 'Mempersiapkan ID Card...';
        toast.classList.add('show');
        
        // We will fetch the image and convert it to Base64 first to avoid html2canvas cors tainting
        fetch(imgUrl)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = function() {
                    const base64data = reader.result;
                    renderAndDownloadCard(base64data);
                }
                reader.readAsDataURL(blob);
            })
            .catch(err => {
                // If fetch fails (CORS block), fallback directly to imgUrl (might taint canvas but worth a try)
                console.warn('Image fetch failed, using direct url', err);
                renderAndDownloadCard(imgUrl);
            });

        function renderAndDownloadCard(safeImgSrc) {
            const container = document.getElementById('idCardContainer');
            container.innerHTML = `
            <div id="idCard">
                <div class="idc-header" style="background-color: ${themeColor}">
                    <div class="idc-header-text">
                        <h1>SKY CIRCLE</h1>
                        <p>Mentee Identity Card</p>
                    </div>
                </div>
                <div class="idc-body">
                    <div class="idc-vertical-text">STUDENT IDENTITY CARD</div>
                    <div class="idc-photo-container" style="border-color: ${themeColor}">
                        <img src="${safeImgSrc}" crossorigin="anonymous" />
                    </div>
                    <table class="idc-info-table">
                        <tr>
                            <td class="idc-label">NAME</td>
                            <td class="idc-value" style="color: ${themeColor}">${mainName}</td>
                        </tr>
                        <tr>
                            <td class="idc-label">DATE OF BIRTH</td>
                            <td class="idc-value" style="color: ${themeColor}; font-size: 18px;">${dob}</td>
                        </tr>
                        <tr>
                            <td class="idc-label">TEAM</td>
                            <td class="idc-value" style="color: ${themeColor}">${teamName}</td>
                        </tr>
                    </table>
                </div>
            </div>
            `;
            
            setTimeout(() => {
                const element = document.getElementById('idCard');
                const opt = {
                    margin: 0,
                    filename: `IDCard_${mainName}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 3, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' },
                    jsPDF: { unit: 'px', format: [400, 600], orientation: 'portrait' }
                };
                
                html2pdf().set(opt).from(element).save().then(() => {
                    toast.innerText = 'ID Card berhasil diunduh!';
                    setTimeout(() => toast.classList.remove('show'), 2000);
                }).catch(err => {
                    console.error('PDF generation error:', err);
                    toast.innerText = 'Gagal membuat ID Card';
                    setTimeout(() => toast.classList.remove('show'), 2000);
                });
            }, 500); // Wait for image to render in DOM
        }
    }"""
html = html.replace(js_old, js_new)

with open("mentor/buku-saku.html", "w") as f:
    f.write(html)
