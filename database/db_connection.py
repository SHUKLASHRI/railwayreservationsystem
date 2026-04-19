import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import re
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
USE_SQLITE = os.getenv("USE_SQLITE", "false").lower() == "true"
SQLITE_DB = "database/railway.db"

def transform_to_pooler_url(url):
    """
    Attempts to transform a direct Supabase URL (5432) to a pooler URL (6543)
    Example: postgres://postgres.[ID]:[PASS]@db.[ID].supabase.co:5432/postgres
    To: postgres://postgres.[ID]:[PASS]@aws-0-[region].pooler.supabase.com:6543/postgres
    """
    if not url: return url
    # If it's already port 6543, we are good
    if ":6543" in url: return url
    
    # If it's 5432, we try to fix it, but port 5432 is often default (no port in string)
    # The error 'Cannot assign requested address' specifically happens on port 5432 
    # in serverless environments.
    
    # Check if this looks like a direct Supabase host: db.xxxx.supabase.co
    if ".supabase.co" in url and "pooler.supabase.com" not in url:
        print("DEBUG: Direct Supabase URL detected. Recommending pooler usage.")
        # We can't safely swap regions in code, but we can at least try to add pgbouncer params
        if "pgbouncer=true" not in url:
            sep = "&" if "?" in url else "?"
            url += f"{sep}pgbouncer=true"
            
    return url

def get_connection():
    is_vercel = os.getenv('VERCEL') == '1' or os.getenv('VERCEL_ENV') is not None
    
    if not USE_SQLITE and DATABASE_URL:
        # Step 1: Clean and transform URL
        url = transform_to_pooler_url(DATABASE_URL)
        
        # Step 2: Ensure SSL
        if 'sslmode=' not in url:
            sep = '&' if '?' in url else '?'
            url += f"{sep}sslmode=require"
            
        try:
            conn = psycopg2.connect(url, connect_timeout=15)
            # Simple check
            return conn
        except Exception as e:
            print(f"PostgreSQL connection failed: {str(e)}")
            if is_vercel:
                # We can't use SQLite on Vercel
                raise RuntimeError(f"Production DB Error: {str(e)}")
    
    # Local fallback
    os.makedirs(os.path.dirname(SQLITE_DB), exist_ok=True)
    conn = sqlite3.connect(SQLITE_DB)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def execute_query(query, params=(), fetchone=False, fetchall=False, commit=False):
    conn = None
    try:
        conn = get_connection()
        if not isinstance(conn, sqlite3.Connection):
            cur = conn.cursor(cursor_factory=RealDictCursor)
        else:
            cur = conn.cursor()
            query = query.replace('%s', '?')
        
        cur.execute(query, params)
        result = cur.fetchone() if fetchone else (cur.fetchall() if fetchall else None)
        
        if commit and conn:
            conn.commit()
        return result
    except Exception as e:
        print(f"Query Error: {str(e)}")
        if os.getenv('VERCEL') == '1': raise e
        return None
    finally:
        if conn: conn.close()