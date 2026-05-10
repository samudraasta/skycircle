// Supabase Configuration (Replace with your actual keys from Supabase)
const SUPABASE_URL = 'https://YOUR_PROJECT_URL.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';
let supabase = null;

if (typeof supabase === 'undefined' || supabase === null) {
    // We will initialize this once the keys are provided
}

// Theme & Sidebar State
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('sidebar-hidden');
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('#theme-icon');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
    }
}

// Chart Initialization
const ctx = document.getElementById('presenceChart');
if (ctx) {
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['18.05', '19.05', '20.05', '21.05', '22.05', '23.05', '24.05', '25.05', '26.05'],
            datasets: [
                {
                    label: 'Hadir',
                    data: [1100, 700, 300, 600, 900, 500, 400, 850, 950],
                    backgroundColor: '#007bff',
                    borderRadius: 5,
                    barThickness: 20
                },
                {
                    label: 'Izin/Sakit',
                    data: [400, 200, 150, 300, 450, 250, 200, 300, 250],
                    backgroundColor: '#e6f0ff',
                    borderRadius: 5,
                    barThickness: 20
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// WhatsApp Simulator Toggle
function toggleWA() {
    const wa = document.getElementById('wa-simulator');
    wa.classList.toggle('active');
}

// WhatsApp Logic
const waChat = document.getElementById('wa-chat');
const waInput = document.getElementById('wa-input-text');

function addMessage(text, type = 'sent') {
    const msg = document.createElement('div');
    msg.className = `wa-msg wa-msg-${type}`;
    msg.textContent = text;
    waChat.appendChild(msg);
    waChat.scrollTop = waChat.scrollHeight;
}

function sendWAMessage() {
    const text = waInput.value.trim();
    if (!text) return;

    addMessage(text, 'sent');
    waInput.value = '';

    // Simple Bot Logic
    setTimeout(() => {
        handleBotResponse(text.toLowerCase());
    }, 1000);
}

let pendingPresence = null;

function handleBotResponse(text) {
    // Basic cleaning
    const lowerText = text.toLowerCase();
    
    // Check if it's an attendance list (e.g., contains "hadir" or a list of names)
    if (lowerText.includes('hadir') || lowerText.split(',').length > 1 || lowerText.split('\n').length > 1) {
        // Simple regex to extract names (removing "hadir:" or numbers)
        let names = text.replace(/hadir/gi, '').replace(/[:\d\.]/g, '').split(/,|\n/);
        names = names.map(n => n.trim()).filter(n => n.length > 1);

        if (names.length > 0) {
            addMessage(`✅ Saya deteksi ${names.length} peserta: ${names.join(', ')}. Rekap untuk SMA Negeri 1. Jika sudah sesuai, balas "oke" ya!`, 'received');
            pendingPresence = {
                id: '#' + Math.floor(Math.random() * 900 + 100),
                mentor: 'Dmitry K.',
                date: new Date().toLocaleDateString(),
                school: 'SMA Negeri 1',
                students: `${names.length} Siswa`
            };
        } else {
            addMessage('Maaf Kak, format namanya kurang jelas. Contoh: "Hadir: Andi, Budi, Caca"', 'received');
        }
    } else if (text.toLowerCase() === 'oke' && pendingPresence) {
        addMessage('Mantap! Data sudah masuk ke database. Dashboard sudah terupdate! 🚀', 'received');
        updateDashboard(pendingPresence);
        pendingPresence = null;
    } else {
        addMessage('Halo Kak Mentor! Silakan kirim daftar nama peserta yang hadir (pisahkan dengan koma atau baris baru).', 'received');
    }
}

function handleImage(event) {
    addMessage('📷 Foto dokumentasi diterima. Karena kita pakai sistem teks, silakan ketik juga daftar nama peserta yang hadir di foto tersebut ya Kak.', 'received');
}

async function updateDashboard(data) {
    // If Supabase is connected, save to DB
    if (supabase) {
        const { error } = await supabase
            .from('attendance')
            .insert([{ 
                mentor_name: data.mentor, 
                school_name: data.school, 
                student_count: parseInt(data.students),
                student_list: data.student_list || ''
            }]);
        if (error) console.error('Error saving to Supabase:', error);
    }

    const tbody = document.getElementById('attendance-table-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${data.id}</td>
        <td>${data.mentor}</td>
        <td>${data.date}</td>
        <td>${data.school}</td>
        <td><span class="status-pill status-new">Baru</span></td>
        <td>${data.students}</td>
        <td>
            <i class="fas fa-edit" style="margin-right: 10px; cursor: pointer;"></i>
            <i class="fas fa-trash" style="color: var(--danger); cursor: pointer;"></i>
        </td>
    `;
    tbody.prepend(tr);
    
    // Highlight the new row
    tr.style.background = '#f0f7ff';
    setTimeout(() => {
        tr.style.transition = 'background 2s';
        tr.style.background = 'transparent';
    }, 2000);
}

// Handle Enter Key
waInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendWAMessage();
});
