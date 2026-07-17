import pandas as pd
from generate_rekap_excel import is_nonis, MASTER_MENTOR

input_file = "./# Presensi SCC/1. Presensi SCC.xlsx"
df_master = pd.read_excel(input_file, sheet_name='Database Presensi SCC')

for index, row in df_master.iterrows():
    nama_mentah = str(row.get('NAMA', ''))
    if "Farhan" in nama_mentah:
        print("Tracing", nama_mentah)
        nama_bersih = nama_mentah.split(' - ')[0] if ' - ' in nama_mentah else nama_mentah
        angkatan = row.get('ANGKATAN', '')
        kelas = row.get('KELAS TA', '')
        kelompok = row.get('Grup TA', '')
        mentor = row.get('Mentor TA', '')
        lp = row.get('L/P', '')
        
        print(f"lp: '{lp}'")
        if str(angkatan) == '33':
            kelas_str = str(kelas).strip()
            kelas_fmt = kelas_str.replace('X', 'X-') if kelas_str.startswith('X') and '-' not in kelas_str else kelas_str
            print("kelas_fmt:", kelas_fmt)
            
            print("is_nonis:", is_nonis(nama_bersih))
            if (pd.isna(kelompok) or kelompok == "") and not is_nonis(nama_bersih):
                if str(lp).strip().upper() == 'L':
                    kelompok = f"BC {kelas_fmt}"
                    print("Assigned to BC:", kelompok)
                elif str(lp).strip().upper() == 'P':
                    print("Assigned to GC")
                
                if kelompok in MASTER_MENTOR:
                    mentor = MASTER_MENTOR[kelompok]
                    print("Assigned mentor:", mentor)
            
            print("Final kelompok:", kelompok)
            print("Final mentor:", mentor)
