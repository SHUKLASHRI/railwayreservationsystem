import os
from flask import Blueprint, jsonify
from database.db_connection import get_connection

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    status = {
        "status": "healthy",
        "database": "unknown",
        "env": {
            "vercel": os.getenv('VERCEL') == '1',
            "has_db_url": os.getenv('DATABASE_URL') is not None
        }
    }
    
    try:
        conn = get_connection()
        status["database"] = "connected"
        conn.close()
    except Exception as e:
        status["status"] = "unhealthy"
        status["database"] = f"error: {str(e)}"
    
    return jsonify(status)
