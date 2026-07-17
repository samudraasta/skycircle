import pandas as pd

file_path = "./# Presensi SCC/3. Laporan Presensi SCC/TA 25-26/NIL SEM_1_2526_X_XI_XII_SCC.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    df_rekap = xl.parse('Rekap', skiprows=2, nrows=10) # skipping header rows maybe?
    print(df_rekap.head(10))
except Exception as e:
    print("Error:", e)
