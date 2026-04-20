import sqlite3
import psycopg2
import os
from dotenv import load_dotenv

def migrate():
    # 1. Load config
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ DATABASE_URL not found in .env")
        return
    
    db_url = db_url.strip().strip('"').strip("'")
    if 'sslmode=' not in db_url:
        sep = '&' if '?' in db_url else '?'
        db_url += f"{sep}sslmode=require"

    sqlite_db = "database/railway.db"
    if not os.path.exists(sqlite_db):
        print(f"❌ SQLite database {sqlite_db} not found.")
        return

    print("Starting migration from SQLite to Supabase...")

    try:
        # 2. Connect to both
        sq_conn = sqlite3.connect(sqlite_db)
        sq_conn.row_factory = sqlite3.Row
        sq_cur = sq_conn.cursor()

        pg_conn = psycopg2.connect(db_url)
        pg_cur = pg_conn.cursor()

        # 3. Create tables in Supabase if they don't exist
        # We can use the existing schema.sql or just simple CREATE TABLE for key data
        # For simplicity and reliability, we'll try to find all tables in SQLite and sync them
        sq_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = [t[0] for t in sq_cur.fetchall()]
        print(f"Found tables: {tables}")

        for table in tables:
            print(f"Migrating table: {table}...")
            
            # Get data from SQLite
            sq_cur.execute(f"SELECT * FROM {table}")
            rows = sq_cur.fetchall()
            if not rows:
                print(f"Table {table} is empty, skipping.")
                continue

            # Prepare PG insert
            columns = rows[0].keys()
            col_names = ", ".join(columns)
            placeholders = ", ".join(["%s"] * len(columns))
            
            # Clear existing data in Supabase for this table (optional, but safer for fresh start)
            # pg_cur.execute(f"TRUNCATE TABLE {table} CASCADE")
            
            insert_query = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
            
            data_to_insert = []
            for row in rows:
                val_list = list(row)
                # Heuristic: convert 1/0 to True/False for columns that PG expects as boolean
                # In this schema, 'is_active' is the main one.
                if 'is_active' in columns:
                    idx = list(columns).index('is_active')
                    val_list[idx] = bool(val_list[idx])
                data_to_insert.append(tuple(val_list))

            try:
                pg_cur.executemany(insert_query, data_to_insert)
                print(f"Migrated {len(data_to_insert)} rows to {table}")
            except Exception as e:
                print(f"Error migrating {table}: {e}")
                pg_conn.rollback()
                continue
        
        pg_conn.commit()
        print("Migration complete!")
        
        pg_cur.close()
        pg_conn.close()
        sq_conn.close()

    except Exception as e:
        print(f"💥 Migration failed: {e}")

if __name__ == "__main__":
    migrate()
