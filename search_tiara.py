import pandas as pd
import glob

print("Searching in Excel files...")
for f in glob.glob("*.xlsx"):
    try:
        df = pd.read_excel(f, sheet_name=None)
        for sheet_name, sheet_df in df.items():
            # Search all cells for Tiara Talitha
            mask = sheet_df.apply(lambda x: x.astype(str).str.contains("Tiara", case=False, na=False)).any(axis=1)
            results = sheet_df[mask]
            if not results.empty:
                print(f"Found in {f} - Sheet: {sheet_name}")
                print(results)
    except Exception as e:
        print(f"Error reading {f}: {e}")

print("Searching in CSV files...")
for f in glob.glob("*.csv"):
    try:
        df = pd.read_csv(f)
        mask = df.apply(lambda x: x.astype(str).str.contains("Tiara", case=False, na=False)).any(axis=1)
        results = df[mask]
        if not results.empty:
            print(f"Found in {f}")
            print(results)
    except Exception as e:
        print(f"Error reading {f}: {e}")
