import os
from flask import Blueprint, jsonify
from database.db_connection import get_connection

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    db_url = os.getenv('DATABASE_URL', '')
    
    # Redact sensitive info but keep enough to debug structure
    # e.g. postgresql://p1...:****@h1...:p1/d1
    redacted_url = "None"
    if db_url:
        try:
            # Simple redact
            parts = db_url.split('@')
            user_part = parts[0].split('://')[-1]
            host_part = parts[1] if len(parts) > 1 else "MISSING_HOST"
            
            username = user_part.split(':')[0]
            masked_user = f"{username[:6]}..." if len(username) > 6 else username
            redacted_url = f"{masked_user}@{host_part}"
        except:
            redacted_url = "MALFORMED_URL"

    status = {
        "status": "healthy",
        "database": "unknown",
        "diagnostics": {
            "vercel": os.getenv('VERCEL') == '1',
            "has_db_url": db_url != '',
            "url_structure": redacted_url
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
