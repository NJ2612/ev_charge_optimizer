import os
from datetime import timedelta

class Config:
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'
    DEBUG = False
    TESTING = False

    # Database settings
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///ev_charger.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # API settings
    API_BASE_URL = 'http://localhost:5000/api'
    GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')

    # ML Model settings
    MODEL_PATH = 'models/load_predictor.joblib'
    SCALER_PATH = 'models/scaler.joblib'
    TRAINING_DATA_PATH = 'data/historical_loads.csv'

    # Station settings
    MAX_STATIONS = 1000
    UPDATE_INTERVAL = timedelta(seconds=30)
    DEFAULT_CHARGING_RATE = 50  # kW

    # Route settings
    MAX_ROUTE_DISTANCE = 100  # km
    MIN_BATTERY_THRESHOLD = 20  # percentage
    DEFAULT_VEHICLE_EFFICIENCY = 0.2  # kWh/km

    # Testing settings
    TEST_STATIONS_COUNT = 10
    TEST_DAYS = 30

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'

class ProductionConfig(Config):
    # Production-specific settings
    DEBUG = False
    TESTING = False

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
} 