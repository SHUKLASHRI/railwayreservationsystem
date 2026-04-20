import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def fix():
    url = DATABASE_URL.strip().strip('"').strip("'")
    if 'sslmode=' not in url:
        url += ('&' if '?' in url else '?') + 'sslmode=require'
    
    conn = psycopg2.connect(url)
    conn.autocommit = True
    cur = conn.cursor()
    try:
        print("Dropping incorrect unique constraint...")
        cur.execute("ALTER TABLE train_schedules DROP CONSTRAINT IF EXISTS train_schedules_train_id_station_id_key")
        print("SUCCESS: Constraint dropped.")
        
        print("Ensuring correct unique constraint exists...")
        cur.execute("""
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'train_schedules_train_id_stop_sequence_key') THEN
                    ALTER TABLE train_schedules ADD CONSTRAINT train_schedules_train_id_stop_sequence_key UNIQUE (train_id, stop_sequence);
                END IF;
            END $$;
        """)
        print("SUCCESS: (train_id, stop_sequence) uniqueness verified.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    fix()
