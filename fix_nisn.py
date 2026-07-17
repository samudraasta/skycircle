import pandas as pd

file_name = 'Rekap_Presensi_SCC_X_XI_XII.xlsx'

print("Membaca file Excel...")
df = pd.read_excel(file_name)

# Asumsikan kolom NISN ada di index 1 (kolom ke-2)
nisn_col = df.columns[1]

print(f"Memproses kolom: {nisn_col}")

# Jadikan semua string
df[nisn_col] = df[nisn_col].astype(str)

# Hapus spasi kosong atau .0 di akhir kalau ada
df[nisn_col] = df[nisn_col].str.strip()
df[nisn_col] = df[nisn_col].str.replace('\.0$', '', regex=True)

# Tambahkan angka 0 di depan untuk yang kurang dari 10 digit
df[nisn_col] = df[nisn_col].apply(lambda x: x.zfill(10) if x != 'nan' and len(x) > 0 else x)

print("Menyimpan kembali ke Excel...")
df.to_excel(file_name, index=False)
print("Selesai! File berhasil diperbarui.")
