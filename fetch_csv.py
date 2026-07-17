import pandas as pd
import requests
import io

url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRibQEXjZYDjjmc2nVR17Jug6xKpkE0aSiA6uFpfzcLe6s2fxko9cD4b1EfhkS_Pp33QD4oqpZM6_aw/pub?output=csv"
try:
    response = requests.get(url, verify=False)
    df = pd.read_csv(io.StringIO(response.text))
    print("Columns:", df.columns.tolist())
    print("Shape:", df.shape)
    print(df.head(3))
except Exception as e:
    print("Error:", e)
