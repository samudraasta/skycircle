import pandas as pd
from generate_rekap_excel import is_nonis

input_file = "./# Presensi SCC/1. Presensi SCC.xlsx"
df_master = pd.read_excel(input_file, sheet_name='Database Presensi SCC')

for index, row in df_master.iterrows():
    nama_mentah = str(row.get('NAMA', ''))
    nama_bersih = nama_mentah.split(' - ')[0] if ' - ' in nama_mentah else nama_mentah
    if "Azalia Maheswari Christabel" in nama_bersih:
        kelompok = row.get('Grup TA', '')
        mentor = row.get('Mentor TA', '')
        angkatan = row.get('ANGKATAN', '')
        
        print(f"Name: {nama_bersih}")
        print(f"Original Kelompok: '{kelompok}', isna: {pd.isna(kelompok)}")
        print(f"Original Mentor: '{mentor}', isna: {pd.isna(mentor)}")
        print(f"is_nonis: {is_nonis(nama_bersih)}")
        
        if (pd.isna(kelompok) or kelompok == "") and (pd.isna(mentor) or mentor == ""):
            print("Condition met: Kelompok and Mentor are empty")
        else:
            print("Condition failed: Kelompok and Mentor are NOT empty")
