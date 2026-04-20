"""
FILE: database/db_connection.py
CONTENT: Centralized Database Connection & Execution Utility
EXPLANATION: This module is the application's "data hub." It manages connections to 
             Supabase (PostgreSQL) in production and provides a "Smart Fallback" to 
             Local SQLite for development or when cloud connectivity is unavailable.
USE: Imported by all route modules to interact with the database via 'execute_query'.
"""

import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv()

# CONFIGURATION VARIABLES
# These constants hold the database credentials retrieved from environment variables.
DATABASE_URL = os.getenv("DATABASE_URL")
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT", "5432")

# FALLBACK SETTINGS
USE_SQLITE = os.getenv("USE_SQLITE", "false").lower() == "true"
SQLITE_DB = "database/railway.db"

def get_connection():
    """
    DYNAMIC CONNECTION FACTORY
    Explanation: Decides which database to connect to based on availability.
    Use: Called internally by 'execute_query' to get a live database handle.
    """
    # Detect if we are running in the Vercel Cloud environment
    is_vercel = os.getenv('VERCEL') == '1' or os.getenv('VERCEL_ENV') is not None
    
    # LEVEL 1: Individual Variables (Most Stable)
    # Explanation: Preferred for production Supabase connections to avoid URI parsing bugs.
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

    # LEVEL 2: Uni-URL (Standard Connection String)
    # Explanation: Uses the single 'postgres://...' URL provided by Supabase.
    if not USE_SQLITE and DATABASE_URL:
        # Cleanup URL string (remove quotes/spaces)
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
    
    # LEVEL 3: SQLite Fallback (LOCAL ONLY)
    # Explanation: If cloud DB is unreachable, we use a local file so the app stays functional.
    if is_vercel:
        print("❌ CRITICAL: No database configuration found on Vercel.")
        raise RuntimeError("No database configuration found on Vercel.")

    # Ensure the directory exists and connect to the local SQLite file
    os.makedirs(os.path.dirname(SQLITE_DB), exist_ok=True)
    conn = sqlite3.connect(SQLITE_DB)
    conn.execute("PRAGMA foreign_keys = ON;") # Enforce data integrity
    conn.row_factory = sqlite3.Row # Make results searchable by column name
    return conn

def execute_query(query, params=(), fetchone=False, fetchall=False, commit=False):
    """
    GLOBAL QUERY EXECUTOR
    Explanation: A robust wrapper that handles connection creation, cursor management, 
                 query execution, and automatic connection closing.
    Use: execute_query("SELECT * FROM trains WHERE id = %s", (1,), fetchone=True)
    """
    conn = None
    try:
        conn = get_connection()
        # Handle PostgreSQL vs SQLite cursor differences
        if not isinstance(conn, sqlite3.Connection):
            # PostgreSQL: Use RealDictCursor to return results as Python dictionaries
            cur = conn.cursor(cursor_factory=RealDictCursor)
        else:
            # SQLite: Use standard cursor and translate Postgres syntax (%s) to SQLite syntax (?)
            cur = conn.cursor()
            query = query.replace('%s', '?')
        
        # Execute the SQL
        cur.execute(query, params)
        result = cur.fetchone() if fetchone else (cur.fetchall() if fetchall else None)
        
        # Save changes if this was an INSERT/UPDATE/DELETE
        if commit and conn:
            conn.commit()
        return result
    except Exception as e:
        print(f"Query Error: {str(e)}")
        if os.getenv('VERCEL') == '1':
            raise e
        return None
    finally:
        # CRITICAL: Always close the connection to prevent memory leaks
        if conn:
            conn.close()