from flask import Blueprint, request, jsonify, session
from database.db_connection import execute_query
import bcrypt
import os
import uuid
from google.oauth2 import id_token
from google.auth.transport import requests
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email', '')

    if not username or not password:
        return jsonify({"status": "error", "message": "Missing fields"}), 400

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    try:
        execute_query(
            "INSERT INTO users (username, password_hash, email) VALUES (%s, %s, %s)",
            (username, hashed, email),
            commit=True
        )
        return jsonify({"status": "success", "message": "Registered successfully"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": "User already exists or database error"}), 409

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = execute_query("SELECT user_id, username, password_hash FROM users WHERE username = %s", (username,), fetchone=True)

    if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        session['user_id'] = user['user_id']
        session['username'] = user['username']
        return jsonify({"status": "success", "username": username}), 200

    return jsonify({"status": "error", "message": "Invalid credentials"}), 401

@auth_bp.route('/google-login', methods=['POST'])
def google_login():
    data = request.get_json()
    token = data.get('credential')
    
    if not token:
        return jsonify({"status": "error", "message": "Missing credential"}), 400
        
    try:
        # Verify the token
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), client_id)
        
        email = idinfo.get('email')
        name = idinfo.get('name')
        
        if not email:
            return jsonify({"status": "error", "message": "No email found in token"}), 400
            
        # Check if user exists
        user = execute_query("SELECT user_id, username FROM users WHERE email = %s", (email,), fetchone=True)
        
        if not user:
            # Create a new user with a random password hash since they use Google
            # We'll use their email prefix as username, ensuring it's somewhat unique or just use a uuid
            username = email.split('@')[0] + "_" + str(uuid.uuid4())[:6]
            dummy_password = str(uuid.uuid4())
            hashed = bcrypt.hashpw(dummy_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            execute_query(
                "INSERT INTO users (username, password_hash, email) VALUES (%s, %s, %s)",
                (username, hashed, email),
                commit=True
            )
            
            # Fetch the newly created user
            user = execute_query("SELECT user_id, username FROM users WHERE email = %s", (email,), fetchone=True)
            
        # Log the user in
        session['user_id'] = user['user_id']
        session['username'] = user['username']
        
        return jsonify({"status": "success", "username": user['username'], "name": name}), 200

    except ValueError:
        # Invalid token
        return jsonify({"status": "error", "message": "Invalid token"}), 401
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
@auth_bp.route('/logout', methods=['GET'])
def logout():
    session.clear()
    return jsonify({"status": "success", "message": "Logged out"}), 200

@auth_bp.route('/current-user', methods=['GET'])
def current_user():
    if 'user_id' in session:
        return jsonify({"logged_in": True, "username": session['username']})
    return jsonify({"logged_in": False}), 200
