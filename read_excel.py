import sys
import pandas as pd

file_path = "./# Presensi SCC/3. Laporan Presensi SCC/TA 25-26/NIL SEM_1_2526_X_XI_XII_SCC.xlsx"

try:
    xl = pd.ExcelFile(file_path)
    print("Sheets:", xl.sheet_names)
    
    for sheet in xl.sheet_names:
        print(f"\n--- Sheet: {sheet} ---")
        df = xl.parse(sheet, nrows=10)
        print(df.head(10))
except Exception as e:
    print("Error:", e)
    # If pandas fails, maybe try openpyxl directly
