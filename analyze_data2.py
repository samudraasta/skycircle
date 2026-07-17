import pandas as pd
import numpy as np

file_path = "./# Presensi SCC/1. Presensi SCC.xlsx"
try:
    xl = pd.ExcelFile(file_path)
    
    print("--- Database Presensi SCC ---")
    df_master = xl.parse('Database Presensi SCC')
    print("Master columns:", df_master.columns.tolist())
    print("Sample Master row:", df_master.iloc[0].to_dict())
    
    print("\n--- Form Presensi SCC ---")
    df_form = xl.parse('Form Presensi SCC')
    print("Form columns:", df_form.columns.tolist())
    print("Sample Form row:", df_form.iloc[0].to_dict())
    print("Unique Status:", df_form['Status'].unique() if 'Status' in df_form.columns else "No Status column")
    print("Unique Pertemuan Grup:", df_form['Pertemuan Grup'].unique() if 'Pertemuan Grup' in df_form.columns else "No Pertemuan Grup column")
except Exception as e:
    print("Error:", e)
