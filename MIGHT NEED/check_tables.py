import os
import psycopg2
from dotenv import load_dotenv

def check_tables():
    load_dotenv()
    url = os.getenv("DATABASE_URL")
    if not url:
        print("DATABASE_URL not found")
        return
    url = url.strip().strip('"').strip("'")
    
    try:
        conn = psycopg2.connect(url)
        cur = conn.cursor()
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        tables = cur.fetchall()
        print("Existing tables:", [t[0] for t in tables])
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_tables()
