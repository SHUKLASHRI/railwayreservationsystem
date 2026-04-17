from flask import Flask, send_from_directory, session
from flask_cors import CORS
import os
from datetime import timedelta
from routes.auth import auth_bp
from routes.train import train_bp
from routes.booking import booking_bp

def create_app():
    app = Flask(__name__, static_url_path='', static_folder='.')
    CORS(app)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv("FLASK_SECRET_KEY", "railway_secret_key_99")
    app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

    # Register Blueprints
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
