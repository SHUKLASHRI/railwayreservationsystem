import os
from flask import Blueprint, jsonify
from database.db_connection import get_connection

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    # Detect which env vars are present
    has_individual = all([
        os.getenv('DB_HOST'),
        os.getenv('DB_USER'),
        os.getenv('DB_PASS')
    ])
    has_url = os.getenv('DATABASE_URL') is not None
    
    status = {
        "status": "healthy",
        "database": "unknown",
        "diagnostics": {
            "vercel": os.getenv('VERCEL') == '1',
            "connection_method": "individual_vars" if has_individual else ("url" if has_url else "none"),
            "has_individual_metadata": has_individual,
            "has_url_metadata": has_url
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
