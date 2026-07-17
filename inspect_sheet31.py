import pandas as pd

file_path = "./# Presensi SCC/1. Presensi SCC.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    print("--- Data Siswa Mentah 31 ---")
    df = xl.parse('Data Siswa Mentah 31', header=None, nrows=20)
    print(df)
    
    if 'Data Siswa Mentah 31 (Cleaning)' in xl.sheet_names:
        print("\n--- Data Siswa Mentah 31 (Cleaning) ---")
        df2 = xl.parse('Data Siswa Mentah 31 (Cleaning)', header=None, nrows=20)
        print(df2)
except Exception as e:
    print("Error:", e)
