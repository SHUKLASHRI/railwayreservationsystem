import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
# Default to false so it tries PostgreSQL first in production/vercel
USE_SQLITE = os.getenv("USE_SQLITE", "false").lower() == "true"
SQLITE_DB = "database/railway.db"

def get_connection():
    """
    Returns a connection to the database.
    Attempts PostgreSQL first if USE_SQLITE is false.
    """
    # Detect Vercel environment
    is_vercel = os.getenv('VERCEL') == '1' or os.getenv('VERCEL_ENV') is not None
    
    if not USE_SQLITE and DATABASE_URL:
        try:
            url = DATABASE_URL
            # Ensure SSL for Supabase/Production
            if 'sslmode=' not in url:
                url += ('&' if '?' in url else '?') + 'sslmode=require'
                
            conn = psycopg2.connect(url, connect_timeout=10)
            return conn
        except Exception as e:
            print(f"PostgreSQL connection failed: {str(e)}")
            if is_vercel:
                # On Vercel, we MUST have PostgreSQL. Do not fallback to read-only SQLite.
                raise RuntimeError("Production database connection failed and SQLite is not supported on Vercel.")
    
    if is_vercel:
        raise RuntimeError("DATABASE_URL not found in Vercel environment.")

    # Local SQLite Fallback (only for local development)
    os.makedirs(os.path.dirname(SQLITE_DB), exist_ok=True)
    conn = sqlite3.connect(SQLITE_DB)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def execute_query(query, params=(), fetchone=False, fetchall=False, commit=False):
    conn = get_connection()
    try:
        # Use DictCursor for PostgreSQL if possible
        if not isinstance(conn, sqlite3.Connection):
            cur = conn.cursor(cursor_factory=RealDictCursor)
        else:
            cur = conn.cursor()
        # Convert %s to ? for SQLite compatibility if needed
        if isinstance(conn, sqlite3.Connection):
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
        print(f"Database error: {e}")
        return None
    finally:
        conn.close()