import pandas as pd

file_path = "./# Presensi SCC/1. Presensi SCC.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    
    for sheet in ['Form Presensi SCC', 'Database Presensi SCC_Lama']:
        if sheet in xl.sheet_names:
            print(f"\n--- Columns in {sheet} ---")
            df = xl.parse(sheet, nrows=5)
            print(list(df.columns))
            print(df.head(2))
except Exception as e:
    print("Error:", e)
