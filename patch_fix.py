import re

with open("mentor/buku-saku.html", "r") as f:
    html = f.read()

# Fix 1: Adjust CSS for idc-vertical-text to prevent overlap
css_old = r"left: -160px; top: 250px;\s*transform: rotate\(-90deg\);\s*font-size: 16px;\s*font-weight: 800; color: #cbd5e1;\s*letter-spacing: 4px;"
css_new = "left: -180px; top: 250px;\n            transform: rotate(-90deg);\n            font-size: 14px; font-weight: 800; color: #cbd5e1;\n            letter-spacing: 5px;"
html = re.sub(css_old, css_new, html)

# Fix 2: Gender Color and Date Format in shareProfile
sp_old = r"const isBoy = p\.kelas && p\.kelas\.toUpperCase\(\)\.includes\('BC'\);\s*const themeColor = isBoy \? '#1e40af' : '#be185d';"
sp_new = """let themeColor = '#1e40af'; // Default Boy (Blue)
        if (p.extraFields) {
            const genderField = p.extraFields.find(ef => ef.label.toLowerCase().includes('kelamin') || ef.label.toLowerCase().includes('gender'));
            if (genderField) {
                const g = genderField.value.toLowerCase();
                if (g === 'p' || g.includes('perempuan') || g.includes('cewe') || g.includes('girl')) {
                    themeColor = '#be185d'; // Girl (Pink)
                }
            }
        }
        if (p.kelas && p.kelas.toUpperCase().includes('GC')) {
            themeColor = '#be185d';
        }"""
html = html.replace(sp_old, sp_new)

date_old = r"const dob = p\.tanggalLahir \|\| '-';"
date_new = """let dob = p.tanggalLahir || '-';
        if (dob !== '-') {
            const dObj = new Date(dob);
            if (!isNaN(dObj.getTime())) {
                dob = `${String(dObj.getDate()).padStart(2, '0')} / ${String(dObj.getMonth()+1).padStart(2, '0')} / ${dObj.getFullYear()}`;
            }
        }"""
html = html.replace(date_old, date_new)

# Fix 3: Image fetch logic (parse JSON instead of text)
img_fetch_old = r"""fetch\(APPS_SCRIPT_URL, {\s*method: 'POST',\s*headers: { 'Content-Type': 'text/plain;charset=utf-8' },\s*body: JSON\.stringify\({ action: 'get_image', fileId: p\.fotoId }\)\s*}\)\s*\.then\(res => res\.text\(\)\)\s*\.then\(base64 => {\s*if \(base64 && base64\.startsWith\('data:image'\)\) {\s*renderAndDownloadCard\(base64\);\s*} else {\s*renderAndDownloadCard\('https://ui-avatars\.com/api/\?name='\+encodeURIComponent\(mainName\)\);\s*}\s*}\)"""

img_fetch_new = """fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'get_image', fileId: p.fotoId })
            })
            .then(res => res.json())
            .then(res => {
                if (res.status === 'success' && res.dataUri) {
                    renderAndDownloadCard(res.dataUri);
                } else {
                    renderAndDownloadCard('https://ui-avatars.com/api/?name='+encodeURIComponent(mainName));
                }
            })"""
html = re.sub(img_fetch_old, img_fetch_new, html)

with open("mentor/buku-saku.html", "w") as f:
    f.write(html)
