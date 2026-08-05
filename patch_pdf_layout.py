import re

with open("mentor/buku-saku.html", "r") as f:
    html = f.read()

# 1. Update CSS for ID Card
css_old = r"        /\* ID Card Template Styling \*/.*?        .idc-value \{\s*font-size: 22px; font-weight: 800;\s*text-align: right;\s*text-transform: uppercase;\s*\}"
css_new = """        /* ID Card Template Styling */
        #idCardContainer {
            position: absolute; top: -9999px; left: -9999px;
            width: 400px; height: 600px;
            background: #fff; z-index: -100;
        }
        #idCard {
            width: 400px; height: 620px;
            background-color: #fff;
            font-family: 'Inter', sans-serif;
            position: relative;
            box-sizing: border-box;
            color: #1e293b;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        .idc-header {
            height: 120px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding-left: 20px;
        }
        .idc-header-text { text-align: left; }
        .idc-header-text h1 { margin: 0; font-size: 28px; font-family: 'Georgia', serif; font-weight: normal; letter-spacing: 3px; }
        .idc-header-text p { margin: 2px 0 0; font-size: 15px; opacity: 0.9; font-weight: 400; font-family: 'Georgia', serif; letter-spacing: 1px;}
        
        .idc-body {
            position: relative;
            height: 500px;
            padding: 30px;
            display: flex; flex-direction: column; align-items: center;
        }
        .idc-vertical-text {
            position: absolute;
            left: -170px; top: 250px;
            transform: rotate(-90deg);
            font-family: 'Georgia', serif;
            font-size: 15px; font-weight: bold; color: #94a3b8;
            letter-spacing: 5px; text-transform: uppercase;
            width: 400px; text-align: center;
        }
        .idc-photo-container {
            width: 200px; height: 260px;
            border: 2px solid;
            padding: 4px; /* Creates the double border effect */
            border-radius: 6px;
            background: #fff;
            margin-bottom: 40px;
            position: relative; z-index: 10;
        }
        .idc-photo-container .idc-photo-inner {
            width: 100%; height: 100%;
            border: 1px solid #e2e8f0;
            overflow: hidden;
            border-radius: 2px;
            display: flex; justify-content: center; align-items: center;
            background: #f1f5f9;
        }
        .idc-photo-container img {
            width: 100%; height: 100%; object-fit: cover;
        }
        .idc-info-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 15px;
            position: relative; z-index: 10;
        }
        .idc-info-table td {
            vertical-align: bottom;
            border-bottom: 2px dotted #94a3b8;
            padding-bottom: 4px;
        }
        .idc-label {
            font-family: 'Georgia', serif;
            font-size: 12px; font-weight: bold; color: #64748b;
            text-transform: uppercase; letter-spacing: 1.5px;
            width: 40%;
        }
        .idc-value {
            font-size: 20px; font-weight: 800;
            text-align: right;
            text-transform: uppercase;
        }"""
html = re.sub(css_old, css_new, html, flags=re.DOTALL)


# 2. Update shareProfile function structure
js_old = r"        const toast = document\.getElementById\('toast'\);.*?        const element = document\.getElementById\('idCard'\);"

js_new = """        const toast = document.getElementById('toast');
        toast.textContent = 'Mempersiapkan ID Card...';
        toast.classList.add('show');
        
        let finalImgSrc = 'https://ui-avatars.com/api/?name='+encodeURIComponent(mainName)+'&background=random&color=fff&size=512';
        
        if (p.fotoId && p.fotoId !== '-') {
            // Gunakan wsrv.nl sebagai proxy CORS yang reliable
            finalImgSrc = `https://wsrv.nl/?url=https://lh3.googleusercontent.com/d/${p.fotoId}&w=400&h=520&fit=cover`;
        }

        const container = document.getElementById('idCardContainer');
        container.innerHTML = `
        <div id="idCard">
            <div class="idc-header" style="background-color: ${themeColor};">
                <div style="width: 55px; height: 55px; border-radius: 50%; border: 1.5px solid white; display:flex; justify-content:center; align-items:center; overflow:hidden; margin-right: 15px; margin-left: 5px; flex-shrink: 0;">
                    <img src="https://skycircle.id/images/skycircle_logo.jpg" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
                <div class="idc-header-text">
                    <h1>SKY CIRCLE</h1>
                    <p>Mentee Identity Card</p>
                </div>
            </div>
            <div class="idc-body">
                <div class="idc-vertical-text">SKY CIRCLE IDENTITY CARD</div>
                <div class="idc-photo-container" style="border-color: ${themeColor}">
                    <div class="idc-photo-inner">
                        <img src="${finalImgSrc}" crossorigin="anonymous" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name='+encodeURIComponent('${mainName.replace("'", "")}')+'&background=random';" />
                    </div>
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
                        <td class="idc-label">CLASS</td>
                        <td class="idc-value" style="color: ${themeColor}">${teamName}</td>
                    </tr>
                </table>
            </div>
        </div>
        `;
        
        // Timeout lebih lama untuk memastikan gambar proxy (wsrv) ke-load
        setTimeout(() => {
            const element = document.getElementById('idCard');"""
html = re.sub(js_old, js_new, html, flags=re.DOTALL)

with open("mentor/buku-saku.html", "w") as f:
    f.write(html)
