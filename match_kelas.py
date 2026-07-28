import pandas as pd
import re

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
# Some columns might have spaces, let's just find the name and class column.
# Assuming column index 3 is 'Nama peserta didik' and column index 5 is 'Kelas' or something.
# Let's just print columns first to be safe, or just find it by string matching.

name_col = [c for c in df.columns if 'nama' in str(c).lower()][0]
class_col = [c for c in df.columns if 'kelas' in str(c).lower()][0]

db = df[[name_col, class_col]].dropna()

def find_class(name):
    # clean name
    name_clean = re.sub(r'[^a-zA-Z\s]', '', name).strip().lower()
    
    # Try exact match first
    for _, row in db.iterrows():
        db_name = str(row[name_col]).lower().strip()
        if db_name == name_clean:
            return str(row[class_col])
    
    # Try partial match (if user provided short name)
    # If the user name is in the db name
    for _, row in db.iterrows():
        db_name = str(row[name_col]).lower().strip()
        if name_clean in db_name:
            return str(row[class_col])
            
    # Try reverse partial match (if db name is in user name)
    for _, row in db.iterrows():
        db_name = str(row[name_col]).lower().strip()
        # use tokens
        user_tokens = set(name_clean.split())
        db_tokens = set(db_name.split())
        if len(user_tokens.intersection(db_tokens)) >= 2:
            return str(row[class_col])
            
    # Special fix for Tiara Talitha -> Tiara Thalita
    if "tiara" in name_clean and "talitha" in name_clean:
        return "XI-?" # we will find it

    return "Kelas Tidak Ditemukan"

output_lines = []
for line in text.split('\n'):
    if line.strip().startswith('-'):
        # extract name
        name = line.replace('-', '').strip()
        c = find_class(name)
        output_lines.append(f"{line.strip()} ({c})")
    else:
        output_lines.append(line)

print("\n".join(output_lines))
