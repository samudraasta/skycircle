import pandas as pd

file_path = "./# Presensi SCC/1. Presensi SCC.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    df2 = xl.parse('Data Siswa Mentah 31 (Cleaning)', header=None, nrows=20)
    print("Columns:", df2.columns.tolist())
    print(df2.head(15))
except Exception as e:
    print("Error:", e)
