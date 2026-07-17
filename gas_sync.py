import requests
import json

APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxxBNmpogyqo1iEYy3j6mZld6lmc6PPb5sde67cjQKsKEfinbIPojU2WRN0_Mf4Bhd8rQ/exec"

def send_to_google_sheets(records, color_series, sheet_name="Rekap Presensi"):
    """
    Mengubah array of dict (records) menjadi 2D array dan menembakkannya ke GAS.
    """
    if not records:
        print("Tidak ada data untuk dikirim.")
        return

    print("Menyiapkan payload data untuk Google Sheets...")
    
    # 1. Siapkan Headers
    headers = list(records[0].keys())
    
    # 2. Siapkan 2D Data Array
    data_2d = [headers]
    for row in records:
        data_2d.append([row.get(col, "") for col in headers])
        
    # 3. Siapkan 2D Backgrounds Array
    # Baris header tidak diberi warna (null) agar tidak bentrok dengan Tabel
    backgrounds_2d = [[None] * len(headers)]
    
    # Looping warna sesuai index records
    for cell_warna in color_series:
        if cell_warna == "merah":
            bg_color = "#FFD1DC"
        elif cell_warna == "hijau":
            bg_color = "#D1FFD1"
        else:
            bg_color = None
        # Buat warna yang sama untuk seluruh sel di baris tersebut
        backgrounds_2d.append([bg_color] * len(headers))
        
    payload = {
        "action": "sync",
        "sheetName": sheet_name,
        "data": data_2d,
        "backgrounds": backgrounds_2d
    }
    
    print(f"Mengirim {len(data_2d)-1} baris data ke Google Sheets...")
    try:
        response = requests.post(APPS_SCRIPT_URL, json=payload, verify=False) # Bypass SSL issue if any
        result = response.json()
        if result.get('status') == 'success':
            print("✅ Sukses terkirim ke Google Sheets:", result.get('message'))
        else:
            print("❌ Gagal mengirim:", result.get('message'))
    except Exception as e:
        print("❌ Error saat menghubungi Google Sheets API:", e)
