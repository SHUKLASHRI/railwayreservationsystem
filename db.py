"""
FILE: db.py
CONTENT: Centralized Database Connection & Execution Utility
"""

import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv()

# CONFIGURATION VARIABLES
DATABASE_URL = os.getenv("DATABASE_URL")
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT", "5432")

# FALLBACK SETTINGS
USE_SQLITE = os.getenv("USE_SQLITE", "false").lower() == "true"
SQLITE_DB = "railway.db"

def get_connection():
    """
    DYNAMIC CONNECTION FACTORY
    """
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
            msg = f"PostgreSQL Individual Connection failed: {str(e)}"
            if is_vercel:
                print(f"ERROR: {msg}")
                raise e
            print(msg)

    if not USE_SQLITE and DATABASE_URL:
        url = DATABASE_URL.strip().replace('"', '').replace("'", "")
        if 'sslmode=' not in url:
            sep = '&' if '?' in url else '?'
            url += f"{sep}sslmode=require"
            
        try:
            conn = psycopg2.connect(url, connect_timeout=15)
            return conn
        except Exception as e:
            msg = f"PostgreSQL URL Connection failed: {str(e)}"
            print(f"❌ {msg}")
            if is_vercel:
                raise e
    
    if is_vercel:
        print("❌ CRITICAL: No database configuration found on Vercel.")
        raise RuntimeError("No database configuration found on Vercel.")

    conn = sqlite3.connect(SQLITE_DB)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def execute_query(query, params=(), fetchone=False, fetchall=False, commit=False):
    """
    GLOBAL QUERY EXECUTOR
    """
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
