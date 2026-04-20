"""
FILE: extensions.py
CONTENT: Shared Flask Extensions
EXPLANATION: To avoid circular imports, Flask extensions like Caching and Rate Limiting
             are initialized here as global objects and then hooked into the app in 'app.py'.
USE: Provides 'cache' and 'limiter' objects to different routes and services.
"""

from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# SERVER-SIDE CACHING
# Usage: Reduces database load by storing API responses temporarily.
cache = Cache(config={'CACHE_TYPE': 'SimpleCache'})

# API RATE LIMITING (SECURITY)
# Usage: Prevents abuse (DDOS/Spam) by limiting how many requests a single IP can make.
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)
