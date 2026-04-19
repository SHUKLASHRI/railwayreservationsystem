import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
USE_SQLITE = os.getenv("USE_SQLITE", "false").lower() == "true"
SQLITE_DB = "database/railway.db"

def get_connection():
    # Detect Vercel
    is_vercel = os.getenv('VERCEL') == '1' or os.getenv('VERCEL_ENV') is not None
    
    if not USE_SQLITE and DATABASE_URL:
        # Clean URL
        url = DATABASE_URL.strip().strip('"').strip("'")
        
        # Ensure SSL for production
        if 'sslmode=' not in url:
            sep = '&' if '?' in url else '?'
            url += f"{sep}sslmode=require"
            
        try:
            # Standard connection - no fancy transformations to avoid "invalid dsn"
            conn = psycopg2.connect(url, connect_timeout=10)
            return conn
        except Exception as e:
            if is_vercel:
                print(f"DATABASE CONNECTION ERROR: {str(e)}")
                raise e
            print(f"Local fallback triggered by: {str(e)}")
    
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
        
        if commit:
            conn.commit()
        return result
    except Exception as e:
        print(f"Query Error: {str(e)}")
        if os.getenv('VERCEL') == '1':
            raise e
        return None
    finally:
        if conn:
            conn.close()