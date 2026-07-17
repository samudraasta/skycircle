import pandas as pd

try:
    df = pd.read_excel("Rekap_Presensi_SCC_X_XI_XII.xlsx")
    df_33 = df[df['Angkatan'] == 33]
    mentor_filled = df_33['nama mentor'].notna().sum()
    grup_filled = df_33['Kelompok'].notna().sum()
    print(f"Total Angkatan 33: {len(df_33)}")
    print(f"Mentors filled: {mentor_filled}")
    print(f"Groups filled: {grup_filled}")
    print(df_33[['NISN', 'Nama peserta didik', 'Kelompok', 'nama mentor']].head(5))
except Exception as e:
    print("Error:", e)
