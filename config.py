"""
FILE: config.py
CONTENT: Environment and Application Configuration
EXPLANATION: This file centralizes all secret keys, database URLs, and environment-specific settings. 
             It ensures that sensitive data is loaded securely via environment variables.
USE: Configures the Flask 'app.config' object.
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """
    GLOBAL CONFIGURATION CLASS
    Usage: Stores key-value pairs that Flask and its extensions use (e.g., SECRET_KEY).
    """
    # Flask Security Segment
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY')
    if not SECRET_KEY:
        # Fails fast in production if the env var is missing.
        # Developer must set this in their .env or environment settings.
        SECRET_KEY = None 
        
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = True # Enforced for production HTTPS (Vercel default)
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Database Connection Strings
    # Preference: Supabase PostgreSQL (Production)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    
    # Feature Flags and API Integrations
    RAILRADAR_API_KEY = os.environ.get('RAILRADAR_API_KEY')
    CACHE_TYPE = "SimpleCache"
    CACHE_DEFAULT_TIMEOUT = 300
