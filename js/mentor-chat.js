document.addEventListener('DOMContentLoaded', () => {
    // 1. Cek Autentikasi Login (Dinonaktifkan sementara untuk testing UI)
    // const isLoggedIn = localStorage.getItem('mentor_logged_in');
    // if (!isLoggedIn) {
    //     window.location.href = 'login.html';
    //     return;
    // }

    // 2. Set Data Profil UI
    const mentorName = localStorage.getItem('mentor_name') || 'Mentor';
    const mentorEmail = localStorage.getItem('mentor_email') || '';
    
    document.getElementById('display-name').textContent = mentorName;
    document.getElementById('welcome-name').textContent = mentorName;
    document.getElementById('avatar-initial').textContent = mentorName.charAt(0).toUpperCase();

    // Set waktu chat pertama
    const now = new Date();
    document.getElementById('welcome-time').textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 3. Konfigurasi API
    // Membaca dari local storage admin, atau menggunakan fallback API Key yang sudah di-hardcode
    const GEMINI_API_KEY = localStorage.getItem('gemini_api_key') || 'AIzaSyBBC-Fkhpo7HLQa0DhlHoj1UHWoNj4sLyk';
    const APPS_SCRIPT_URL = localStorage.getItem('apps_script_url') || 'https://script.google.com/macros/s/AKfycbxyEpzGEcscWZXzmVbbjh5prqe_ouqgLENexaDdVgb-vE8a3DZ6r3GkG84iyy8eBICmWw/exec';

    // Elemen Chat
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing-indicator');

    // Logout
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('mentor_logged_in');
        window.location.href = 'login.html';
    });

    // Event kirim pesan
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender === 'ai' ? 'msg-ai' : 'msg-mentor'}`;
        
        const time = new Date();
        const timeString = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        
        // Gunakan library marked untuk merender Markdown dari AI
        if (sender === 'ai') {
            msgDiv.innerHTML = marked.parse(text) + `<span class="msg-time">${timeString}</span>`;
        } else {
            msgDiv.innerHTML = text + `<span class="msg-time">${timeString}</span>`;
        }
        
        // Sisipkan sebelum typing indicator
        chatBox.insertBefore(msgDiv, typingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // 1. Tampilkan pesan user
        appendMessage(text, 'mentor');
        chatInput.value = '';
        sendBtn.disabled = true;
        
        // Tampilkan typing
        typingIndicator.classList.add('active');
        chatBox.scrollTop = chatBox.scrollHeight;

        // Cek API Key
        if (!GEMINI_API_KEY || !APPS_SCRIPT_URL) {
            typingIndicator.classList.remove('active');
            appendMessage("⚠️ **Sistem Belum Siap!**\nAPI Key Gemini atau URL Apps Script belum dikonfigurasi oleh Admin. Silakan hubungi Admin.", 'ai');
            sendBtn.disabled = false;
            return;
        }

        try {
            // 2. Panggil API Gemini
            const aiResponse = await callGeminiAPI(text);
            
            // 3. Ekstrak JSON dari respons Gemini (karena kita akan instruksikan AI membalas dalam format khusus)
            // Format yang kita harapkan dari AI:
            // {"reply": "Baik kak...", "data": [{"nama": "Budi", "status": "Hadir"}]}
            let parsedData = null;
            try {
                // Cari block json dalam teks
                const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/{[\s\S]*}/);
                if (jsonMatch) {
                    parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                }
            } catch (e) {
                console.error("Gagal parsing JSON dari AI", e);
            }

            if (parsedData && parsedData.data && parsedData.data.length > 0) {
                // 4. Kirim Data ke Google Apps Script Spreadsheet
                appendMessage(parsedData.reply || "Memproses data ke server...", 'ai');
                await saveToSpreadsheet(parsedData.data);
                appendMessage("✅ Data berhasil disimpan ke Spreadsheet!", 'ai');
            } else {
                // AI hanya membalas chat biasa tanpa data presensi
                appendMessage(parsedData ? parsedData.reply : aiResponse, 'ai');
            }

        } catch (error) {
            appendMessage("❌ **Sistem Error:** " + error.message, 'ai');
            console.error(error);
        }

        typingIndicator.classList.remove('active');
        sendBtn.disabled = false;
        chatInput.focus();
    }

    async function callGeminiAPI(userMessage) {
        // Instruksi sistem (System Prompt) agar AI tahu tugasnya
        const systemInstruction = `
Kamu adalah Asisten Presensi bernama Sky. Tugasmu adalah membaca laporan kehadiran dari mentor, lalu mengekstrak datanya ke format JSON.
Aturan:
1. Ekstrak HANYA nama siswa yang HADIR (tidak ada izin, sakit, atau alpa).
2. Kamu WAJIB mengembalikan balasan dalam format JSON murni seperti ini:
{
  "reply": "Kalimat balasan ramah ke mentor (Maksimal 2 kalimat).",
  "data": [
    {"nama": "Nama Siswa 1", "status": "Hadir"},
    {"nama": "Nama Siswa 2", "status": "Hadir"}
  ]
}
3. Jika pesan mentor sekadar menyapa dan tidak berisi laporan presensi, balas dengan JSON:
{"reply": "Balasan ramah...", "data": []}
`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const payload = {
            contents: [{
                parts: [{ text: userMessage }]
            }],
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            },
            generationConfig: {
                temperature: 0.1 // Rendah agar konsisten menghasilkan JSON
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error.message);
        
        return result.candidates[0].content.parts[0].text;
    }

    async function saveToSpreadsheet(attendanceData) {
        const payload = {
            mentorName: mentorName,
            mentorEmail: mentorEmail,
            attendance: attendanceData
        };

        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Apps script butuh ini jika dipanggil dari frontend langsung
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        // Note: dengan no-cors, fetch tidak me-return body response, tapi proses di server tetap jalan.
    }
});
