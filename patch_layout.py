with open("mentor/buku-saku.html", "r") as f:
    content = f.read()

css_old = """        .info-section {
            background: #fff; padding: 16px 18px; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .section-title {
            font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;
        }
        .section-content {
            font-size: 14px; color: #334155; line-height: 1.6; font-weight: 500;
        }"""

css_new = """        .info-group {
            margin-bottom: 6px;
        }
        .info-group-title {
            font-size: 12px; font-weight: 600; color: #64748b;
            margin-left: 12px; margin-bottom: 6px;
        }
        .info-section {
            background: #fff; padding: 14px 16px; border-radius: 16px; 
            border: 1px solid #f1f5f9; box-shadow: 0 1px 2px rgba(0,0,0,0.02);
            font-size: 13.5px; color: #334155; line-height: 1.5; font-weight: 500;
        }
        .info-section:last-child {
            margin-bottom: 0;
        }"""

content = content.replace(css_old, css_new)

js_old = """                    <div class="info-section">
                        <div class="section-title">Tentang Saya</div>
                        <div class="section-content">${karakter} &bull; ${aktivitas}</div>
                    </div>
                    
                    <div class="info-section">
                        <div class="section-title">Like</div>
                        <div class="section-content">${hobi} &bull; ${belajar} &bull; ${liburan}</div>
                    </div>

                    <div class="info-section">
                        <div class="section-title">Dislike</div>
                        <div class="section-content">${tidakDisukai}</div>
                    </div>
                    
                    ${extraHtml ? `<div class="info-section"><div class="section-title">Info Lainnya</div><div class="section-content">${extraHtml}</div></div>` : ''}

                    <div class="info-section">
                        <div class="section-title">Sosial Media & Kontak</div>
                        <div class="social-links">"""

js_new = """                    <div class="info-group">
                        <div class="info-group-title">TENTANG SAYA</div>
                        <div class="info-section">${karakter} &bull; ${aktivitas}</div>
                    </div>
                    
                    <div class="info-group">
                        <div class="info-group-title">LIKE</div>
                        <div class="info-section">${hobi} &bull; ${belajar} &bull; ${liburan}</div>
                    </div>

                    <div class="info-group">
                        <div class="info-group-title">DISLIKE</div>
                        <div class="info-section">${tidakDisukai}</div>
                    </div>
                    
                    ${extraHtml ? `<div class="info-group"><div class="info-group-title">INFO LAINNYA</div><div class="info-section">${extraHtml}</div></div>` : ''}

                    <div class="info-group">
                        <div class="info-group-title">SOSIAL MEDIA & KONTAK</div>
                        <div class="info-section" style="padding: 8px 12px;">
                        <div class="social-links">"""

content = content.replace(js_old, js_new)

with open("mentor/buku-saku.html", "w") as f:
    f.write(content)
