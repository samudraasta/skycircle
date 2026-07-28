document.addEventListener('DOMContentLoaded', () => {
    // 1. Cek Autentikasi Login (Diaktifkan kembali untuk rilis ke teman-teman)
    const isLoggedIn = localStorage.getItem('mentor_logged_in');
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Set Data Profil UI
    const mentorName = localStorage.getItem('mentor_name') || 'Mentor';
    const mentorEmail = localStorage.getItem('mentor_email') || '';
    
    document.getElementById('display-name').textContent = 'Kak Ukhti';
    document.getElementById('welcome-name').textContent = mentorName;
    document.getElementById('avatar-initial').textContent = 'U';

    // Set waktu chat pertama
    const now = new Date();
    document.getElementById('welcome-time').textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 3. Konfigurasi API
    // Membaca dari local storage admin, atau menggunakan fallback API Key yang sudah di-hardcode
    const GEMINI_API_KEY = localStorage.getItem('gemini_api_key') || 'AQ.Ab8RN6Iypv2DzqD7aBnvFXfW9blhkPW7WmqLZA3bEQ3Xf9CDeA';
    const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxBNmpogyqo1iEYy3j6mZld6lmc6PPb5sde67cjQKsKEfinbIPojU2WRN0_Mf4Bhd8rQ/exec';

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
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Fungsi untuk memuat history chat sebelumnya dari Cloud Google Sheets
    async function loadChatHistory() {
        if (!APPS_SCRIPT_URL || !mentorEmail) return;

        try {
            const payload = {
                action: "get_history",
                mentorEmail: mentorEmail
            };

            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (result.status === "success" && result.history) {
                // Tampilkan pesan history
                result.history.forEach(msg => {
                    appendMessage(msg.text, msg.sender);
                });
            }
        } catch(e) {
            console.error("Gagal membaca history dari Cloud", e);
        }
    }

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

    // Panggil load history saat pertama kali buka
    loadChatHistory();

    async function sendMessage() {
        const text = chatInput.innerText.trim();
        if (!text) return;

        // 1. Tampilkan pesan user
        appendMessage(text, 'mentor');
        chatInput.innerText = '';
        sendBtn.disabled = true;
        
        // Tampilkan typing
        typingIndicator.classList.add('active');
        chatBox.scrollTop = chatBox.scrollHeight;

        if (!APPS_SCRIPT_URL) {
            typingIndicator.classList.remove('active');
            appendMessage("⚠️ **Sistem Belum Siap!** URL Apps Script belum dikonfigurasi.", 'ai');
            sendBtn.disabled = false;
            return;
        }

        try {
            // 2. Panggil Apps Script (Backend) untuk ngobrol dengan Gemini
            const payload = {
                action: "chat",
                message: text,
                mentorName: mentorName,
                mentorEmail: mentorEmail
            };

            const response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                // Mode CORS tidak dipakai no-cors agar kita bisa membaca response-nya
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (result.status === "success") {
                // 3. Tampilkan balasan AI
                appendMessage(result.reply, 'ai');
                
                // Jika AI mendeteksi data (ekstraksi), kita bisa tampilkan log
                if (result.data) {
                    console.log("Data terekstrak dari AI:", result.data);
                    // Nanti kita bisa panggil fungsi validasi UI di sini
                }
            } else {
                appendMessage("❌ **Sistem Error:** " + result.message, 'ai');
            }

        } catch (error) {
            appendMessage("❌ **Sistem Error:** Gagal menghubungi server. " + error.message, 'ai');
            console.error(error);
        }

        typingIndicator.classList.remove('active');
        sendBtn.disabled = false;
        chatInput.focus();
    }
});
