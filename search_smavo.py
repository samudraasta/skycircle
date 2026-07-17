import pandas as pd

smavo_file = "./# Presensi SCC/SMAVO ANGKATAN 33 +SUPERMENTORING (2025-2026).xlsx"
df_smavo = pd.read_excel(smavo_file, sheet_name='Angkatan 33', header=1)

print("Searching for Muhammad Rizzieq:")
print(df_smavo[df_smavo['NAMA'].astype(str).str.contains('Rizzieq', case=False, na=False)])

print("\nSearching for Achmad Firza:")
print(df_smavo[df_smavo['NAMA'].astype(str).str.contains('Firza', case=False, na=False)])

print("\nSearching for Farhan:")
print(df_smavo[df_smavo['NAMA'].astype(str).str.contains('Farhan', case=False, na=False)])
