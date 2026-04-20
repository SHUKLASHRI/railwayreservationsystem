"""
FILE: database_health_check.py
CONTENT: System Diagnostic Tool
EXPLANATION: Verifies the integrity of the database connection (Production or Local)
              and ensures that core tables (users, trains, bookings) are accessible.
USE: Run via 'python database_health_check.py' during deployment or debugging.
"""

import sys
from database.db_connection import execute_query

def run_diagnostics():
    print("AeroRail System Diagnostics Starting...")
    print("-" * 40)
    
    try:
        # 1. Check User connectivity
        user_count = execute_query("SELECT COUNT(*) as count FROM users", fetchone=True)
        print(f"OK - Database Connection: SUCCESS")
        print(f"OK - User Table: Accessible ({user_count['count']} users found)")
        
        # 2. Check Train data
        train_count = execute_query("SELECT COUNT(*) as count FROM trains", fetchone=True)
        print(f"OK - Train Table: Accessible ({train_count['count']} trains found)")
        
        # 3. Check Booking data
        booking_count = execute_query("SELECT COUNT(*) as count FROM bookings", fetchone=True)
        print(f"OK - Bookings Table: Accessible ({booking_count['count']} records found)")
        
        print("-" * 40)
        print("DONE - All systems green. Database is healthy.")
        
    except Exception as e:
        print(f"ERROR - Diagnostic Failed: {str(e)}")
        print("-" * 40)
        print("TIP: Check your .env file or Supabase connection settings.")
        sys.exit(1)

if __name__ == "__main__":
    run_diagnostics()
