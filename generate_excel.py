import pandas as pd
import re
import difflib

text = """IKHWAN
Angkatan 33
Mentor Rekhsa:
- Keyno Nazmi Afham
- Muhammad Tsafiq Ihsan
- Muhamad Ilham Akbar
- Daffa Khoirul Fajri
- M. Adrian Gianni Adam
Mentor Teguh:
- Bima Anggareksa Yusiansyah
- Farid Pradana
- Kaysan Umar Azka Setiawan
- Luqman Aziz Saputro
- Mirza Maulana Altamis
- Muhammad Yafiargi Simbangando

Angkatan 32 (Mentor Randy):
- Rifqi Hadzami
- Fariz Duta
- Rifqi Putra
- Rifky Akbar
- Samy Abdurrahman Romdhony
- Zhafran Ramadhan Drajat Sukma
- Muhammad Daffa Sugianto
- Muhammad Shafa
- M. Royyan

AKHWAT
Angkatan 33
Mentor Ayun:
- Naila
- Bilqis Anwar Thebe
- Rayhana Rizkya Al-Multazam
- Rifqah Ramadhani
- Isnaini Fauziyah Utomo. 
Mentor Ulfi:
- Balqis Jauza Sabreenijka
- Jazirah Rahmah
- Shabira Ayatul Husna
Mentor Iga:
- Dinda Aulia
- Fakhi Zulfia Bilqis
- Karunia Dwi Rahmawati
- Dwi Irmawati
- Masayu Ganisha Pambayun Putri
- Dwi Nailah Azhara. 
- Dilla Novianti Putri. 
- Syakira Alma Annisa. 

Angkatan 32
Mentor Ukhti:
- Faliqa Haq Hasanah
- Lexa El Sohbia
- Arsyila Kayyisah B
- Anindya Zhafira Sani. 
- Zhafira Fathin Ilmira
- Desya Maulida
- Sabika Zaura Khumairo
- Zaina Husniyati Hamdani
- Khaira Rabbani Tsalasa
- Annisa Nur Fajriya
- Syaikhah Anbar
- Tiara Talitha. 
Mentor Lisa / Ka Eka:
- Bumi Raffah Al Islahi
- Almira Dian Pratiwi
- Nadine Kirana Saraswati
- Vindy Aprilia Khanaya
- Fiona Wahidah Salsabila
- Oshe Bilqis Nadhifah."""

df = pd.read_excel('Rekap_Presensi_SCC_X_XI_XII.xlsx', sheet_name='Sheet1')
name_col = 'Nama peserta didik'
class_col = 'Kelas'
angkatan_col = 'Angkatan'

db = df[[name_col, class_col, angkatan_col]].dropna()
all_db_names = db[name_col].astype(str).tolist()

def clean(s):
    return re.sub(r'[^a-zA-Z0-9\s]', '', s).strip().lower()

def find_class(user_name):
    c_user = clean(user_name)
    
    # 1. Exact match
    for _, row in db.iterrows():
        if clean(str(row[name_col])) == c_user:
            return row[class_col], row[angkatan_col]
            
    # 2. Substring match
    for _, row in db.iterrows():
        c_db = clean(str(row[name_col]))
        if c_user in c_db:
            return row[class_col], row[angkatan_col]
            
    # 3. Fuzzy match
    matches = difflib.get_close_matches(c_user, [clean(n) for n in all_db_names], n=1, cutoff=0.7)
    if matches:
        for _, row in db.iterrows():
            if clean(str(row[name_col])) == matches[0]:
                return row[class_col], row[angkatan_col]
                
    return "Tidak Ditemukan", ""

data = []
current_gender = ""
current_angkatan = ""
current_mentor = ""

for line in text.split('\n'):
    line = line.strip()
    if not line: continue
    
    if line in ["IKHWAN", "AKHWAT"]:
        current_gender = line
    elif line.startswith("Angkatan"):
        current_angkatan = line
    elif line.startswith("Mentor"):
        current_mentor = line
    elif line.startswith("-"):
        name = line.replace('-', '').strip()
        kelas, angkatan = find_class(name)
        data.append({
            "Gender": current_gender,
            "Kategori": current_angkatan,
            "Mentor": current_mentor,
            "Nama Mentee": name,
            "Kelas": kelas,
            "Angkatan DB": angkatan
        })

out_df = pd.DataFrame(data)
out_df.to_excel('Daftar_Mentee_Berdasarkan_Kelas.xlsx', index=False)
print("File Daftar_Mentee_Berdasarkan_Kelas.xlsx berhasil dibuat!")
