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
        try:
            url = DATABASE_URL
            # Robust SSL append
            if 'sslmode=' not in url:
                sep = '&' if '?' in url else '?'
                url += f"{sep}sslmode=require"
            
            # Increased timeout for pooler issues
            conn = psycopg2.connect(url, connect_timeout=15)
            # Ensure it works like a dict by default if we want to be safe, 
            # but we use cursor_factory in execute_query
            return conn
        except Exception as e:
            # On Vercel, if DB fails, we must fail.
            if is_vercel:
                print(f"CRITICAL: Production DB connection failed: {str(e)}")
                raise e
            print(f"PostgreSQL failed locally, falling back to SQLite: {str(e)}")
    
    # Local SQLite Fallback
    os.makedirs(os.path.dirname(SQLITE_DB), exist_ok=True)
    conn = sqlite3.connect(SQLITE_DB)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def execute_query(query, params=(), fetchone=False, fetchall=False, commit=False):
    conn = None
    try:
        conn = get_connection()
        # Use DictCursor for PostgreSQL
        if not isinstance(conn, sqlite3.Connection):
            cur = conn.cursor(cursor_factory=RealDictCursor)
        else:
            cur = conn.cursor()
            query = query.replace('%s', '?')
        
        cur.execute(query, params)
        
        result = None
        if fetchone:
            result = cur.fetchone()
        elif fetchall:
            result = cur.fetchall()
            
        if commit:
            conn.commit()
            
        return result
    except Exception as e:
        print(f"Database Error: {query[:50]}... -> {str(e)}")
        # Raise for transparency on Vercel
        if os.getenv('VERCEL') == '1':
            raise e
        return None
    finally:
        if conn:
            conn.close()