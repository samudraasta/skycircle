import pandas as pd

file_path = "./# Presensi SCC/SMAVO ANGKATAN 33 +SUPERMENTORING (2025-2026).xlsx"
try:
    xl = pd.ExcelFile(file_path)
    for sheet in ['BOY Circle 33', 'GIRL Circle 33']:
        df = xl.parse(sheet, nrows=5)
        print(f"\n--- Columns in {sheet} ---")
        print(df.columns.tolist())
        print(df.head(2))
except Exception as e:
    print("Error:", e)
