import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def inspect():
    url = DATABASE_URL.strip().strip('"').strip("'")
    if 'sslmode=' not in url:
        url += ('&' if '?' in url else '?') + 'sslmode=require'
    
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    try:
        print("Fetching constraints for train_schedules...")
        cur.execute("""
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = 'train_schedules'::regclass;
        """)
        for row in cur.fetchall():
            print(f"Constraint: {row[0]} -> {row[1]}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    inspect()
