import os
import csv

CSV_PATH = r"c:\Users\sagar\Downloads\Train_details_22122017.csv"

def test():
    print(f"Checking path: {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        print("FAIL: Path does not exist")
        return
    
    print("SUCCESS: Path exists. Reading first row...")
    try:
        with open(CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            row = next(reader)
            print(f"First row: {row}")
    except Exception as e:
        print(f"FAIL: Error reading file: {e}")

if __name__ == "__main__":
    test()
