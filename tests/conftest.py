import pytest
from app import create_app
from app.models import db, Station, User
from app.ml.load_predictor import LoadPredictor
from app.routing.dijkstra import ChargingRouter
import os

@pytest.fixture(scope='session')
def app():
    """Create and configure a Flask app for testing."""
    app = create_app('testing')
    
    # Create a test database
    with app.app_context():
        db.create_all()
        
        # Create test data
        create_test_data()
        
        yield app
        
        # Clean up
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope='session')
def client(app):
    """Create a test client for the app."""
    return app.test_client()

@pytest.fixture(scope='session')
def runner(app):
    """Create a test CLI runner for the app."""
    return app.test_cli_runner()

@pytest.fixture(scope='session')
def auth_headers():
    """Create authentication headers for testing."""
    return {
        'Authorization': 'Bearer test_token',
        'Content-Type': 'application/json'
    }

@pytest.fixture(scope='session')
def load_predictor():
    """Create a LoadPredictor instance for testing."""
    return LoadPredictor()

@pytest.fixture(scope='session')
def charging_router():
    """Create a ChargingRouter instance for testing."""
    return ChargingRouter()

def create_test_data():
    """Create test data in the database."""
    # Create test stations
    stations = [
        Station(
            name='Test Station 1',
            latitude=51.5074,
            longitude=-0.1278,
            capacity=4,
            current_load=0.5,
            status='available',
            power_output=50
        ),
        Station(
            name='Test Station 2',
            latitude=51.5075,
            longitude=-0.1279,
            capacity=3,
            current_load=0.3,
            status='available',
            power_output=100
        ),
        Station(
            name='Test Station 3',
            latitude=51.5076,
            longitude=-0.1280,
            capacity=2,
            current_load=0.7,
            status='occupied',
            power_output=150
        )
    ]
    
    for station in stations:
        db.session.add(station)
    
    # Create test user
    user = User(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )
    db.session.add(user)
    
    db.session.commit()

@pytest.fixture(scope='session')
def test_station_data():
    """Return test station data."""
    return {
        'name': 'Test Station',
        'latitude': 51.5074,
        'longitude': -0.1278,
        'capacity': 4,
        'current_load': 0.5,
        'status': 'available',
        'power_output': 50
    }

@pytest.fixture(scope='session')
def test_user_data():
    """Return test user data."""
    return {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123'
    }

@pytest.fixture(scope='session')
def test_route_data():
    """Return test route data."""
    return {
        'start_id': 1,
        'end_id': 2,
        'battery_capacity': 75,
        'current_charge': 80,
        'vehicle_efficiency': 0.2
    }

@pytest.fixture(scope='session')
def test_ml_data():
    """Return test machine learning data."""
    return {
        'timestamp': ['2024-01-01 10:00:00'],
        'hour': [10],
        'day_of_week': [0],
        'is_weekend': [0],
        'temperature': [20],
        'humidity': [60],
        'load': [0.5]
    } 