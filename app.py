from flask import Flask, send_from_directory, session, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache
import os
from datetime import timedelta

# Initialize Extensions
# we need these accessible for blueprints, but we'll init them in create_app
cache = Cache(config={'CACHE_TYPE': 'SimpleCache'})
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

def create_app():
    app = Flask(__name__, static_url_path='', static_folder='.')
    CORS(app)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv("FLASK_SECRET_KEY", "railway_secret_key_99")
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
    app.config['CACHE_DEFAULT_TIMEOUT'] = 300

    # Initialize Extensions
    cache.init_app(app)
    limiter.init_app(app)

    # Register Blueprints
    # Importing here to avoid circular imports if they use the app or limiter
    from routes.auth import auth_bp
    from routes.train import train_bp
    from routes.booking import booking_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(train_bp, url_prefix='/api/train')
    app.register_blueprint(booking_bp, url_prefix='/api/booking')

    # Serve the frontend
    @app.route('/')
    def index():
        return send_from_directory('.', 'index.html')

    @app.errorhandler(404)
    def not_found(e):
        # Support SPA routing by redirecting unknown routes to index.html
        return send_from_directory('.', 'index.html')

    return app

app = create_app()

if __name__ == '__main__':
    # Ensure directories exist
    os.makedirs('static/tickets', exist_ok=True)
    app.run(debug=True, port=8000)
