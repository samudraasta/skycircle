import pandas as pd

smavo_file = "./# Presensi SCC/SMAVO ANGKATAN 33 +SUPERMENTORING (2025-2026).xlsx"

print("--- Header=0 ---")
df0 = pd.read_excel(smavo_file, sheet_name='Angkatan 33', header=0)
print(df0.head(3))
print("Columns:", df0.columns.tolist())

print("\n--- Header=1 ---")
df1 = pd.read_excel(smavo_file, sheet_name='Angkatan 33', header=1)
print(df1.head(3))
print("Columns:", df1.columns.tolist())

print("\n--- No Header ---")
df_none = pd.read_excel(smavo_file, sheet_name='Angkatan 33', header=None)
print(df_none.head(3))
