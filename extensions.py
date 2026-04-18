from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache

# Initialize Extensions
# we define these here to avoid circular imports between app.py and blueprints
cache = Cache(config={'CACHE_TYPE': 'SimpleCache'})
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)
