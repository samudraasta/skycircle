import pandas as pd

try:
    # Read generated output
    df = pd.read_excel("Rekap_Presensi_SCC_X_XI_XII.xlsx")
    df_33 = df[df['Angkatan'] == 33]
    missing_df = df_33[df_33['nama mentor'].isna() | (df_33['nama mentor'] == '')]
    
    print(f"Total students with missing mentors: {len(missing_df)}")
    print("Sample of missing students:")
    print(missing_df[['NISN', 'Nama peserta didik']].head(10))
    
    # Check if these missing students are in SMAVO file at all
    smavo_file = "./# Presensi SCC/SMAVO ANGKATAN 33 +SUPERMENTORING (2025-2026).xlsx"
    df_smavo = pd.read_excel(smavo_file, sheet_name='Angkatan 33', header=1, dtype={'NISN': str})
    
    # Are the missing NISNs in the smavo file but under a different column, or completely absent?
    missing_nisns = missing_df['NISN'].astype(str).tolist()
    
    found_in_smavo = df_smavo[df_smavo['NISN'].astype(str).isin(missing_nisns)]
    print("\nDid we find any of these missing NISNs in the SMAVO file anyway?")
    print(found_in_smavo[['NISN', 'Grup', 'Mentor']].head())
    
    # What if we search by name?
    missing_names = missing_df['Nama peserta didik'].tolist()
    # Assume SMAVO has a Name column? Let's check SMAVO columns
    print("\nSMAVO columns:", df_smavo.columns.tolist())
    
except Exception as e:
    print("Error:", e)
