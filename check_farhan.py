import pandas as pd

try:
    df = pd.read_excel("Rekap_Presensi_SCC_X_XI_XII.xlsx")
    df_33 = df[df['Angkatan'] == 33]
    missing_df = df_33[df_33['nama mentor'].isna() | (df_33['nama mentor'] == '')]
    farhan = missing_df[missing_df['Nama peserta didik'].str.contains('Farhan', na=False, case=False)]
    print(farhan[['NISN', 'Nama peserta didik']])
except Exception as e:
    print("Error:", e)
