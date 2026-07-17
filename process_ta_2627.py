import pandas as pd
import json
import urllib.request
import os

def process_and_sync():
    files = {
        "34": ("/Users/samudra/Downloads/KLS X 2026-2027_OK.xlsx", 6),
        "33": ("/Users/samudra/Downloads/KLS XI 2026-2027_OK.xlsx", 6),
        "32": ("/Users/samudra/Downloads/KLS XII 2026-2027_OK.xlsx", 6)
    }

    # Load previous year data for Kelompok lookup
    old_file_path = "/Users/samudra/OneDrive - Forum Zakat/Downloads/Sky Circle/Rekap_Presensi_SCC_X_XI_XII.xlsx"
    lookup = {}
    try:
        old_df = pd.read_excel(old_file_path)
        for _, row in old_df.iterrows():
            nisn = str(row.get('NISN', '')).strip()
            nama = str(row.get('Nama peserta didik', '')).strip().lower()
            kelompok = str(row.get('Kelompok', '')).strip()
            mentor = str(row.get('nama mentor', '')).strip()
            keterangan = str(row.get('Keterangan', '')).strip()
            
            if kelompok.lower() == 'nan': kelompok = ""
            if mentor.lower() == 'nan': mentor = ""
            if keterangan.lower() == 'nan': keterangan = ""
            
            if kelompok or keterangan:
                if nisn and nisn != 'nan':
                    lookup[nisn] = (kelompok, mentor, keterangan)
                if nama and nama != 'nan':
                    lookup[nama] = (kelompok, mentor, keterangan)
    except Exception as e:
        print(f"Warning: Could not load old data for lookup: {e}")

    all_records = []
    
    for angkatan, (file_path, header_row) in files.items():
        print(f"Reading {file_path}...")
        try:
            xl = pd.ExcelFile(file_path)
            for sheet_name in xl.sheet_names:
                if 'REKAP' in sheet_name.upper() or 'SHEET' in sheet_name.upper():
                    continue
                    
                df = xl.parse(sheet_name, skiprows=header_row)
                df = df.dropna(how='all') # Drop empty rows
                
                for index, row in df.iterrows():
                    # Extract Nama (handle 'NAMA ' with trailing space)
                    nama = ""
                    if 'NAMA' in row: nama = str(row['NAMA'])
                    elif 'NAMA ' in row: nama = str(row['NAMA '])
                    
                    nama = nama.strip()
                    if not nama or nama == 'nan':
                        continue
                    
                    # Filter out summary rows mistakenly read as names
                    nama_lower = nama.lower()
                    if 'laki' in nama_lower or 'perempuan' in nama_lower or 'total' in nama_lower or 'jumlah' in nama_lower:
                        continue
                    
                    # Extract L/P
                    lp = ""
                    if 'P/L' in row: lp = str(row['P/L']).strip()
                    elif 'L / P' in row: lp = str(row['L / P']).strip()
                    
                    if lp.lower() == 'nan': lp = ""
                    
                    # Helper function to clean numeric IDs
                    def clean_id(val):
                        s = str(val).strip()
                        if s.lower() == 'nan': return ""
                        if s.endswith('.0'): return s[:-2]
                        return s

                    # Extract NISN and NIS
                    nisn = ""
                    nis = ""
                    if 'NISN' in row and 'NIS' in row:
                        nisn = clean_id(row['NISN'])
                        nis = clean_id(row['NIS'])
                    elif 'NISN / NIS' in row:
                        nisn_nis = str(row['NISN / NIS'])
                        if '/' in nisn_nis:
                            parts = nisn_nis.split('/')
                            nisn = clean_id(parts[0])
                            nis = clean_id(parts[1])
                        else:
                            nisn = clean_id(nisn_nis)
                    
                    # Lookup Kelompok, Mentor, and Keterangan
                    kelompok = ""
                    mentor = ""
                    keterangan = ""
                    if nisn in lookup:
                        kelompok, mentor, keterangan = lookup[nisn]
                    elif nama_lower in lookup:
                        kelompok, mentor, keterangan = lookup[nama_lower]
                        
                    warna = ""
                    if 'nonis' in keterangan.lower():
                        warna = "merah"
                    
                    all_records.append({
                        "No": len(all_records) + 1,
                        "NISN": nisn,
                        "NIS": nis,
                        "Nama peserta didik": nama,
                        "L/P": lp,
                        "total pertemuan": 24,
                        "total kehadiran": "",
                        "% kehadiran": "",
                        "nilai rapor": "",
                        "Keterangan": keterangan,
                        "Warna": warna,
                        "Angkatan": angkatan,
                        "Kelas": sheet_name,
                        "Kelompok": kelompok,
                        "nama mentor": mentor,
                        "P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "",
                        "P9": "", "P10": "", "P11": "", "P12": "", "P13": "", "P14": "", "P15": "", "P16": "",
                        "P17": "", "P18": "", "P19": "", "P20": "", "P21": "", "P22": "", "P23": "", "P24": ""
                    })
        except Exception as e:
            print(f"Error reading {angkatan}: {e}")

    df_final = pd.DataFrame(all_records)
    print(f"Total students processed: {len(df_final)}")
    
    # Push to Apps Script
    APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxBNmpogyqo1iEYy3j6mZld6lmc6PPb5sde67cjQKsKEfinbIPojU2WRN0_Mf4Bhd8rQ/exec'
    
    data = [df_final.columns.values.tolist()] + df_final.values.tolist()
    
    # Create backgrounds array
    cols = len(df_final.columns)
    backgrounds = [["#f3f3f3"] * cols] # Header
    
    for _, row in df_final.iterrows():
        if "nonis" in str(row.get('Keterangan', '')).lower():
            backgrounds.append(["#ffcccc"] * cols)
        else:
            backgrounds.append(["#ffffff"] * cols)
    
    payload = {
        "action": "sync",
        "sheetName": "Rekap Presensi",
        "data": data,
        "backgrounds": backgrounds
    }
    
    req = urllib.request.Request(APPS_SCRIPT_URL, method="POST")
    req.add_header('Content-Type', 'application/json')
    jsondata = json.dumps(payload).encode('utf-8')
    
    print("Uploading to Google Sheets...")
    try:
        response = urllib.request.urlopen(req, jsondata)
        res_body = response.read().decode('utf-8')
        print(f"Server response: {res_body}")
    except Exception as e:
        print(f"Upload failed: {e}")

if __name__ == "__main__":
    process_and_sync()
