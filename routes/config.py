"""
FILE: routes/config.py
CONTENT: Runtime Configuration Endpoint
EXPLANATION: Provides public configuration values (like Google Client ID) to the frontend.
             Sensitive secrets should NEVER be exposed through this endpoint.
USE: Fetched by js/config.js on application load.
"""

from flask import Blueprint, jsonify, current_app

config_bp = Blueprint('config', __name__)

@config_bp.route('', methods=['GET'])
def get_config():
    """
    Exposes non-sensitive configuration to the frontend.
    """
    return jsonify({
        "status": "success",
        "config": {
            # Google Auth removed per user request
        }
    })
