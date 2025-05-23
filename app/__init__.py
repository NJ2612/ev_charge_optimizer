from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from .models import db
import os
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'mysql://root:@localhost/ev_charge_optimizer')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    Migrate(app, db)
    
    # Register blueprints
    from .routes.station_routes import station_bp
    from .routes.user_routes import user_bp
    from .routes.route_routes import route_bp
    from .routes.prediction_routes import prediction_bp
    
    app.register_blueprint(station_bp, url_prefix='/api')
    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(route_bp, url_prefix='/api')
    app.register_blueprint(prediction_bp, url_prefix='/api')
    
    return app 