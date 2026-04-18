from database.db_connection import get_connection, execute_query
import bcrypt

def seed_admin():
    conn = get_connection()
    cur = conn.cursor()
    
    # 1. Ensure scraped_live_status exists
    print("Ensuring scraped_live_status table exists...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS scraped_live_status (
            train_number TEXT PRIMARY KEY,
            live_data TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 2. Create Admin User
    print("Seeding admin user...")
    admin_user = "admin"
    admin_pass = "admin123"
    hashed = bcrypt.hashpw(admin_pass.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    try:
        # Check if exists
        existing = execute_query("SELECT user_id FROM users WHERE username = %s", (admin_user,), fetchone=True)
        if not existing:
            execute_query(
                "INSERT INTO users (username, password_hash, role, email) VALUES (%s, %s, %s, %s)",
                (admin_user, hashed, 'admin', 'admin@aerorail.com'),
                commit=True
            )
            print("Admin user created: admin / admin123")
        else:
            execute_query("UPDATE users SET role = 'admin' WHERE username = %s", (admin_user,), commit=True)
            print("Admin role updated for existing 'admin' user.")
            
        conn.commit()
    except Exception as e:
        print(f"Error seeding admin: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    seed_admin()
