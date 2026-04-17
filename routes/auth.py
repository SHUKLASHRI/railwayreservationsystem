from flask import Blueprint, request, jsonify, session
from database.db_connection import execute_query
import bcrypt

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

@auth_bp.route('/logout', methods=['GET'])
def logout():
    session.clear()
    return jsonify({"status": "success", "message": "Logged out"}), 200

@auth_bp.route('/current-user', methods=['GET'])
def current_user():
    if 'user_id' in session:
        return jsonify({"logged_in": True, "username": session['username']})
    return jsonify({"logged_in": False}), 200
