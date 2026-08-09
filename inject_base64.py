import base64
import re

with open("images/idcard_bg_boy.png", "rb") as f:
    boy_b64 = base64.b64encode(f.read()).decode("utf-8")
    
with open("images/idcard_bg_girl.png", "rb") as f:
    girl_b64 = base64.b64encode(f.read()).decode("utf-8")

with open("mentor/buku-saku.html", "r") as f:
    html = f.read()

# Replace the bgImageUrl logic with base64 strings
js_old = r"        // Gunakan absolute URL untuk menghindari masalah CORS di html2canvas.*?        function renderHTML\(safeImgSrc, safeBgSrc\) \{"

js_new = f"""        const base64BgBoy = "data:image/png;base64,{boy_b64}";
        const base64BgGirl = "data:image/png;base64,{girl_b64}";
        const bgImageUrl = (themeColor === '#be185d') ? base64BgGirl : base64BgBoy;

        const container = document.getElementById('idCardContainer');
        
        let safeProfileSrc = 'https://ui-avatars.com/api/?name='+encodeURIComponent(mainName)+'&background=random&color=fff&size=512';

        function renderHTML(safeImgSrc, safeBgSrc) {{"""

html = re.sub(js_old, js_new, html, flags=re.DOTALL)

# Revert the image fetching logic to use APPS_SCRIPT_URL for base64
js_fetch_old = r"        let finalImgSrc = 'https://ui-avatars\.com/api/\?name='\+encodeURIComponent\(mainName\)\+'&background=random&color=fff&size=512';.*?        const base64BgBoy"

js_fetch_new = """        const toast = document.getElementById('toast');
        toast.textContent = 'Mempersiapkan ID Card...';
        toast.classList.add('show');
        
        const base64BgBoy"""

html = re.sub(r"        let finalImgSrc = 'https://ui-avatars.*?        const base64BgBoy", js_fetch_new, html, flags=re.DOTALL)

# Add the fetch logic back
fetch_logic = """
        if (p.fotoId && p.fotoId !== '-') {
            fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'get_image', fileId: p.fotoId })
            })
            .then(res => res.json())
            .then(res => {
                if (res.status === 'success' && res.dataUri) {
                    renderHTML(res.dataUri, bgImageUrl);
                } else {
                    renderHTML(safeProfileSrc, bgImageUrl);
                }
            })
            .catch(err => {
                console.error("Gagal load base64 foto:", err);
                renderHTML(safeProfileSrc, bgImageUrl);
            });
        } else {
            renderHTML(safeProfileSrc, bgImageUrl);
        }
    }

    function showToast(msg) {"""

# Replace the end of shareProfile
end_old = r"        \}\n    \}\n\n    function showToast\(msg\) \{"
html = re.sub(end_old, fetch_logic, html)

with open("mentor/buku-saku.html", "w") as f:
    f.write(html)
