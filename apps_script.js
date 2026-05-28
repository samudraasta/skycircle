/**
 * SKY CIRCLE MENTORING SYSTEM - APPS SCRIPT BACKEND
 * 
 * CARA DEPLOY:
 * 1. Buka Google Spreadsheet Kakak, klik Ekstensi > Apps Script.
 * 2. Hapus semua kode bawaan, lalu paste kode ini.
 * 3. Klik Simpan (ikon disket).
 * 4. Klik tombol "Terapkan" (Deploy) > "Deployment Baru" (New Deployment).
 * 5. Pilih jenis: "Aplikasi Web" (Web App).
 * 6. Set Akses: "Siapa saja" (Anyone).
 * 7. Klik Terapkan (Deploy), lalu setujui izin akses akun Google Kakak.
 * 8. Copy "URL Aplikasi Web" yang dihasilkan dan masukkan ke Settings Admin Sky Circle.
 */

const SHEET_PRESENSI = "Presensi";
const SHEET_MENTORS = "Mentors";
const SHEET_MENTEES = "Mentees";

// Setup awal untuk membuat sheet jika belum ada
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!ss.getSheetByName(SHEET_PRESENSI)) {
    let sheet = ss.insertSheet(SHEET_PRESENSI);
    sheet.appendRow(["Timestamp", "Mentor", "Siswa", "Status", "Sekolah"]);
  }
  if (!ss.getSheetByName(SHEET_MENTORS)) {
    let sheet = ss.insertSheet(SHEET_MENTORS);
    sheet.appendRow(["Nama", "Email"]);
  }
  if (!ss.getSheetByName(SHEET_MENTEES)) {
    let sheet = ss.insertSheet(SHEET_MENTEES);
    sheet.appendRow(["Nama Siswa", "Sekolah", "Mentor Penanggung Jawab"]);
  }
}

// Menangani permintaan GET (Untuk mengambil data Mentor dan Mentee)
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Baca Data Mentors
  const mentorSheet = ss.getSheetByName(SHEET_MENTORS);
  let mentors = [];
  if (mentorSheet) {
    const mentorData = mentorSheet.getDataRange().getValues();
    for (let i = 1; i < mentorData.length; i++) {
      mentors.push({
        nama: mentorData[i][0],
        email: mentorData[i][1]
      });
    }
  }

  // Baca Data Mentees
  const menteeSheet = ss.getSheetByName(SHEET_MENTEES);
  let mentees = [];
  if (menteeSheet) {
    const menteeData = menteeSheet.getDataRange().getValues();
    for (let i = 1; i < menteeData.length; i++) {
      mentees.push({
        nama: menteeData[i][0],
        sekolah: menteeData[i][1],
        mentor: menteeData[i][2]
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    mentors: mentors,
    mentees: mentees
  })).setMimeType(ContentService.MimeType.JSON);
}

// Menangani permintaan POST (Untuk menyimpan data presensi dari Web)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_PRESENSI);
    
    // data.attendance format: [{nama: "Budi", status: "Hadir", sekolah: "SMAN 2 Cibinong"}, ...]
    const timestamp = new Date();
    const mentorName = data.mentorName;
    
    if (data.attendance && Array.isArray(data.attendance)) {
      data.attendance.forEach(record => {
        sheet.appendRow([
          timestamp,
          mentorName,
          record.nama,
          record.status,
          record.sekolah || "-"
        ]);
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Data berhasil disimpan"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Menangani Preflight OPTIONS request untuk CORS
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}
