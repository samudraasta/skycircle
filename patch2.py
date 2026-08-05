import re

with open("mentor/buku-saku.html", "r") as f:
    content = f.read()

# CSS Patch
css_start = content.find("        .card-header-info {\n")
css_end = content.find("        .info-ig {\n", css_start)
css_new = """        .card-header-info {
            padding: 20px 20px 14px;
            border-bottom: 1px solid #e2e8f0;
            background: #fff;
            flex-shrink: 0;
            text-align: left;
        }
        .card-header-info h2 {
            font-size: 26px; font-weight: 800; color: #0f172a;
            margin-bottom: 4px;
        }
        .card-header-info p.full-name {
            font-size: 14px; color: #64748b; font-weight: 500;
            margin-bottom: 12px;
        }
        .header-meta {
            display: flex; flex-direction: column; gap: 8px; margin-top: 14px;
        }
        .header-meta-item {
            display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; color: #475569; font-weight: 500; line-height: 1.4;
        }
        .header-meta-item i {
            color: #0ea5e9; width: 16px; margin-top: 2px; text-align: center;
        }
        
        .card-info {
            flex: 1; overflow-y: auto; padding: 20px;
            display: flex; flex-direction: column; gap: 16px;
            scrollbar-width: none; background: #f8fafc;
        }
        .card-info::-webkit-scrollbar { display: none; }
        
        .info-section {
            background: #fff; padding: 16px 18px; border-radius: 16px; border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .section-title {
            font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;
        }
        .section-content {
            font-size: 14px; color: #334155; line-height: 1.6; font-weight: 500;
        }
        .social-links {
            display: flex; flex-direction: column; gap: 8px;
        }
        .social-item {
            display: flex; align-items: center; gap: 12px; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 16px; border-radius: 12px; transition: 0.2s; border: 1px solid transparent;
        }
        .social-ig { background: #fdf4ff; color: #d946ef; border-color: #fae8ff; }
        .social-ig:hover { background: #fae8ff; }
        .social-tiktok { background: #f1f5f9; color: #0f172a; border-color: #e2e8f0; }
        .social-tiktok:hover { background: #e2e8f0; }
        .social-wa { background: #f0fdf4; color: #16a34a; border-color: #dcfce7; }
        .social-wa:hover { background: #dcfce7; }
        .info-row { display: flex; flex-direction: column; gap: 2px; }
"""
content = content[:css_start] + css_new + content[css_end:]

# JS Patch
js_start = content.find("            let rowsHtml = '';")
js_end = content.find("            track.appendChild(card);", js_start)
js_new = """            const mainName = p.panggilan ? p.panggilan : (p.nama || 'Tanpa Nama');
            const fullNameSub = p.nama && p.nama !== mainName ? `<p class="full-name">${p.nama}</p>` : (p.nama ? `<p class="full-name">${p.nama}</p>` : '');

            // Meta Info (Kelas & Alamat)
            let metaHtml = `<div class="header-meta">
                <div class="header-meta-item"><i class="fas fa-users"></i> <span>${p.kelas || '-'}</span></div>
                ${p.alamat ? `<div class="header-meta-item"><i class="fas fa-map-marker-alt"></i> <span>${p.alamat}</span></div>` : ''}
            </div>`;

            // Tentang Saya
            const karakter = p.karakter || '-';
            const aktivitas = p.aktivitas || '-';
            
            // Like
            const hobi = p.hobi || '-';
            const belajar = p.mempelajari || '-';
            const liburan = p.liburan || '-';

            // Dislike
            const tidakDisukai = p.tidakDisukai || '-';

            // Extra Fields Loop (if any)
            let extraHtml = '';
            if (p.extraFields && p.extraFields.length > 0) {
                p.extraFields.forEach(ef => {
                    const lLower = ef.label.toLowerCase().trim();
                    if (lLower === 'nama' || lLower === 'nama lengkap' || lLower === 'nama (standar)' ||
                        lLower.includes('kelas') || lLower.includes('kelompok') || lLower.includes('grup') ||
                        lLower.includes('instagram') || lLower === 'ig' || lLower.includes('tiktok') ||
                        lLower.includes('cap waktu') || lLower.includes('timestamp') ||
                        lLower.includes('foto') || lLower.includes('upload') ||
                        lLower.includes('sapaan') || lLower.includes('panggilan') ||
                        lLower.includes('hp') || lLower.includes('wa') || lLower.includes('telepon') ||
                        lLower.includes('ortu') || lLower.includes('ayah') || lLower.includes('ibu') ||
                        (lLower.includes('lahir') && p.tanggalLahir) || 
                        (lLower.includes('alamat') && p.alamat) ||
                        (lLower.includes('hobi') && p.hobi) ||
                        (lLower.includes('aktivitas') && p.aktivitas) ||
                        (lLower.includes('tidak disukai') && p.tidakDisukai) ||
                        (lLower.includes('karakter') && p.karakter) ||
                        (lLower.includes('liburan') && p.liburan) ||
                        (lLower.includes('mempelajari') && p.mempelajari)) {
                        return;
                    }
                    extraHtml += `<div class="header-meta-item" style="margin-bottom:6px;"><i class="fas fa-info-circle"></i> <div><strong>${ef.label}:</strong><br>${ef.value || '-'}</div></div>`;
                });
            }

            // TikTok Extraction from extraFields
            let tiktokUrl = '';
            let tiktokUser = '';
            if (p.extraFields) {
                const tiktokField = p.extraFields.find(ef => ef.label.toLowerCase().includes('tiktok'));
                if (tiktokField && tiktokField.value) {
                    tiktokUser = tiktokField.value;
                    tiktokUrl = tiktokUser.includes('http') ? tiktokUser : `https://tiktok.com/@${tiktokUser.replace('@','')}`;
                }
            }

            const card = document.createElement('div');
            card.className = 'profile-card';
            card.innerHTML = `
                <div class="card-photo-wrap">
                    ${imgHtml}
                    <button class="share-icon-btn" title="Bagikan Profil" onclick="shareProfile('${(p.nama||'').replace(/'/g, "\\\\'")}', '${(p.kelas||'').replace(/'/g, "\\\\'")}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <div class="counter-badge">${i+1} / ${displayedProfiles.length}</div>
                </div>
                <div class="card-header-info">
                    <h2>${mainName}</h2>
                    ${fullNameSub}
                    ${metaHtml}
                </div>
                <div class="card-info">
                    <div class="info-section">
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
                        <div class="social-links">
                            ${p.instagram ? `<a href="https://instagram.com/${p.instagram.replace('@','')}" target="_blank" class="social-item social-ig"><i class="fab fa-instagram"></i> ${p.instagram}</a>` : ''}
                            ${tiktokUser ? `<a href="${tiktokUrl}" target="_blank" class="social-item social-tiktok"><i class="fab fa-tiktok"></i> ${tiktokUser}</a>` : ''}
                            ${p.noHp ? `<a href="https://wa.me/${String(p.noHp).replace(/^0/, '62').replace(/[^0-9]/g, '')}" target="_blank" class="social-item social-wa"><i class="fab fa-whatsapp"></i> Chat WhatsApp</a>` : ''}
                        </div>
                    </div>
                </div>`;
"""
content = content[:js_start] + js_new + content[js_end:]

with open("mentor/buku-saku.html", "w") as f:
    f.write(content)
