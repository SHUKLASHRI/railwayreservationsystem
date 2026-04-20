import os
import psycopg2
from dotenv import load_dotenv

def generate_report():
    load_dotenv()
    url = os.getenv("DATABASE_URL").strip().replace('"', '').replace("'", "")
    if 'sslmode=' not in url:
        url += ('&' if '?' in url else '?') + 'sslmode=require'
    
    try:
        conn = psycopg2.connect(url)
        cur = conn.cursor()
        
        # Row Counts
        cur.execute("SELECT COUNT(*) FROM trains")
        t_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM stations")
        s_count = cur.fetchone()[0]
        
        # First 5
        cur.execute("SELECT train_number, train_name FROM trains ORDER BY train_id ASC LIMIT 5")
        first_5 = cur.fetchall()
        
        # Last 5
        cur.execute("SELECT train_number, train_name FROM trains ORDER BY train_id DESC LIMIT 5")
        last_5 = cur.fetchall()
        
        with open("db_report.txt", "w") as f:
            f.write(f"--- SUPABASE DATABASE REPORT ---\n")
            f.write(f"PROJECT ID: {url.split('@')[1].split('.')[0].split('-')[-1]}\n")
            f.write(f"TOTAL TRAINS: {t_count}\n")
            f.write(f"TOTAL STATIONS: {s_count}\n\n")
            f.write(f"FIRST 5 TRAINS:\n")
            for r in first_5: f.write(f"  {r[0]} - {r[1]}\n")
            f.write(f"\nLAST 5 TRAINS:\n")
            for r in last_5: f.write(f"  {r[0]} - {r[1]}\n")
            
        cur.close()
        conn.close()
        print("Report generated: db_report.txt")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_report()
