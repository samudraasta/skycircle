    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxBNmpogyqo1iEYy3j6mZld6lmc6PPb5sde67cjQKsKEfinbIPojU2WRN0_Mf4Bhd8rQ/exec';

    let screen = 'gradePicker';
    let selectedGrade = 'X';
    let displayedProfiles = [];
    let currentIndex = 0;

    let touchStartX = 0;
    document.getElementById('sliderArea').addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    document.getElementById('sliderArea').addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? slideNext() : slidePrev();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') slideNext();
        if (e.key === 'ArrowLeft') slidePrev();
    });

    function showScreen(name) {
        screen = name;
        document.getElementById('screenGradePicker').style.display = name === 'gradePicker' ? 'flex' : 'none';
        document.getElementById('screenPicker').style.display      = name === 'picker'      ? 'flex' : 'none';
        document.getElementById('screenLoading').style.display     = name === 'loading'     ? 'flex' : 'none';
        document.getElementById('screenSlider').style.display      = name === 'slider'      ? 'flex' : 'none';
        if (name === 'picker') document.getElementById('screenPicker').style.flexDirection = 'column';
        if (name === 'slider') document.getElementById('screenSlider').style.flexDirection = 'column';
        if (name === 'loading') document.getElementById('screenLoading').style.flexDirection = 'column';
    }

    function selectGrade(grade) {
        selectedGrade = grade;
        document.getElementById('headerTitle').textContent = `Buku Saku - Kelas ${grade}`;
        document.getElementById('headerSub').textContent = 'Pilih sub-kelas';

        const grid = document.getElementById('classButtonsGrid');
        grid.innerHTML = '';
        for (let i = 1; i <= 12; i++) {
            grid.innerHTML += `
                <button class="group-btn gc" onclick="selectGroup('GC ${grade}-${i}')">${grade} ${i}</button>
                <button class="group-btn bc" onclick="selectGroup('BC ${grade}-${i}')">${grade} ${i}</button>
            `;
        }
        showScreen('picker');
    }

    function goBack() {
        if (screen === 'gradePicker') { window.location.href = 'presensi.html'; return; }
        if (screen === 'picker') { 
            showScreen('gradePicker'); 
            document.getElementById('headerTitle').textContent = 'Buku Saku Mentee'; 
            document.getElementById('headerSub').textContent = 'Pilih tingkat kelas'; 
            return; 
        }
        showScreen('picker');
        document.getElementById('headerTitle').textContent = `Buku Saku - Kelas ${selectedGrade}`;
        document.getElementById('headerSub').textContent = 'Pilih sub-kelas';
    }

    async function selectGroup(groupName) {
        document.getElementById('headerTitle').textContent = groupName;
        document.getElementById('headerSub').textContent = 'Memuat...';
        document.getElementById('screenLoading').innerHTML = `
            <div class="spinner-ring"></div>
            <p>Memuat profil <strong>${groupName}</strong>...</p>
        `;
        showScreen('loading');

        try {
            const res = await fetch(APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'get_profiles' })
            });
            const data = await res.json();

            if (data.status === 'success') {
                const isGC = groupName.toUpperCase().includes('GC');
                const isBC = groupName.toUpperCase().includes('BC');
                const isCirclePlus = groupName.toUpperCase().includes('CIRCLE+');

                // Ekstrak angka kelas (misal "GC X-1" -> "1")
                const numMatch = groupName.match(/\d+/);
                const targetNum = numMatch ? numMatch[0] : '';

                displayedProfiles = data.profiles.filter(p => {
                    const pKelas = (p.kelas || '').trim().toUpperCase();
                    const pExtraGender = (p.extraFields || []).find(ef => ef.label.toLowerCase() === 'gender');
                    const genderVal = pExtraGender ? String(pExtraGender.value || '').toUpperCase() : '';

                    if (isCirclePlus) {
                        if (!pKelas.includes('CIRCLE+')) return false;
                        if (isGC && (genderVal.includes('GIRL') || genderVal === 'P' || pKelas.includes('GC'))) return true;
                        if (isBC && (genderVal.includes('BOY') || genderVal === 'L' || pKelas.includes('BC'))) return true;
                        return true;
                    }

                    // Cocokkan persis (e.g. "GC X-1 34" atau "GC X-1")
                    if (pKelas.includes(groupName.toUpperCase())) return true;

                    // Match berdasarkan angka kelas & Gender (GC=Girls, BC=Boys)
                    if (targetNum) {
                        const pParts = pKelas.split(/[\s-]+/);
                        const pLastNum = pParts[pParts.length - 1];
                        if (pLastNum === targetNum) {
                            if (isGC && (pKelas.includes('GC') || genderVal.includes('GIRL') || genderVal === 'P')) return true;
                            if (isBC && (pKelas.includes('BC') || genderVal.includes('BOY') || genderVal === 'L')) return true;
                        }
                    }
                    return false;
                });

                if (displayedProfiles.length === 0) {
                    document.getElementById('headerSub').textContent = 'Belum ada data';
                    document.getElementById('screenLoading').innerHTML = `
                        <div class="empty-screen">
                            <i class="fas fa-user-slash"></i>
                            <p>Belum ada mentee di <strong style="color:#075e54">${titleText}</strong> yang mengisi profil.</p>
                            <button class="back-btn" onclick="goBack()"><i class="fas fa-arrow-left"></i> Kembali ke Menu</button>
                        </div>`;
                    document.getElementById('screenLoading').style.display = 'flex';
                    return;
                }

                document.getElementById('headerSub').textContent = `${displayedProfiles.length} mentee`;
                renderSlider();
                showScreen('slider');

                // Jika dibuka via link share dengan parameter nama mentee, lompat langsung ke slidenya
                if (autoTargetNama) {
                    const targetLower = autoTargetNama.trim().toLowerCase();
                    const idx = displayedProfiles.findIndex(p => (p.nama || '').trim().toLowerCase() === targetLower);
                    if (idx !== -1) {
                        goToSlide(idx);
                    }
                    autoTargetNama = null;
                }
            } else {
                document.getElementById('screenLoading').innerHTML = `<div class="empty-screen"><i class="fas fa-exclamation-circle"></i><p>Gagal memuat data.</p><button class="back-btn" onclick="goBack()">Kembali</button></div>`;
                document.getElementById('screenLoading').style.display = 'flex';
            }
        } catch(e) {
            document.getElementById('screenLoading').innerHTML = `<div class="empty-screen"><i class="fas fa-wifi"></i><p>Koneksi terputus.</p><button class="back-btn" onclick="goBack()">Coba Lagi</button></div>`;
            document.getElementById('screenLoading').style.display = 'flex';
        }
    }

    function renderSlider() {
        console.log('=== DATA PROFIL ===', displayedProfiles);
        
        const track = document.getElementById('cardsTrack');
        const dotBar = document.getElementById('dotBar');
        track.innerHTML = ''; dotBar.innerHTML = '';

        displayedProfiles.forEach((p, i) => {
            let finalFileId = '';
            if (p.fotoUrl) {
                const matchFileD = p.fotoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                const matchId = p.fotoUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                if (matchFileD && matchFileD[1]) finalFileId = matchFileD[1];
                else if (matchId && matchId[1]) finalFileId = matchId[1];
            }
            
            const directUrl = finalFileId ? `https://lh3.googleusercontent.com/d/${finalFileId}` : '';
            
            const imgHtml = finalFileId
                ? `<img src="${directUrl}" data-fileid="${finalFileId}" id="img-${finalFileId}" alt="foto" onerror="handleImgError(this, '${finalFileId}')">
                   <div class="photo-loader" id="loader-${finalFileId}" style="display:none;"><i class="fas fa-spinner fa-spin"></i></div>
                   <div class="no-photo" id="fallback-${finalFileId}" style="display:none;"><i class="fas fa-user"></i></div>`
                : `<div class="no-photo"><i class="fas fa-user"></i></div>`;

            const igHtml = p.instagram
                ? `<a href="https://instagram.com/${p.instagram.replace('@','')}" target="_blank" class="info-ig"><i class="fab fa-instagram"></i> ${p.instagram}</a>` : '';

            const mainName = p.panggilan ? p.panggilan : (p.nama || 'Tanpa Nama');
            const fullNameSub = p.nama && p.nama !== mainName ? `<p class="full-name">${p.nama}</p>` : '';
            
            // Meta Info (Alamat saja)
            let metaHtml = '';
            // Pastikan p.alamat bukan sekadar pengulangan dari p.nama (menghindari bug backend GAS lama)
            if (p.alamat && p.alamat.trim().toLowerCase() !== (p.nama || '').trim().toLowerCase()) {
                metaHtml = `<div class="header-meta">
                    <div class="header-meta-item"><i class="fas fa-map-marker-alt"></i> <span>${p.alamat}</span></div>
                </div>`;
            }

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
                    <button class="share-icon-btn" title="Bagikan Profil" onclick="shareProfile('${(p.nama||'').replace(/'/g, "\\'")}', '${(p.kelas||'').replace(/'/g, "\\'")}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <div class="counter-badge">${i+1} / ${displayedProfiles.length}</div>
                </div>
                <div class="card-header-info">
                    <h2>${mainName} ${p.kelas ? `<span style="font-weight: 400; font-size: inherit; color: #64748b; margin-left: 4px;">(${p.kelas})</span>` : ''}</h2>
                    ${fullNameSub}
                    ${metaHtml}
                </div>
                <div class="card-info">
                    <div class="info-group">
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
                            <div class="social-links">
                                ${p.instagram ? `<a href="https://instagram.com/${p.instagram.replace('@','')}" target="_blank" class="social-item social-ig"><i class="fab fa-instagram"></i> ${p.instagram}</a>` : ''}
                                ${tiktokUser ? `<a href="${tiktokUrl}" target="_blank" class="social-item social-tiktok"><i class="fab fa-tiktok"></i> ${tiktokUser}</a>` : ''}
                                ${p.noHp ? `<a href="https://wa.me/${String(p.noHp).replace(/^0/, '62').replace(/[^0-9]/g, '')}" target="_blank" class="social-item social-wa"><i class="fab fa-whatsapp"></i> Chat WhatsApp</a>` : ''}
                            </div>
                        </div>
                    </div>
                </div>`;
            track.appendChild(card);

            if (displayedProfiles.length > 1) {
                const dot = document.createElement('div');
                dot.className = 'dot' + (i===0?' active':'');
                dot.onclick = () => goToSlide(i);
                dotBar.appendChild(dot);
            }
        });
        goToSlide(0);
    }

    function goToSlide(i) {
        currentIndex = i;
        document.getElementById('cardsTrack').style.transform = `translateX(-${i*100}%)`;
        document.querySelectorAll('.dot').forEach((d,j) => d.classList.toggle('active', j===i));
        document.getElementById('btnPrev').disabled = i === 0;
        document.getElementById('btnNext').disabled = i === displayedProfiles.length - 1;
    }
    function slidePrev() { if (currentIndex > 0) goToSlide(currentIndex - 1); }
    function slideNext() { if (currentIndex < displayedProfiles.length - 1) goToSlide(currentIndex + 1); }

    function handleImgError(img, fileId) {
        img.style.display = 'none';
        const loader = document.getElementById('loader-' + fileId);
        const fallback = document.getElementById('fallback-' + fileId);
        if (loader) loader.style.display = 'flex';

        fetch(APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'get_image', fileId: fileId })
        })
        .then(res => res.json())
        .then(res => {
            if (loader) loader.style.display = 'none';
            if (res.status === 'success' && res.dataUri) {
                img.onerror = null; // Mencegah infinite loop error
                img.src = res.dataUri;
                img.style.display = 'block';
            } else {
                if (fallback) fallback.style.display = 'flex';
            }
        })
        .catch(err => {
            console.error("Gagal load foto via Base64:", fileId, err);
            if (loader) loader.style.display = 'none';
            if (fallback) fallback.style.display = 'flex';
        });
    }

    // --- STRATEGI SHARE PROFIL & DEEP LINKING ---
    let autoTargetNama = null;

    function shareProfile(nama, kelas) {
        const url = new URL(window.location.href);
        url.searchParams.set('grup', kelas);
        url.searchParams.set('nama', nama);
        const shareUrl = url.toString();

        const shareData = {
            title: `Profil Mentee: ${nama}`,
            text: `Lihat profil mentee ${nama} (${kelas}) di Buku Saku Sky Circle:`,
            url: shareUrl
        };

        if (navigator.share) {
            navigator.share(shareData).catch(err => {
                if (err.name !== 'AbortError') {
                    copyToClipboard(shareUrl, nama);
                }
            });
        } else {
            copyToClipboard(shareUrl, nama);
        }
    }

    function copyToClipboard(text, nama) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showToast(`Link profil ${nama} berhasil disalin!`);
            }).catch(() => {
                fallbackCopy(text, nama);
            });
        } else {
            fallbackCopy(text, nama);
        }
    }

    function fallbackCopy(text, nama) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast(`Link profil ${nama} berhasil disalin!`);
        } catch (err) {
            showToast(`Gagal menyalin link.`);
        }
        document.body.removeChild(textArea);
    }

    function showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2600);
    }

    function checkQueryParamsOnLoad() {
        const params = new URLSearchParams(window.location.search);
        const grupParam = params.get('grup');
        const namaParam = params.get('nama');

        if (grupParam) {
            autoTargetNama = namaParam;
            selectGroup(grupParam);
        } else {
            showScreen('gradePicker');
        }
    }

    checkQueryParamsOnLoad();
