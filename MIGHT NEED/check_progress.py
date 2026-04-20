import os
import psycopg2
from dotenv import load_dotenv

def check_counts():
    load_dotenv()
    url = os.getenv("DATABASE_URL").strip().replace('"', '').replace("'", "")
    if 'sslmode=' not in url:
        url += ('&' if '?' in url else '?') + 'sslmode=require'
    
    conn = psycopg2.connect(url)
    cur = conn.cursor()
    
    tables = ['stations', 'trains', 'train_instances', 'train_schedules']
    for table in tables:
        cur.execute(f"SELECT COUNT(*) FROM {table}")
        count = cur.fetchone()[0]
        print(f"{table}: {count}")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_counts()
