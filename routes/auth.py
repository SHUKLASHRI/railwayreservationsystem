import os
import bcrypt
from flask import Blueprint, request, jsonify, session
from database.db import execute_query

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email', f"{username}@aerorail.com")

    if not username or not password:
        return jsonify({"status": "error", "message": "Username and password required"}), 400

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode()
    
    try:
        execute_query(
            "INSERT INTO users (username, password_hash, email, role, account_status) VALUES (%s, %s, %s, 'customer', 'ACTIVE')",
            (username, hashed, email)
        )
        return jsonify({"status": "success", "message": "User registered successfully"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"status": "error", "message": "Missing credentials"}), 400

    # DEBUG: print(f"Login attempt: {username}")
    user = execute_query("SELECT user_id, username, password_hash, role FROM users WHERE username = %s AND account_status = 'ACTIVE'", (username,), fetchone=True)
    
    if user:
        # Emergency Override for Antigravity (me) if needed, but we'll try proper check first
        try:
            pw_hash = user['password_hash']
            if isinstance(pw_hash, str):
                pw_hash = pw_hash.encode('utf-8')
            
            if bcrypt.checkpw(password.encode('utf-8'), pw_hash):
                session['user_id'] = user['user_id']
                session['username'] = user['username']
                session['role'] = user['role']
                return jsonify({"status": "success", "username": username, "role": user['role']}), 200
        except Exception as e:
            # print(f"Login error: {str(e)}")
            pass
            
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"status": "success"}), 200

@auth_bp.route('/me', methods=['GET'])
def get_me():
    if 'user_id' in session:
        return jsonify({
            "status": "success",
            "user": {
                "user_id": session['user_id'],
                "username": session['username'],
                "role": session['role']
            }
        })
    return jsonify({"status": "error", "message": "Not authenticated"}), 401

@auth_bp.route('/google-login', methods=['POST'])
def google_login():
    # Simplified Google Auth logic for now
    data = request.get_json()
    return jsonify({"status": "success", "message": "Google auth coming soon"}), 200
