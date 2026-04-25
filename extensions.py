"""
FILE: extensions.py
CONTENT: Shared Flask Extensions & Database Utilities
EXPLANATION: To avoid circular imports, Flask extensions and core database utilities 
             are centralized here.
"""

import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

load_dotenv()

# ==============================================================================
# FLASK EXTENSIONS
# ==============================================================================

cache = Cache(config={'CACHE_TYPE': 'SimpleCache'})

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["2000 per day", "500 per hour"],
    storage_uri="memory://"
)

# ==============================================================================
# DATABASE UTILITIES
# ==============================================================================

# CONFIGURATION VARIABLES
DATABASE_URL = os.getenv("DATABASE_URL")
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT", "5432")
USE_SQLITE = os.getenv("USE_SQLITE", "false").lower() == "true"
SQLITE_DB = "railway.db"

def get_connection():
    """DYNAMIC CONNECTION FACTORY"""
    is_vercel = os.getenv('VERCEL') == '1' or os.getenv('VERCEL_ENV') is not None
    
    if DB_HOST and DB_USER and DB_PASS:
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASS,
                dbname=DB_NAME or "postgres",
                port=DB_PORT,
                sslmode='require',
                connect_timeout=15
            )
            return conn
        except Exception as e:
            if is_vercel: raise e
            print(f"PostgreSQL Individual Connection failed: {str(e)}")

    if not USE_SQLITE and DATABASE_URL:
        url = DATABASE_URL.strip().replace('"', '').replace("'", "")
        if 'sslmode=' not in url:
            sep = '&' if '?' in url else '?'
            url += f"{sep}sslmode=require"
            
        try:
            conn = psycopg2.connect(url, connect_timeout=15)
            return conn
        except Exception as e:
            if is_vercel: raise e
            print(f"PostgreSQL URL Connection failed: {str(e)}")
    
    if is_vercel:
        raise RuntimeError("No database configuration found on Vercel.")

    conn = sqlite3.connect(SQLITE_DB)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def execute_query(query, params=(), fetchone=False, fetchall=False, commit=False):
    """GLOBAL QUERY EXECUTOR"""
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
        if os.getenv('VERCEL') == '1':
            raise e
        return None
    finally:
        if conn:
            conn.close()
