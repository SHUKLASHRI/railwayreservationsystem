import os
import psycopg2
from dotenv import load_dotenv

def create_debug_table():
    load_dotenv()
    url = os.getenv("DATABASE_URL").strip().replace('"', '').replace("'", "")
    if 'sslmode=' not in url:
        url += ('&' if '?' in url else '?') + 'sslmode=require'
    
    try:
        conn = psycopg2.connect(url)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Creating table 'antigravity_debug'...")
        cur.execute("CREATE TABLE IF NOT EXISTS public.antigravity_debug (id SERIAL PRIMARY KEY, message TEXT, created_at TIMESTAMP DEFAULT NOW())")
        
        print("Inserting unique message...")
        msg = f"Data verified at {os.popen('date /t').read().strip()} {os.popen('time /t').read().strip()}"
        cur.execute("INSERT INTO public.antigravity_debug (message) VALUES (%s)", (msg,))
        
        cur.execute("SELECT * FROM public.antigravity_debug")
        row = cur.fetchone()
        print(f"Verified row in DB: {row}")
        
        cur.close()
        conn.close()
        print("SUCCESS: Debug table created and row inserted.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_debug_table()
