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
    
    // NEW ACTIONS UNTUK SISTEM PRESENSI BARU
    if (payload.action === "check_mentor") {
      return handleCheckMentor(payload);
    }
    if (payload.action === "register_mentor") {
      return handleRegisterMentor(payload);
    }
    if (payload.action === "get_students") {
      return handleGetStudents(payload);
    }
    if (payload.action === "submit_presensi") {
      return handleSubmitPresensi(payload);
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
  var sheetName = payload.sheetName || "Rekap Presensi";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "History Chat";
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(["Timestamp", "Email", "Role", "Message"]);
    sheet.getRange("A1:D1").setFontWeight("bold").setBackground("#e6f2eb");
  }
  
  sheet.appendRow([new Date(), email, role, message]);
}

function handleGetHistory(payload) {
  var email = payload.mentorEmail;
  if (!email) throw new Error("Email tidak ditemukan");

  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
  var dataRekap = ss.getSheetByName("Rekap Presensi");
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
  var sheet = ss.getSheetByName("Rekap Presensi");
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Rekap Presensi");
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
    new Date()
  ]);
  return ContentService.createTextOutput(JSON.stringify({"status": "success"})).setMimeType(ContentService.MimeType.JSON);
}

function handleGetStudents(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Rekap Presensi");
  if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
         "status": "error",
         "message": "Sheet Rekap Presensi tidak ditemukan"
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
  for (var r = 1; r < data.length; r++) {
    var studentName = String(data[r][namaIndex - 1]).toLowerCase().trim();
    
    // Cek apakah anak ini ada di daftar hadirList
    var isHadir = false;
    for(var h = 0; h < hadirList.length; h++) {
       var submittedName = String(hadirList[h]).toLowerCase().trim();
       if (studentName === submittedName) {
           isHadir = true;
           break;
       }
    }
    
    // Opsional: Batasi hanya yang satu mentor, tapi karena UI Presensi baru menggunakan Autocomplete nama anak spesifik dari daftar, kita bisa langsung timpa statusnya.
    if (isHadir) {
       sheet.getRange(r + 1, colIndex).setValue("Hadir");
       updatedCount++;
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
     "status": "success",
     "message": updatedCount + " siswa berhasil dicatat hadir untuk Pertemuan " + pertemuanNum + "!"
  })).setMimeType(ContentService.MimeType.JSON);
}
