import sqlite3
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
USE_SQLITE = os.getenv("USE_SQLITE", "true").lower() == "true"
SQLITE_DB = "database/railway.db"

def get_connection():
    """
    Returns a connection to the database.
    Attempts PostgreSQL first if USE_SQLITE is false, otherwise falls back to SQLite.
    """
    if not USE_SQLITE and DATABASE_URL:
        try:
            conn = psycopg2.connect(DATABASE_URL, connect_timeout=3)
            return conn
        except Exception as e:
            print(f"PostgreSQL connection failed: {e}. Falling back to SQLite.")
    
    # Ensure database directory exists
    os.makedirs(os.path.dirname(SQLITE_DB), exist_ok=True)
    conn = sqlite3.connect(SQLITE_DB)
    # Enable foreign keys for SQLite
    conn.execute("PRAGMA foreign_keys = ON;")
    # Return rows as dictionaries
    conn.row_factory = sqlite3.Row
    return conn

def execute_query(query, params=(), fetchone=False, fetchall=False, commit=False):
    conn = get_connection()
    try:
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