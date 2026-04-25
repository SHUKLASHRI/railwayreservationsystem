from flask import Flask, send_from_directory, session, request, jsonify
from flask_cors import CORS
import os
from datetime import timedelta
from extensions import cache, limiter
from config import Config

def create_app(config_class=Config):
    # Round 2 Fix: Strictly limit static_folder to 'static' relative path
    app = Flask(__name__, static_folder='static', static_url_path='/static')
    app.config.from_object(config_class)
    
    # Round 1 Fix: Secret Key is now handled solely by config.py
    
    # CORS Hardening: Restrict to authorized origins
    # In production, this should be the specific AeroRail domain.
    allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:5000,http://127.0.0.1:5000').split(',')
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)
    
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
    app.config['CACHE_DEFAULT_TIMEOUT'] = 300
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

    # Initialize Extensions
    cache.init_app(app)
    limiter.init_app(app)

    # Register Blueprints
    from routes.auth import auth_bp
    from routes.train import train_bp
    from routes.booking import booking_bp
    from routes.health import health_bp
    from routes.admin import admin_bp
    from routes.config import config_bp # NEW Runtime Config
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(train_bp, url_prefix='/api/train')
    app.register_blueprint(booking_bp, url_prefix='/api/booking')
    app.register_blueprint(health_bp, url_prefix='/api/health')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(config_bp, url_prefix='/api/config')

    # Security: Custom 404 Handler for SPA
    @app.errorhandler(404)
    def not_found_error(error):
        if request.path.startswith('/api/'):
            return jsonify({"status": "error", "message": "API endpoint not found"}), 404
        # SPA Fallback: Redirect all non-API 404s to index.html
        return send_from_directory('.', 'index.html'), 200

    # Serve the frontend
    @app.route('/')
    def index():
        # Specifically serving ONLY index.html from root
        return send_from_directory('.', 'index.html')

    @app.route('/js/<path:path>')
    @limiter.exempt
    def serve_js(path):
        return send_from_directory('js', path)

    @app.route('/<path:path>')
    def serve_spa(path):
        # 1. Check static/
        if os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        # 2. Check root files (strictly restricted)
        if path in ['favicon.ico', 'manifest.json']:
            return send_from_directory('.', path)
        # 3. Fallback to index.html for SPA routing
        return send_from_directory('.', 'index.html')

    @app.after_request
    def add_header(response):
        if request.path.startswith('/api/'):
            response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '-1'
        return response

    return app

app = create_app()

if __name__ == '__main__':
    os.makedirs('static/tickets', exist_ok=True)
    app.run(debug=True, port=5000)
