import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def check():
    url = os.getenv("DATABASE_URL").strip().strip('"').strip("'")
    if 'sslmode=' not in url:
        url += ('&' if '?' in url else '?') + 'sslmode=require'
    
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    try:
        cur.execute("SELECT count(*) FROM train_schedules")
        print(f"Total Schedules: {cur.fetchone()[0]}")
        cur.execute("SELECT count(*) FROM trains")
        print(f"Total Trains: {cur.fetchone()[0]}")
        cur.execute("SELECT count(*) FROM stations")
        print(f"Total Stations: {cur.fetchone()[0]}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    check()
