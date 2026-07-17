import pandas as pd

input_file = "./# Presensi SCC/1. Presensi SCC.xlsx"
df_master = pd.read_excel(input_file, sheet_name='Database Presensi SCC')

for index, row in df_master.iterrows():
    angkatan = row.get('ANGKATAN', '')
    print(f"First row angkatan: {repr(angkatan)}, type: {type(angkatan)}, str: {repr(str(angkatan))}")
    break
