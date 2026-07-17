import pandas as pd

file_path = "./# Presensi SCC/1. Presensi SCC.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    print("Sheets in 1. Presensi SCC:", xl.sheet_names)
    df = xl.parse(xl.sheet_names[0], nrows=5)
    print(df.head())
except Exception as e:
    print("Error:", e)
