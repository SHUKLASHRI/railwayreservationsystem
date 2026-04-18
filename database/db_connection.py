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
    Attempts PostgreSQL first if USE_SQLITE is false, otherwise falls back to SQLite.
    """
    if not USE_SQLITE and DATABASE_URL:
        try:
            # For serverless environments like Vercel, connections might need sslmode
            # Only append if not already present
            url = DATABASE_URL
            if 'sslmode=' not in url and '?' in url:
                url += '&sslmode=require'
            elif 'sslmode=' not in url:
                url += '?sslmode=require'
                
            conn = psycopg2.connect(url, connect_timeout=5)
            return conn
        except Exception as e:
            # Critical: Log the error on the server side (Vercel logs)
            print(f"PostgreSQL connection failed: {str(e)}")
    
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