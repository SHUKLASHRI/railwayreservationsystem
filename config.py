import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default-dev-key')
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = False # True in production with HTTPS
    SESSION_COOKIE_SAMESITE = 'Lax'
