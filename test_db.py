from database.db_connection import execute_query
import json

def test():
    try:
        # Check if users table has anyone
        user = execute_query("SELECT * FROM users LIMIT 1", fetchone=True)
        print(f"User type: {type(user)}")
        print(f"User content: {user}")
        if user:
            try:
                print(f"Access by username: {user['username']}")
            except Exception as e:
                print(f"Failed string access: {e}")
    except Exception as e:
        print(f"Query failed: {e}")

if __name__ == "__main__":
    test()
