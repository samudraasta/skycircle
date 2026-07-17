import pandas as pd

try:
    df = pd.read_excel("Rekap_Presensi_SCC_X_XI_XII.xlsx")
    
    print("--- Farhan Benzema ---")
    farhan = df[df['Nama peserta didik'].str.contains('Farhan Benzema', na=False, case=False)]
    print(farhan[['NISN', 'Nama peserta didik', 'Kelompok', 'nama mentor', 'Keterangan']])
    
    print("\n--- Sample Girls (Muslim, Auto-Assigned) ---")
    girls_auto = df[(df['L/P'] == 'P') & (df['Keterangan'].isna() | (df['Keterangan'] == '')) & (df['Kelompok'].str.startswith('GC'))]
    print(girls_auto[['NISN', 'Nama peserta didik', 'Kelompok', 'nama mentor']].head(10))
    
    print("\n--- Sample Nonis ---")
    nonis = df[df['Keterangan'] == 'Nonis']
    print(nonis[['NISN', 'Nama peserta didik', 'Kelompok', 'nama mentor', 'Keterangan']].head(5))

    print(f"\nTotal students missing groups: {df['Kelompok'].isna().sum() + (df['Kelompok'] == '').sum()}")
except Exception as e:
    print("Error:", e)
