import os
import psycopg2
from dotenv import load_dotenv

def prove_data():
    load_dotenv()
    url = os.getenv("DATABASE_URL").strip().replace('"', '').replace("'", "")
    if 'sslmode=' not in url:
        url += ('&' if '?' in url else '?') + 'sslmode=require'
    
    try:
        conn = psycopg2.connect(url)
        cur = conn.cursor()
        
        print("--- DATABASE SNAPSHOT (SUPABASE) ---")
        
        # Check Stations
        cur.execute("SELECT station_code, station_name FROM stations LIMIT 5")
        rows = cur.fetchall()
        print(f"Sample Stations: {rows}")
        
        # Check Trains
        cur.execute("SELECT train_number, train_name FROM trains LIMIT 5")
        rows = cur.fetchall()
        print(f"Sample Trains: {rows}")
        
        # Check counts again
        cur.execute("SELECT COUNT(*) FROM stations")
        s_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM trains")
        t_count = cur.fetchone()[0]
        print(f"Total Counts -> Stations: {s_count}, Trains: {t_count}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    prove_data()
