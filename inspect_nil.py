import pandas as pd

file_path = "./# Presensi SCC/3. Laporan Presensi SCC/TA 25-26/NIL SEM_1_2526_X_XI_XII_SCC.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    df = xl.parse('Nama Kelas X (31)', nrows=5)
    print("Columns in Nama Kelas X (31):", df.columns.tolist())
    print(df.head(2))
    
    df_rekap = xl.parse('Rekap', nrows=5)
    print("\nColumns in Rekap:", df_rekap.columns.tolist())
except Exception as e:
    print("Error:", e)
