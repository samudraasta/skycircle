function getSS() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "";
  if (action === "get_students") {
    return handleGetStudents(e.parameter);
  }
  if (action === "get_profiles") {
    return handleGetProfiles(e.parameter || {});
  }
  if (action === "get_school_data") {
    return handleGetSchoolData(e.parameter || {});
  }
  if (action === "get_admin_data") {
    return handleGetAdminData(e.parameter || {});
  }
  if (action === "fix_timestamps") {
    return handleFixTimestamps();
  }
  if (action === "sync_profile_checklist") {
    var msg = syncProfileChecklist();
    return ContentService.createTextOutput(JSON.stringify({ 
      "status": "success", 
      "message": msg 
    })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ 
    "status": "success", 
    "message": "Sky Circle Mentoring API is active!" 
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    
    // ACTION: SYNC (Dari Python)
    if (payload.action === "sync") {
      return handleSync(payload);
    }
    
    // ACTION: CHAT (Dari Aplikasi Web Mentor)
    if (payload.action === "chat") {
      return handleChat(payload);
    }

    // ACTION: GET HISTORY
    if (payload.action === "get_history") {
      return handleGetHistory(payload);
    }
    
    // ACTION: UPDATE ROTATION
    if (payload.action === "update_rotation") {
      return handleUpdateRotation(payload);
    }
    
    if (payload.action === "check_mentor") {
      return handleCheckMentor(payload);
    }
    if (payload.action === "register_mentor") {
      return handleRegisterMentor(payload);
    }
    if (payload.action === "get_mentee") {
      return handleGetMentee(payload);
    }
    if (payload.action === "get_profiles") {
      return handleGetProfiles(payload);
    }
    if (payload.action === "get_image") {
      return handleGetImage(payload);
    }
    if (payload.action === "get_students") {
      return handleGetStudents(payload);
    }
    if (payload.action === "submit_presensi") {
      return handleSubmitPresensi(payload);
    }
    if (payload.action === "get_presensi_history") {
      return handleGetPresensiHistory(payload);
    }
    if (payload.action === "get_materi") {
      return handleGetMateri(payload);
    }
    if (payload.action === "get_school_data") {
      return handleGetSchoolData(payload);
    }
    if (payload.action === "get_admin_data") {
      return handleGetAdminData(payload);
    }
    
    // ACTION: FITUR PROFIL MENTEE
    if (payload.action === "submit_profile") {
      return handleSubmitProfile(payload);
    }
    if (payload.action === "get_profiles") {
      return handleGetProfiles(payload);
    }
    
    // ACTION: AUTO-FIX SPREADSHEET (Triggered by AI)
    if (payload.action === "format_sheet") {
      formatSpreadsheetManually();
      return ContentService.createTextOutput(JSON.stringify({ 
        "status": "success", 
        "message": "Spreadsheet berhasil diformat!" 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    throw new Error("Action tidak dikenali!");
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      "status": "error", 
      "message": error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleSync(payload) {
  var sheetName = payload.sheetName || "Semester 1";
  var ss = getSS();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clear();
  
  var rows = payload.data.length;
  var cols = payload.data[0].length;
  var range = sheet.getRange(1, 1, rows, cols);
  
  if (payload.data && rows > 0) range.setValues(payload.data);
  if (payload.backgrounds && payload.backgrounds.length > 0) range.setBackgrounds(payload.backgrounds);
  
  range.setHorizontalAlignment("left");
  sheet.getRange("H2:H" + rows).setNumberFormat("0.0%");
  
  return ContentService.createTextOutput(JSON.stringify({ 
    "status": "success", 
    "message": "Berhasil mengupdate " + rows + " baris data!" 
  })).setMimeType(ContentService.MimeType.JSON);
}

// Fungsi internal untuk menyimpan log chat ke Sheet
function saveChatToSheet(email, role, message) {
  var ss = getSS();
  var sheetName = "History Chat";
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["Timestamp", "Email", "Role", "Message"]);
    sheet.getRange("A1:D1").setFontWeight("bold").setBackground("#e6f2eb");
  }
  
  sheet.appendRow([Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"), email, role, message]);
}

function handleGetHistory(payload) {
  var email = payload.mentorEmail;
  if (!email) throw new Error("Email tidak ditemukan");

  var ss = getSS();
  var sheet = ss.getSheetByName("History Chat");
  
  var history = [];
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] === email) {
        history.push({
          sender: data[i][2], // 'mentor' atau 'ai'
          text: data[i][3]
        });
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    "status": "success",
    "history": history
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleChat(payload) {
  var userMessage = payload.message;
  var email = payload.mentorEmail;
  var mentorName = payload.mentorName || "";
  var ss = getSS();
  var sheet = ss.getSheetByName("History Chat");
  
  // Ambil history chat sebelumnya (tanpa API eksternal)
  var recentLogs = [];
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][1] === email) {
        recentLogs.unshift({role: data[i][2], text: data[i][3]});
        if (recentLogs.length >= 6) break;
      }
    }
  }
  
  // 1. Simpan pesan mentor ke History
  saveChatToSheet(email, 'mentor', userMessage);
  
  // 2. Logic SMART HEURISTIC (Tanpa Format Kaku, Tanpa AI Gemini)
  var replyText = "";
  var extracted = null;
  var msg = userMessage.toLowerCase().trim();
  
  // 1.5 Cek perintah HAPUS / RALAT
  extracted = smartParse(userMessage, mentorName, ss);
  var isDeleteCmd = msg.match(/\b(hapus|batalkan|batal|ralat|reset|kosongkan)\b/i);
  if (isDeleteCmd) {
     var pMatch = msg.match(/(?:pertemuan|pert|p)\s*(?:ke[-\s]*)?(\d+)/i) || msg.match(/\b(\d+)\b/);
     var pertToCancel = pMatch ? pMatch[1] : null;
     
     var targetHadirList = [];
     
     // Lacak kembali pesan absen sebelumnya dari history chat
     for (var k = recentLogs.length - 1; k >= 0; k--) {
         var t = recentLogs[k].text.toLowerCase().trim();
         // Abaikan pesan konfirmasi "oke" dan pesan "hapus"
         if (recentLogs[k].role === 'mentor' && t !== "oke" && t !== "benar" && t !== "ok" && t !== "iya" && t !== "y" && t !== "ya" && !t.match(/\b(hapus|batalkan|batal|ralat|reset|kosongkan)\b/i)) {
             var oldExtracted = smartParse(recentLogs[k].text, mentorName, ss);
             
             // Ambil pertemuan dari chat sebelumnya jika tidak disebutkan sekarang
             if (!pertToCancel && oldExtracted.pertemuan) {
                 pertToCancel = oldExtracted.pertemuan;
             }
             
             if (oldExtracted.hadir && oldExtracted.hadir.length > 0) {
                 targetHadirList = oldExtracted.hadir;
                 break;
             }
         }
     }
     
     if (!pertToCancel) {
         replyText = "⚠️ Kakak ingin membatalkan absen, tapi AI tidak mendeteksi ini Pertemuan ke berapa.\n\nSebutkan nomornya, contoh: *'Hapus P2'*";
     } else if (targetHadirList.length === 0) {
         replyText = "⚠️ Kakak ingin membatalkan absen pertemuan ke-" + pertToCancel + ", tapi AI tidak bisa melacak nama-nama murid dari riwayat chat sebelumnya.\n\nMohon hapus manual di Excel atau ulangi laporannya.";
     } else {
         deleteRekapPresensi(pertToCancel, targetHadirList, ss);
         replyText = "✅ Siap Kak! Data absen untuk **" + targetHadirList.length + " anak** di Pertemuan ke-" + pertToCancel + " yang baru saja Kakak laporkan sudah berhasil ditarik/dihapus.\n\nSilakan ketik ulang absen yang benarnya ya!";
     }
     saveChatToSheet(email, 'ai', replyText);
     return ContentService.createTextOutput(JSON.stringify({
        "status": "success",
        "reply": replyText
     })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (msg === "oke" || msg === "benar" || msg === "ok" || msg === "iya" || msg === "y" || msg === "ya") {
    // Mengecek apakah sebelumnya Bot bertanya konfirmasi
    var isWaitingConfirm = false;
    if (recentLogs.length > 0 && recentLogs[recentLogs.length - 1].role === 'ai') {
      var lastAiMsg = recentLogs[recentLogs.length - 1].text;
      if (lastAiMsg.indexOf("Apakah nama-nama di atas sudah benar") !== -1 || lastAiMsg.indexOf("Apakah data ini sudah benar") !== -1) {
        isWaitingConfirm = true;
      }
    }
    
    if (isWaitingConfirm) {
      // Cari pesan laporan mentor yang terakhir kali
      var lastMentorMsg = "";
      for (var k = recentLogs.length - 1; k >= 0; k--) {
        var t = recentLogs[k].text.toLowerCase().trim();
        if (recentLogs[k].role === 'mentor' && t !== "oke" && t !== "benar" && t !== "ok" && t !== "iya" && t !== "y" && t !== "ya") {
          lastMentorMsg = recentLogs[k].text;
          break;
        }
      }
      
      if (lastMentorMsg) {
        extracted = smartParse(lastMentorMsg, mentorName, ss);
        if (extracted.is_complete) {
          updateRekapPresensi(extracted);
          replyText = "Mantap Kak! Presensi mentoring sudah sukses dicatat ke dalam *Google Sheets* dengan secepat kilat! ⚡✅\n\nSampai jumpa di pertemuan berikutnya!";
        } else {
          replyText = "Gagal memproses data lama, mohon ulangi pesannya.";
        }
      } else {
        replyText = "Maaf Kak, aku kehilangan jejak datanya. Bisa dikirim ulang laporan presensinya?";
      }
    } else {
      replyText = "Siap Kak! Ada lagi yang bisa Kak Ukhti bantu? Langsung ketik saja laporannya ya.";
    }
  } else {
    // Jalankan Smart Parse
    if (!extracted.is_complete) {
      replyText = "Hmm, Kak Ukhti belum bisa melacak datanya. 😅\n\nPastikan Kakak menyebutkan **Pertemuan ke-berapa** (misal P1, pert 2) dan **Nama Panggilan anak yang HADIR saja**.\n\nContoh paling santai:\n*Kak Ukhti, P1 ya. Bima sama Farid hadir.*";
    } else {
      // Format lengkap! Tampilkan hasil pelacakan cerdas dengan format rapi (list bernomor)
      var listHadir = "";
      var displayArray = extracted.hadirDisplay || extracted.hadir;
      for (var z = 0; z < displayArray.length; z++) {
        listHadir += "&nbsp;&nbsp;&nbsp;&nbsp;" + (z + 1) + ". " + displayArray[z] + "<br>";
      }
      
      replyText = "Siap Kak! Kak Ukhti sudah melacak datanya secara pintar 🧠✨<br><br>" +
                  "📅 **Pertemuan**: " + extracted.pertemuan + "<br><br>" +
                  "✅ **Daftar Hadir**:<br>" + listHadir + "<br>";
                  
      if (extracted.unknownWords && extracted.unknownWords.length > 0) {
        replyText += "<br><br>❌ **Tidak Dikenali (Cek ejaan/Bukan anggota):**<br>";
        for (var u = 0; u < extracted.unknownWords.length; u++) {
          replyText += "&nbsp;&nbsp;&nbsp;&nbsp;- " + (extracted.unknownWords[u].charAt(0).toUpperCase() + extracted.unknownWords[u].slice(1)) + "<br>";
        }
      }
      
      replyText += "<br><br>**Apakah nama-nama di atas sudah benar semua? Jawab 'Oke'**<br><br>" +
                  "⚠️ **MOHON CEK KEMBALI**:<br>" +
                  "*(Pastikan angka **Pertemuan** tidak salah. Jika salah/kurang nama, abaikan pesan ini dan ketik ulang laporannya).*<br>" +
                  "*(Jika terlanjur di-Oke-kan dan ingin menghapus absen pertemuan ini, ketik: \"Hapus P" + extracted.pertemuan + "\")*";
    }
  }
  
  // Simpan balasan AI ke History
  saveChatToSheet(email, 'ai', replyText);
  
  return ContentService.createTextOutput(JSON.stringify({
    "status": "success",
    "reply": replyText,
    "data": extracted
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// FUNGSI INTI SMART HEURISTICS
// ==========================================
function getMentorRosterData(ss) {
  var dataRekap = ss.getSheetByName("Semester 1");
  if (!dataRekap) return [];
  
  var vals = dataRekap.getDataRange().getValues();
  var headers = vals[0];
  var namaIdx = -1, kelompokIdx = -1, kelasIdx = -1, angkatanIdx = -1, lpIdx = -1;
  for (var i=0; i<headers.length; i++) {
    var h = String(headers[i]).toLowerCase().trim();
    if (h.indexOf("nama peserta didik") !== -1 || h === "nama") namaIdx = i;
    if (h.indexOf("kelompok") !== -1 || h === "grup") kelompokIdx = i;
    if (h === "kelas") kelasIdx = i;
    if (h === "angkatan") angkatanIdx = i;
    if (h === "l/p" || h === "jenis kelamin") lpIdx = i;
  }
  
  if (namaIdx === -1) return [];
  
  var roster = [];
  
  for (var r=1; r<vals.length; r++) {
     roster.push({
       fullName: String(vals[r][namaIdx]),
       group: kelompokIdx !== -1 ? String(vals[r][kelompokIdx]) : "",
       kelas: kelasIdx !== -1 ? String(vals[r][kelasIdx]) : "",
       angkatan: angkatanIdx !== -1 ? String(vals[r][angkatanIdx]) : "",
       lp: lpIdx !== -1 ? String(vals[r][lpIdx]) : ""
     });
  }
  return roster;
}

function smartParse(userMessage, mentorName, ss) {
  // Buang SEMUA tanda baca, simbol, dan bullet points (hanya sisakan huruf, angka, dan spasi)
  var text = userMessage.toLowerCase().replace(/[^a-z0-9\s]/gi, ' ');
  
  // 1. Cari Pertemuan (P1, pert 1, pertemuan ke 1)
  var pertemuanMatch = text.match(/(?:pertemuan|pert|p)\s*(?:ke[-\s]*)?(\d+)/i);
  var pertemuan = pertemuanMatch ? pertemuanMatch[1] : "";
  
  // 2. Fuzzy Cari Nama berdasarkan URUTAN KATA DARI MENTOR
  var roster = getMentorRosterData(ss);
  var hadir = [];
  var hadirDisplay = [];
  var detectedGroup = "";
  
  // Kata-kata yang diabaikan saat pencarian nama (agar tidak overlap)
  var ignoreList = [
    "muhammad", "mohammad", "moh", "mohd", "m", "ahmad", "siti", "nur", 
    "putra", "putri", "raden", "tubagus", "bin", "binti", 
    "hadir", "sakit", "izin", "alpa", "absen", "telat",
    "pertemuan", "pert", "kelompok", "grup", "group", "kak", "kakak", "ukhti", "ayun", "ya", "dan", "sama",
    "waalaikumussalam", "assalamualaikum", "ini", "daftar", "yang", "kemarin", "datang", "hari"
  ];
  
  var words = text.split(/\s+/); // Potong pesan mentor jadi kata demi kata
  var unknownWords = [];
  
  var w = 0;
  while (w < words.length) {
     var word = words[w].trim();
     if (word.length < 3 || ignoreList.indexOf(word) !== -1 || /\d/.test(word)) {
         w++;
         continue;
     }
     
     // Coba cek Bigram (Kombinasi dengan kata berikutnya)
     var matchedBigram = false;
     if (w < words.length - 1) {
         var nextWord = words[w+1].trim();
         // Cek apakah kata berikutnya valid
         if (nextWord.length >= 3 && ignoreList.indexOf(nextWord) === -1 && !/\d/.test(nextWord)) {
             var bigram = word + " " + nextWord;
             var bestBigramMatch = null;
             
             for (var i=0; i < roster.length; i++) {
                 var fName = roster[i].fullName.toLowerCase();
                 // Jika nama anak ini persis memuat dua kata yang diketik berurutan
                 if (fName.indexOf(bigram) !== -1) {
                     bestBigramMatch = roster[i];
                     break;
                 }
             }
             
             if (bestBigramMatch) {
                 if (hadir.indexOf(bestBigramMatch.fullName) === -1) {
                    hadir.push(bestBigramMatch.fullName);
                    var displayString = bestBigramMatch.fullName + " (" + bestBigramMatch.lp + "/" + bestBigramMatch.kelas + "/" + bestBigramMatch.angkatan + ")";
                    hadirDisplay.push(displayString);
                    if (!detectedGroup) detectedGroup = bestBigramMatch.group;
                 }
                 w += 2; // Lompat 2 kata karena dua-duanya dipakai
                 matchedBigram = true;
                 continue; // Lanjut ke iterasi while berikutnya
             }
         }
     }
     
     // Jika tidak ketemu versi 2 kata (Bigram), fallback ke Unigram (1 kata)
     if (!matchedBigram) {
         var bestMatch = null;
         for (var i=0; i < roster.length; i++) {
            var fName = roster[i].fullName.toLowerCase();
            
            // Prioritas 1: Exact word
            var exactRegex = new RegExp("\\b" + word + "\\b", "i");
            if (exactRegex.test(fName)) {
               bestMatch = roster[i];
               break;
            }
            
            // Prioritas 2: Substring
            if (word.length >= 4 && fName.indexOf(word) !== -1) {
               if (!bestMatch) bestMatch = roster[i];
            }
            
            // Prioritas 3: Typo (Fuzzy Matching / Levenshtein)
            if (!bestMatch && word.length >= 4) {
               var fWords = fName.split(/\s+/);
               for (var fw=0; fw < fWords.length; fw++) {
                  var maxTypo = word.length >= 6 ? 2 : 1; // Toleransi typo 1-2 huruf
                  if (Math.abs(fWords[fw].length - word.length) <= maxTypo) {
                     var dist = getLevenshteinDistance(fWords[fw], word);
                     if (dist <= maxTypo) {
                        bestMatch = roster[i];
                        break; // Langsung kunci kalau ketemu nama yg mirip
                     }
                  }
               }
            }
         }
         
         if (bestMatch) {
            if (hadir.indexOf(bestMatch.fullName) === -1) {
               hadir.push(bestMatch.fullName);
               var displayString = bestMatch.fullName + " (" + bestMatch.lp + "/" + bestMatch.kelas + "/" + bestMatch.angkatan + ")";
               hadirDisplay.push(displayString);
               if (!detectedGroup) detectedGroup = bestMatch.group;
            }
         } else {
            if (unknownWords.indexOf(word) === -1) {
               unknownWords.push(word);
            }
         }
         w++;
     }
  }
  
  // Coba cari kelompok eksplisit jika dari anak tidak dapat
  if (!detectedGroup) {
     var gMatch = text.match(/(bc|gc1|gc2|xsumen\w*)\s*([xvi\-0-9]+)?/i);
     if (gMatch) {
       detectedGroup = gMatch[1].toUpperCase() + (gMatch[2] ? " " + gMatch[2].toUpperCase() : "");
     }
  }
  
  return {
    "kelompok": detectedGroup,
    "pertemuan": pertemuan,
    "hadir": hadir,
    "hadirDisplay": hadirDisplay,
    "unknownWords": unknownWords,
    "izin": [],
    "sakit": [],
    "alpa": [],
    "is_complete": (pertemuan !== "" && hadir.length > 0)
  };
}

// ==========================================
// FUNGSI TULIS KE SHEET
// ==========================================

function deleteRekapPresensi(pertemuan, studentNamesArray, ss) {
  var sheet = ss.getSheetByName("Semester 1");
  if (!sheet) return;
  
  var p_col_name = "P" + pertemuan;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colIndex = -1;
  var namaIndex = -1;
  
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).toLowerCase().trim();
    if (h === p_col_name.toLowerCase()) colIndex = i + 1;
    if (h.indexOf("nama peserta didik") !== -1 || h === "nama") namaIndex = i + 1;
  }
  
  if (colIndex === -1 || namaIndex === -1 || !studentNamesArray || studentNamesArray.length === 0) return;
  
  var data = sheet.getDataRange().getValues();
  
  for (var r = 1; r < data.length; r++) {
    var sName = String(data[r][namaIndex - 1]).toLowerCase().trim();
    
    // Cek apakah nama anak ini ada di dalam array yang mau dihapus
    var matchFound = false;
    for (var j = 0; j < studentNamesArray.length; j++) {
       var targetName = String(studentNamesArray[j]).toLowerCase().trim();
       if (sName === targetName) {
           matchFound = true;
           break;
       }
    }
    
    if (matchFound) {
       // Kosongkan nilai absen khusus untuk anak ini saja
       sheet.getRange(r + 1, colIndex).setValue("");
    }
  }
}

function updateRekapPresensi(extracted) {
  var ss = getSS();
  var sheet = ss.getSheetByName("Semester 1");
  if (!sheet) return;
  
  var pertemuan = String(extracted.pertemuan).replace(/\D/g, ""); 
  if (!pertemuan) return;
  
  var p_col_name = "P" + pertemuan;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colIndex = -1;
  var namaIndex = -1;
  var kelompokIndex = -1;
  
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).toLowerCase().trim();
    if (h === p_col_name.toLowerCase()) colIndex = i + 1;
    if (h === "nama peserta didik" || h === "nama") namaIndex = i + 1;
    if (h === "kelompok" || h === "grup") kelompokIndex = i + 1;
  }
  
  if (colIndex === -1 || namaIndex === -1) return;
  
  var data = sheet.getDataRange().getValues();
  var targetKelompok = String(extracted.kelompok).toLowerCase().trim();
  
  function getStatus(studentName) {
    studentName = String(studentName).toLowerCase();
    var hadirArr = extracted.hadir || [];
    for (var j = 0; j < hadirArr.length; j++) {
      var keyword = String(hadirArr[j]).toLowerCase().trim();
      if (keyword.length >= 3 && studentName === keyword) {
        return "Hadir";
      }
    }
    return null;
  }
  
  for (var r = 1; r < data.length; r++) {
    var studentName = data[r][namaIndex - 1];
    var studentKelompok = data[r][kelompokIndex - 1];
    
    var matchKelompok = true;
    if (targetKelompok && targetKelompok !== "undefined" && kelompokIndex !== -1) {
      var sGrup = String(studentKelompok).toLowerCase();
      if (sGrup.indexOf(targetKelompok) === -1 && targetKelompok.indexOf(sGrup) === -1) {
         matchKelompok = false;
      }
    }
    
    if (matchKelompok && studentName) {
       var newStatus = getStatus(studentName);
       if (newStatus === "Hadir") {
         sheet.getRange(r + 1, colIndex).setValue(newStatus);
       }
    }
  }
}

function doOptions(e) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
}

// ==========================================
// FUNGSI LEVENSHTEIN (DETEKSI TYPO)
// ==========================================
function getLevenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  var matrix = [];
  for (var i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (var j = 0; j <= a.length; j++) { matrix[0][j] = j; }
  for (var i = 1; i <= b.length; i++) {
    for (var j = 1; j <= a.length; j++) {
      if (b.charAt(i-1) == a.charAt(j-1)) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1, // substitution
          Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1) // insertion & deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// ==========================================
// FUNGSI API BARU UNTUK SISTEM PRESENSI
// ==========================================

function handleCheckMentor(payload) {
  var email = payload.email;
  var ss = getSS();
  var sheet = ss.getSheetByName("Data Mentor");
  if (!sheet) {
     return ContentService.createTextOutput(JSON.stringify({"status": "not_found"})).setMimeType(ContentService.MimeType.JSON);
  }
  var data = sheet.getDataRange().getValues();
  for(var i = 1; i < data.length; i++) {
     if(data[i][1] === email) { // Asumsi email di kolom B
        return ContentService.createTextOutput(JSON.stringify({
           "status": "found", 
           "mentorName": data[i][0] // Asumsi nama di kolom A
        })).setMimeType(ContentService.MimeType.JSON);
     }
  }
  return ContentService.createTextOutput(JSON.stringify({"status": "not_found"})).setMimeType(ContentService.MimeType.JSON);
}

function handleRegisterMentor(payload) {
  var ss = getSS();
  var sheet = ss.getSheetByName("Data Mentor");
  if (!sheet) {
     sheet = ss.insertSheet("Data Mentor");
     sheet.appendRow(["Nama Lengkap", "Email", "No HP", "Jenis Kelamin", "Angkatan", "Tanggal Lahir", "Alamat", "Timestamp"]);
  }
  sheet.appendRow([
    payload.nama || "", 
    payload.email || "", 
    payload.nohp || "", 
    payload.jk || "", 
    payload.angkatan || "", 
    payload.tgl_lahir || "", 
    payload.alamat || "", 
    Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
  ]);
  return ContentService.createTextOutput(JSON.stringify({"status": "success"})).setMimeType(ContentService.MimeType.JSON);
}

function handleGetStudents(payload) {
  var ss = getSS();
  var roster = getMentorRosterData(ss);
  var allStudents = [];
  
  // Format roster menjadi array of object agar gampang diload di UI
  for(var i=0; i<roster.length; i++) {
     allStudents.push({
         nama: roster[i].fullName,
         kelompok: roster[i].group
     });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
     "status": "success",
     "students": allStudents
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleSubmitPresensi(payload) {
  var ss = getSS();
  var sheet = ss.getSheetByName("Semester 1");
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
         "status": "error",
         "message": "Sheet Semester 1 tidak ditemukan"
      })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var pertemuanNum = payload.pertemuan; // cth: 1, 2, 3
  var hadirList = payload.hadirList || []; // Array of student names yang hadir
  var tanggal = payload.tanggal;
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  // Cari kolom nama anak
  var namaIndex = -1;
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).toLowerCase().trim();
    if (h.indexOf("nama peserta didik") !== -1 || h === "nama") {
      namaIndex = i + 1;
      break;
    }
  }
  
  // Cari kolom pertemuan
  var colIndex = -1;
  var targetHeader = "pertemuan " + pertemuanNum;
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).toLowerCase().trim();
    if (h === targetHeader || h === "p" + pertemuanNum) {
      colIndex = i + 1;
      break;
    }
  }
  
  if (namaIndex === -1 || colIndex === -1) {
     return ContentService.createTextOutput(JSON.stringify({
         "status": "error",
         "message": "Kolom Pertemuan atau Nama tidak ditemukan di Excel"
      })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Loop data dan isi absensi jika nama cocok dengan yang di submit
  var updatedCount = 0;
  var hadirNames = []; // untuk direkam di log
  var izinNames = [];  // untuk direkam di log
  var izinList = payload.izinList || [];

  for (var r = 1; r < data.length; r++) {
    var studentName = String(data[r][namaIndex - 1]).toLowerCase().trim();
    
    // Cek apakah anak ini ada di daftar hadirList
    var isHadir = false;
    for(var h = 0; h < hadirList.length; h++) {
       var submittedName = String(hadirList[h]).toLowerCase().trim();
       if (studentName === submittedName) {
           isHadir = true;
           hadirNames.push(String(data[r][namaIndex - 1]).trim());
           break;
       }
    }
    
    if (isHadir) {
       sheet.getRange(r + 1, colIndex).setValue("Hadir");
       updatedCount++;
    }

    // Cek apakah anak ini ada di daftar izinList
    var isIzin = false;
    for(var z = 0; z < izinList.length; z++) {
       var submittedNameIzin = String(izinList[z]).toLowerCase().trim();
       if (studentName === submittedNameIzin) {
           isIzin = true;
           izinNames.push(String(data[r][namaIndex - 1]).trim());
           break;
       }
    }
    
    if (isIzin) {
       sheet.getRange(r + 1, colIndex).setValue("Izin/Sakit");
       updatedCount++;
    }
  }

  // --- LOG PRESENSI RECORDING ---
  var logSheetName = "Log Presensi";
  var logSheet = ss.getSheetByName(logSheetName);
  
  // Jika sheet Log Presensi belum ada, buatkan otomatis
  if (!logSheet) {
      logSheet = ss.insertSheet(logSheetName);
      // Buat Header untuk sheet baru
      logSheet.appendRow(["Waktu Input", "Tanggal Mentoring", "Nama Mentor", "Email Mentor", "Pertemuan Ke", "Jumlah Hadir", "Daftar Siswa Hadir", "Jumlah Izin/Sakit", "Daftar Siswa Izin/Sakit"]);
      logSheet.getRange("A1:I1").setFontWeight("bold").setBackground("#d9ead3");
  }

  // Tambahkan baris log baru (Format waktu pasti WIB Asia/Jakarta)
  var timeStamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  var mentorName = payload.mentorName || "Unknown";
  var mentorEmail = payload.mentorEmail || "Tanpa Email";
  var daftarHadirStr = hadirNames.join(", ");
  var daftarIzinStr = izinNames.join(", ");
  logSheet.appendRow([timeStamp, tanggal, mentorName, mentorEmail, "Pertemuan " + pertemuanNum, hadirNames.length, daftarHadirStr, izinNames.length, daftarIzinStr]);
  // ------------------------------
  
  return ContentService.createTextOutput(JSON.stringify({
     "status": "success",
     "message": updatedCount + " siswa berhasil dicatat hadir untuk Pertemuan " + pertemuanNum + "!"
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetSchoolData(payload) {
  var ss = getSS();
  var sheet = ss.getSheetByName("Semester 1");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({"status": "error"})).setMimeType(ContentService.MimeType.JSON);
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var students = [];
  
  var colMap = {};
  for(var i=0; i<headers.length; i++) colMap[String(headers[i]).toLowerCase().trim()] = i;
  
  for(var i=1; i<data.length; i++) {
    var row = data[i];
    var ket = colMap["keterangan"] !== undefined ? String(row[colMap["keterangan"]]).toLowerCase() : "";
    if (ket.indexOf("nonis") !== -1) continue; // Skip nonis
    
    var student = {
      nama: colMap["nama peserta didik"] !== undefined ? row[colMap["nama peserta didik"]] : (colMap["nama"] !== undefined ? row[colMap["nama"]] : ""),
      gender: colMap["l/p"] !== undefined ? row[colMap["l/p"]] : (colMap["jenis kelamin"] !== undefined ? row[colMap["jenis kelamin"]] : ""),
      kelas: colMap["kelas"] !== undefined ? row[colMap["kelas"]] : "",
      kelompok: colMap["kelompok"] !== undefined ? row[colMap["kelompok"]] : "",
      mentor: colMap["nama mentor"] !== undefined ? row[colMap["nama mentor"]] : "",
      angkatan: colMap["angkatan"] !== undefined ? row[colMap["angkatan"]] : "",
      p1: colMap["p1"] !== undefined ? row[colMap["p1"]] : "",
      p2: colMap["p2"] !== undefined ? row[colMap["p2"]] : "",
      p3: colMap["p3"] !== undefined ? row[colMap["p3"]] : "",
      p4: colMap["p4"] !== undefined ? row[colMap["p4"]] : "",
      p5: colMap["p5"] !== undefined ? row[colMap["p5"]] : "",
      p6: colMap["p6"] !== undefined ? row[colMap["p6"]] : "",
      p7: colMap["p7"] !== undefined ? row[colMap["p7"]] : "",
      p8: colMap["p8"] !== undefined ? row[colMap["p8"]] : "",
      p9: colMap["p9"] !== undefined ? row[colMap["p9"]] : "",
      p10: colMap["p10"] !== undefined ? row[colMap["p10"]] : "",
      p11: colMap["p11"] !== undefined ? row[colMap["p11"]] : "",
      p12: colMap["p12"] !== undefined ? row[colMap["p12"]] : ""
    };
    students.push(student);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
     "status": "success",
     "students": students
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetAdminData(payload) {
  var ss = getSS();
  var mentorSheet = ss.getSheetByName("Data Mentor");
  var mentorPhones = {};
  if (mentorSheet) {
    var mData = mentorSheet.getDataRange().getValues();
    var mHeaders = mData[0];
    var hNama = -1, hHp = -1;
    for(var j=0; j<mHeaders.length; j++){
       var h = String(mHeaders[j]).toLowerCase();
       if(h.indexOf("nama") !== -1) hNama = j;
       if(h.indexOf("hp") !== -1) hHp = j;
    }
    for(var i=1; i<mData.length; i++){
       if(hNama !== -1 && hHp !== -1){
          var mName = String(mData[i][hNama]).toLowerCase().trim();
          mentorPhones[mName] = String(mData[i][hHp]);
       }
    }
  }

  var sheet = ss.getSheetByName("Semester 1");
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({"status": "error"})).setMimeType(ContentService.MimeType.JSON);
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var colMap = {};
  for(var i=0; i<headers.length; i++) colMap[String(headers[i]).toLowerCase().trim()] = i;
  
  var groups = {}; // key: mentorName_kelompok
  
  for(var i=1; i<data.length; i++) {
    var row = data[i];
    var kelompok = colMap["kelompok"] !== undefined ? String(row[colMap["kelompok"]]).trim() : "";
    var mentor = colMap["nama mentor"] !== undefined ? String(row[colMap["nama mentor"]]).trim() : "";
    var kelas = colMap["kelas"] !== undefined ? String(row[colMap["kelas"]]).trim() : "";
    
    if(!mentor && !kelompok) continue; // Skip jika belum ada kelompok
    
    var key = mentor + "_" + kelompok;
    if(!groups[key]) {
       groups[key] = {
          mentor: mentor,
          kelompok: kelompok,
          kelas: kelas,
          noHp: mentorPhones[mentor.toLowerCase()] || "",
          p1_filled: false,
          p2_filled: false,
          p3_filled: false,
          p4_filled: false,
          p5_filled: false,
          p6_filled: false,
          p7_filled: false,
          p8_filled: false,
          p9_filled: false,
          p10_filled: false,
          p11_filled: false,
          p12_filled: false
       };
    }
    
    // Check if any student in this group has attendance marked
    if(colMap["p1"] !== undefined && row[colMap["p1"]] !== "") groups[key].p1_filled = true;
    if(colMap["p2"] !== undefined && row[colMap["p2"]] !== "") groups[key].p2_filled = true;
    if(colMap["p3"] !== undefined && row[colMap["p3"]] !== "") groups[key].p3_filled = true;
    if(colMap["p4"] !== undefined && row[colMap["p4"]] !== "") groups[key].p4_filled = true;
    if(colMap["p5"] !== undefined && row[colMap["p5"]] !== "") groups[key].p5_filled = true;
    if(colMap["p6"] !== undefined && row[colMap["p6"]] !== "") groups[key].p6_filled = true;
    if(colMap["p7"] !== undefined && row[colMap["p7"]] !== "") groups[key].p7_filled = true;
    if(colMap["p8"] !== undefined && row[colMap["p8"]] !== "") groups[key].p8_filled = true;
    if(colMap["p9"] !== undefined && row[colMap["p9"]] !== "") groups[key].p9_filled = true;
    if(colMap["p10"] !== undefined && row[colMap["p10"]] !== "") groups[key].p10_filled = true;
    if(colMap["p11"] !== undefined && row[colMap["p11"]] !== "") groups[key].p11_filled = true;
    if(colMap["p12"] !== undefined && row[colMap["p12"]] !== "") groups[key].p12_filled = true;
  }
  
  var mentorList = [];
  for(var k in groups) mentorList.push(groups[k]);
  
  return ContentService.createTextOutput(JSON.stringify({
     "status": "success",
     "mentors": mentorList
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// FUNGSI UNTUK MERAPIKAN FORMAT SPREADSHEET (AUTO-FIX)
// ==========================================
function formatSpreadsheetManually() {
  var ss = getSS();
  var sheet = ss.getSheetByName("Semester 1");
  
  if (!sheet) {
    Logger.log("Sheet 'Semester 1' tidak ditemukan.");
    return;
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var colMap = {};
  for (var i = 0; i < headers.length; i++) {
    colMap[String(headers[i]).toLowerCase().trim()] = i + 1; // 1-indexed for getRange
  }
  
  // 1. Ubah Total Pertemuan menjadi 12
  var totalPertemuanCol = colMap["total pertemuan"];
  if (totalPertemuanCol) {
    var range = sheet.getRange(2, totalPertemuanCol, sheet.getLastRow() - 1, 1);
    var values = range.getValues();
    for (var i = 0; i < values.length; i++) {
      values[i][0] = 12;
    }
    range.setValues(values);
    Logger.log("Berhasil mengubah angka di kolom Total Pertemuan menjadi 12.");
  }
  
  // 2. Tambahkan kolom Kelompok dan P1 s.d P12 jika belum ada
  var requiredHeaders = ["Kelompok"];
  for (var i = 1; i <= 12; i++) {
    requiredHeaders.push("P" + i);
  }
  
  var nextCol = sheet.getLastColumn() + 1;
  var headersAdded = [];
  
  for (var i = 0; i < requiredHeaders.length; i++) {
    var req = requiredHeaders[i];
    if (!colMap[req.toLowerCase()]) {
      sheet.getRange(1, nextCol).setValue(req);
      sheet.getRange(1, nextCol).setFontWeight("bold");
      sheet.getRange(1, nextCol).setBackground("#f3f3f3");
      headersAdded.push(req);
      nextCol++;
    }
  }
  
  if (headersAdded.length > 0) {
    Logger.log("Berhasil menambahkan kolom baru: " + headersAdded.join(", "));
  } else {
    Logger.log("Semua kolom (Kelompok & P1-P12) sudah ada.");
  }
  
  Logger.log("Format spreadsheet selesai!");
}

// ==========================================
// FUNGSI UNTUK GENERATE KELOMPOK KELAS X
// ==========================================
function generateGroupsForKelasX() {
  var ss = getSS();
  var sheet = ss.getSheetByName("Semester 1");
  
  if (!sheet) {
    Logger.log("Sheet 'Semester 1' tidak ditemukan.");
    return;
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var colMap = {};
  for (var i = 0; i < headers.length; i++) {
    colMap[String(headers[i]).toLowerCase().trim()] = i;
  }
  
  var kelompokColIdx = colMap["kelompok"];
  var kelasColIdx = colMap["kelas"];
  var genderColIdx = colMap["l/p"];
  
  if (kelompokColIdx === undefined || kelasColIdx === undefined || genderColIdx === undefined) {
    Logger.log("Gagal: Kolom 'Kelompok', 'Kelas', atau 'L/P' tidak ditemukan.");
    return;
  }
  
  // Kumpulkan data siswa per kelas (hanya kelas X)
  var studentsByClass = {};
  
  for (var i = 1; i < data.length; i++) {
    var kelasAsli = String(data[i][kelasColIdx]).trim();
    // Deteksi kelas X (hindari XI dan XII)
    if (kelasAsli.toUpperCase().indexOf("X") === 0 && kelasAsli.toUpperCase().indexOf("XI") === -1) {
      if (!studentsByClass[kelasAsli]) {
        studentsByClass[kelasAsli] = { L: [], P: [] };
      }
      var gender = String(data[i][genderColIdx]).toUpperCase().trim();
      if (gender === "L" || gender === "P") {
        studentsByClass[kelasAsli][gender].push({ rowIndex: i });
      }
    }
  }
  
  var updates = 0;
  
  // Proses penamaan kelompok
  for (var kelasAsli in studentsByClass) {
    // Normalisasi nama kelas (contoh: "X - 1" -> "X-1") agar rapi di grup dan tidak ada double strip
    var kelasFormat = kelasAsli.replace(/[\s-]+/g, '-');
    
    var boys = studentsByClass[kelasAsli].L;
    for (var j = 0; j < boys.length; j++) {
      var rIdx = boys[j].rowIndex;
      data[rIdx][kelompokColIdx] = "BC " + kelasFormat + " 34";
      updates++;
    }
    
    var girls = studentsByClass[kelasAsli].P;
    for (var j = 0; j < girls.length; j++) {
      var rIdx = girls[j].rowIndex;
      data[rIdx][kelompokColIdx] = "GC " + kelasFormat + " 34";
      updates++;
    }
  }
  
  // Tulis kembali data kelompok ke spreadsheet
  if (updates > 0) {
    var kelompokRange = sheet.getRange(2, kelompokColIdx + 1, data.length - 1, 1);
    var kelompokData = [];
    for (var i = 1; i < data.length; i++) {
      kelompokData.push([data[i][kelompokColIdx]]);
    }
    kelompokRange.setValues(kelompokData);
    Logger.log("Berhasil membuat kelompok untuk " + updates + " siswa Kelas X.");
  } else {
    Logger.log("Tidak ada siswa Kelas X yang diproses (cek apakah kolom kelas berawalan 'X').");
  }
}

// ==========================================
// FITUR BUKU SAKU (PROFIL MENTEE)
// ==========================================

function handleSubmitProfile(payload) {
  var ss = getSS();
  var sheet = ss.getSheetByName("Profil Mentee");
  
  if (!sheet) {
    sheet = ss.insertSheet("Profil Mentee");
    sheet.appendRow([
      "Timestamp", "Nama", "Kelas", "Alamat", "Ortu & No HP", "Hobi", 
      "Aktivitas Harian", "Paling Tidak Disukai", "Karakter", "Liburan", 
      "Tertarik Mempelajari", "Instagram", "Foto URL"
    ]);
    sheet.getRange("A1:M1").setFontWeight("bold").setBackground("#d9ead3");
  }
  
  var nama = payload.nama || "";
  var kelas = payload.kelas || "";
  var alamat = payload.alamat || "";
  var ortu = payload.ortu || "";
  var hobi = payload.hobi || "";
  var aktivitas = payload.aktivitas || "";
  var tidakDisukai = payload.tidakDisukai || "";
  var karakter = payload.karakter || "";
  var liburan = payload.liburan || "";
  var mempelajari = payload.mempelajari || "";
  var instagram = payload.instagram || "";
  
  var fotoBase64 = payload.fotoBase64 || "";
  var fotoUrl = "";
  
  try {
    if (fotoBase64) {
      // Decode Base64
      var splitBase = fotoBase64.split(',');
      var typeStr = splitBase[0]; // data:image/jpeg;base64
      var ext = typeStr.indexOf("png") !== -1 ? ".png" : ".jpg";
      var mimeType = ext === ".png" ? MimeType.PNG : MimeType.JPEG;
      
      var decodedData = Utilities.base64Decode(splitBase[1]);
      var blob = Utilities.newBlob(decodedData, mimeType, nama + ext);
      
      // Get or create Folder "Foto Profil Mentee"
      var folders = DriveApp.getFoldersByName("Foto Profil Mentee");
      var folder;
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder("Foto Profil Mentee");
        folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
      
      // Save file
      var file = folder.createFile(blob);
      fotoUrl = file.getUrl();
    }
  } catch (e) {
    // Foto error, abaikan
    fotoUrl = "Error: " + e.toString();
  }
  
  // Update or insert
  var data = sheet.getDataRange().getValues();
  var updated = false;
  var rowData = [
    Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"), nama, kelas, alamat, ortu, hobi, aktivitas, 
    tidakDisukai, karakter, liburan, mempelajari, instagram, fotoUrl
  ];

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === nama.trim().toLowerCase()) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      updated = true;
      break;
    }
  }
  
  if (!updated) {
    sheet.appendRow(rowData);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    "status": "success",
    "message": "Profil berhasil disimpan!",
    "fotoUrl": fotoUrl
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetProfiles(payload) {
  var ss = getSS();
  var sheet = ss.getSheetByName("Profile"); // Disesuaikan dengan nama sheet Google Form
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "profiles": []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "profiles": []
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var headers = data[0].map(function(h) { return String(h || "").trim(); });
  var tz = ss.getSpreadsheetTimeZone() || "Asia/Jakarta";

  // Deteksi kolom mana saja yang disembunyikan (Hide Column) oleh user di Google Sheets
  var hiddenCols = {};
  for (var colIdx = 0; colIdx < headers.length; colIdx++) {
    try {
      if (sheet.isColumnHiddenByUser(colIdx + 1)) {
        hiddenCols[colIdx] = true;
      }
    } catch (errHide) {}
  }

  function getVal(row, keywords) {
    for (var k = 0; k < keywords.length; k++) {
      var kw = keywords[k].toLowerCase();
      for (var i = 0; i < headers.length; i++) {
        if (hiddenCols[i]) continue; // Abaikan kolom yang di-hide di Google Sheets
        var h = headers[i].toLowerCase();
        if (h.indexOf(kw) !== -1) {
          var val = row[i];
          if (val instanceof Date) {
            return Utilities.formatDate(val, tz, "dd MMMM yyyy");
          }
          return String(val || "").trim();
        }
      }
    }
    return "";
  }

  function getFotoUrl(row) {
    for (var i = 0; i < headers.length; i++) {
      var cellVal = String(row[i] || "").trim();
      if (cellVal.indexOf("drive.google.com") !== -1 || cellVal.indexOf("open?id=") !== -1 || cellVal.indexOf("/file/d/") !== -1) {
        var matchFileD = cellVal.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        var matchId = cellVal.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        var fileId = matchFileD ? matchFileD[1] : (matchId ? matchId[1] : "");
        if (fileId) {
          return "https://drive.google.com/uc?export=view&id=" + fileId;
        }
      }
    }
    return "";
  }

  var profiles = [];
  var scriptProps = PropertiesService.getScriptProperties().getProperties();
  
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    
    var nama = getVal(row, ["Nama Lengkap", "Nama Siswa", "Nama Mentee", "Nama"]);
    var panggilan = getVal(row, ["Nama Panggilan", "Panggilan", "Sapaan", "Nama Sapaan", "Nick", "Akrab"]);
    var kelas = getVal(row, ["Kelas", "Kelompok", "Grup", "Sub Kelas", "Rombel", "Tingkat"]);
    var alamat = getVal(row, ["Alamat Lengkap", "Alamat Rumah", "Alamat Domisili", "Alamat", "Domisili", "Tempat Tinggal", "Alamatnya"]);
    var noHp = getVal(row, ["No HP", "No. HP", "HP", "WhatsApp", "WA", "No Telepon", "Telepon", "No. WA", "Handphone", "Nomor", "Nomor HP", "Nomor WA", "Kontak"]);
    var ortu = getVal(row, ["Orang Tua", "Ortu", "Nama Ortu", "Ayah", "Ibu", "Wali", "Orangtua", "Nama Orang Tua", "Nama Ayah", "Nama Ibu", "Orang Tua / Wali"]);
    var hobi = getVal(row, ["Hobi", "Kegiatan yang disukai", "Kesukaan", "Hobby", "Minat", "Yang disukai"]);
    var aktivitas = getVal(row, ["Aktivitas", "Kegiatan", "Aktivitas Harian", "Kegiatan Sehari-hari", "Kesibukan", "Kegiatan harian"]);
    var tidakDisukai = getVal(row, ["Tidak Disukai", "Benci", "Hal yang tidak disukai", "Paling tidak disukai", "Kurang disukai", "Tidak suka", "Paling tidak suka"]);
    var karakter = getVal(row, ["Karakter", "Sifat", "Karakter yang", "Sifat yang", "Kepribadian", "Karakteristik"]);
    var liburan = getVal(row, ["Liburan", "Saat liburan", "Kegiatan favorit", "Waktu luang", "Favorit saat liburan", "Ketika libur"]);
    var mempelajari = getVal(row, ["Mempelajari", "Ingin Mempelajari", "Tertarik", "Belajar", "Hal yang ingin", "Penasaran", "Ingin dipelajari"]);
    var instagram = getVal(row, ["Instagram", "IG", "Akun IG", "Akun Instagram", "Sosmed", "Media Sosial"]);
    var tanggalLahir = getVal(row, ["Tanggal Lahir", "TGL Lahir", "TTL", "Lahir", "Tgl/Bln/Thn", "Tanggal/Bulan/Tahun", "Tempat dan Tanggal Lahir", "Tempat, Tanggal Lahir", "Tgl Lahir", "Tempat/Tanggal Lahir"]);
    var fotoUrl = getFotoUrl(row);

    var extraFields = [];
    for (var c = 0; c < headers.length; c++) {
      var hName = headers[c];
      var val = row[c];
      var valStr = String(val || "").trim();
      
      var hLower = hName.toLowerCase();
      if (hiddenCols[c] || !hName || hLower === "timestamp" || hLower === "cap waktu" || valStr.indexOf("drive.google.com") !== -1) continue;
      
      if (val instanceof Date) {
        valStr = Utilities.formatDate(val, tz, "dd MMMM yyyy");
      }
      
      if (valStr) {
        extraFields.push({ label: hName, value: valStr });
      }
    }

    var fotoId = "";
    if (fotoUrl) {
      var matchId = fotoUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId) fotoId = matchId[1];
    }
    var rotation = 0;
    if (fotoId && scriptProps["rot_" + fotoId]) {
      rotation = parseInt(scriptProps["rot_" + fotoId]) || 0;
    }

    profiles.push({
      nama: nama,
      panggilan: panggilan,
      kelas: kelas,
      alamat: alamat,
      noHp: noHp,
      ortu: ortu,
      hobi: hobi,
      aktivitas: aktivitas,
      tidakDisukai: tidakDisukai,
      karakter: karakter,
      liburan: liburan,
      mempelajari: mempelajari,
      instagram: instagram,
      tanggalLahir: tanggalLahir,
      fotoUrl: fotoUrl,
      rotation: rotation,
      extraFields: extraFields
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    "status": "success",
    "profiles": profiles
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetImage(payload) {
  var fileId = payload.fileId;
  if (!fileId) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "fileId is required"})).setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    var base64 = Utilities.base64Encode(blob.getBytes());
    var mime = blob.getContentType() || "image/jpeg";
    var dataUri = "data:" + mime + ";base64," + base64;
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "dataUri": dataUri
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": e.message})).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleFixTimestamps() {
  var ss = getSS();
  // 1. Kunci Zona Waktu Spreadsheet ke (GMT+07:00) Asia/Jakarta
  ss.setSpreadsheetTimeZone("Asia/Jakarta");
  
  var totalFixed = 0;
  var sheetsToFix = ["Log Presensi", "Profile", "Form_Responses", "Mentor", "Buku Saku"];
  
  sheetsToFix.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var rawVal = data[i][0]; // Kolom A (Timestamp / Cap Waktu / Waktu Input)
      if (rawVal) {
        var d = new Date(rawVal);
        if (!isNaN(d.getTime())) {
          var formattedStr = Utilities.formatDate(d, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
          sheet.getRange(i + 1, 1).setValue(formattedStr);
          totalFixed++;
        }
      }
    }
  });

  return ContentService.createTextOutput(JSON.stringify({
    "status": "success",
    "message": "Berhasil mengunci Zona Waktu Spreadsheet ke (GMT+07:00) Jakarta dan mengonversi " + totalFixed + " timestamp ke WIB!"
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// FUNGSI SINKRONISASI CHECKLIST PROFILE KELAS (KOLOM K SEMESTER 1)
// ==========================================
function syncProfileChecklist() {
  var ss = getSS();
  var semesterSheet = ss.getSheetByName("Semester 1");
  var profileSheet = ss.getSheetByName("Profile") || ss.getSheetByName("Form_Responses") || ss.getSheetByName("Profil Mentee");
  
  if (!semesterSheet || !profileSheet) {
    return "Sheet Semester 1 atau Profile tidak ditemukan";
  }
  
  var semData = semesterSheet.getDataRange().getValues();
  if (semData.length < 2) return "Data Semester 1 kosong";
  
  var semHeaders = semData[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var namaSemCol = semHeaders.indexOf("nama peserta didik") !== -1 ? semHeaders.indexOf("nama peserta didik") : semHeaders.indexOf("nama");
  var profileSemCol = semHeaders.indexOf("profile");
  
  if (namaSemCol === -1 || profileSemCol === -1) {
    return "Kolom 'Nama peserta didik' atau 'Profile' tidak ditemukan di Semester 1";
  }
  
  var profData = profileSheet.getDataRange().getValues();
  if (profData.length < 2) return "Data Profile belum ada";
  
  var profHeaders = profData[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  var namaProfCol = -1;
  for (var c = 0; c < profHeaders.length; c++) {
    if (profHeaders[c].indexOf("nama") !== -1) {
      namaProfCol = c;
      break;
    }
  }
  if (namaProfCol === -1) namaProfCol = 1;
  
  var filledNames = {};
  for (var r = 1; r < profData.length; r++) {
    var rawName = String(profData[r][namaProfCol] || "").trim().toLowerCase();
    if (rawName) {
      var cleanName = rawName.replace(/[^a-z0-9]/g, "");
      if (cleanName) filledNames[cleanName] = true;
    }
  }
  
  var checklistValues = [];
  var profileRange = semesterSheet.getRange(2, profileSemCol + 1, semData.length - 1, 1);
  
  try {
    profileRange.insertCheckboxes();
  } catch(e) {}
  
  var updatedCount = 0;
  for (var i = 1; i < semData.length; i++) {
    var studentName = String(semData[i][namaSemCol] || "").trim().toLowerCase();
    var cleanStudentName = studentName.replace(/[^a-z0-9]/g, "");
    
    var isFilled = false;
    if (cleanStudentName) {
      for (var fName in filledNames) {
        if (fName === cleanStudentName || fName.indexOf(cleanStudentName) !== -1 || cleanStudentName.indexOf(fName) !== -1) {
          isFilled = true;
          updatedCount++;
          break;
        }
      }
    }
    checklistValues.push([isFilled]);
  }
  
  profileRange.setValues(checklistValues);
  return "Berhasil mencentang " + updatedCount + " siswa yang sudah mengisi profile!";
}

function handleUpdateRotation(payload) {
  var fotoId = payload.fotoId;
  var rotation = payload.rotation;
  
  if (!fotoId) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error",
      "message": "fotoId tidak ditemukan"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    PropertiesService.getScriptProperties().setProperty("rot_" + fotoId, String(rotation));
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "message": "Rotasi berhasil disimpan secara global"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error",
      "message": String(err)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleGetPresensiHistory(payload) {
  var email = payload.mentorEmail;
  var ss = getSS();
  var logSheet = ss.getSheetByName("Log Presensi");
  
  if (!logSheet || !email) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "history": []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var data = logSheet.getDataRange().getValues();
  var history = [];
  
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][3]).toLowerCase().trim() === String(email).toLowerCase().trim()) {
      var waktuRaw = data[i][0];
      var waktuStr = "";
      if (waktuRaw instanceof Date) {
        waktuStr = Utilities.formatDate(waktuRaw, "Asia/Jakarta", "dd MMM yyyy, HH:mm");
      } else {
        waktuStr = String(waktuRaw);
      }
      
      history.push({
        waktuInput: waktuStr,
        tanggalMentoring: String(data[i][1]),
        pertemuan: String(data[i][4]),
        jumlahHadir: String(data[i][5]),
        daftarHadir: String(data[i][6]),
        jumlahIzin: String(data[i][7]),
        daftarIzin: String(data[i][8])
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    "status": "success",
    "history": history
  })).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// FUNGSI GET MATERI
// ==========================================
function handleGetMateri() {
  var ss = getSS();
  var sheet = ss.getSheetByName("Materi");
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "data": []
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var data = sheet.getDataRange().getValues();
  var result = [];
  
  // Skip baris pertama (header)
  for (var i = 1; i < data.length; i++) {
    var nama = data[i][0];
    var link = data[i][1];
    if (nama && link) {
      result.push({nama: String(nama).trim(), link: String(link).trim()});
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    "status": "success",
    "data": result
  })).setMimeType(ContentService.MimeType.JSON);
}
