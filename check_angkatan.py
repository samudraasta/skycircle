import pandas as pd

file_path = "./# Presensi SCC/1. Presensi SCC.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    df_master = xl.parse('Database Presensi SCC')
    print("Unique Angkatan in Database Presensi SCC:", df_master['ANGKATAN'].unique())
    print("Count per Angkatan:\n", df_master['ANGKATAN'].value_counts(dropna=False))
except Exception as e:
    print("Error:", e)
