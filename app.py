from flask import Flask, send_from_directory, session, request
from flask_cors import CORS
import os
from datetime import timedelta
from extensions import cache, limiter

def create_app():
    app = Flask(__name__, static_url_path='', static_folder='.')
    CORS(app)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv("FLASK_SECRET_KEY", "railway_secret_key_99")
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
    from routes.admin import admin_bp
    from routes.health import health_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(train_bp, url_prefix='/api/train')
    app.register_blueprint(booking_bp, url_prefix='/api/booking')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(health_bp, url_prefix='/api')

    # Serve the frontend
    @app.route('/')
    def index():
        return send_from_directory('.', 'index.html')

    @app.errorhandler(404)
    def not_found(e):
        return send_from_directory('.', 'index.html')

    @app.after_request
    def add_header(response):
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '-1'
        return response

    return app

app = create_app()

if __name__ == '__main__':
    os.makedirs('static/tickets', exist_ok=True)
    app.run(debug=True, port=8000)
