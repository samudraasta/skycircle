import pandas as pd

file_path = "./# Presensi SCC/1. Presensi SCC.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    if 'Data Siswa Mentah 31 (Cleaning)' in xl.sheet_names:
        df = xl.parse('Data Siswa Mentah 31 (Cleaning)', nrows=5)
        print("Columns:", df.columns.tolist())
        print(df.head(2))
    else:
        print("Sheet not found")
except Exception as e:
    print("Error:", e)
