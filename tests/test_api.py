import pytest
from app import create_app
from app.models import db, Station, User
import json

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers():
    return {
        'Authorization': 'Bearer test_token',
        'Content-Type': 'application/json'
    }

@pytest.fixture
def sample_station():
    return {
        'name': 'Test Station',
        'latitude': 51.5074,
        'longitude': -0.1278,
        'capacity': 4,
        'current_load': 0.5,
        'status': 'available',
        'power_output': 50
    }

@pytest.fixture
def sample_user():
    return {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123'
    }

def test_get_stations(client, auth_headers):
    response = client.get('/api/stations', headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)

def test_create_station(client, auth_headers, sample_station):
    response = client.post(
        '/api/stations',
        headers=auth_headers,
        data=json.dumps(sample_station)
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == sample_station['name']
    assert data['capacity'] == sample_station['capacity']

def test_get_station(client, auth_headers, sample_station):
    # First create a station
    client.post(
        '/api/stations',
        headers=auth_headers,
        data=json.dumps(sample_station)
    )
    
    # Then get it
    response = client.get('/api/stations/1', headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['name'] == sample_station['name']

def test_update_station(client, auth_headers, sample_station):
    # First create a station
    client.post(
        '/api/stations',
        headers=auth_headers,
        data=json.dumps(sample_station)
    )
    
    # Update it
    update_data = {'current_load': 0.8, 'status': 'occupied'}
    response = client.put(
        '/api/stations/1',
        headers=auth_headers,
        data=json.dumps(update_data)
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['current_load'] == 0.8
    assert data['status'] == 'occupied'

def test_delete_station(client, auth_headers, sample_station):
    # First create a station
    client.post(
        '/api/stations',
        headers=auth_headers,
        data=json.dumps(sample_station)
    )
    
    # Delete it
    response = client.delete('/api/stations/1', headers=auth_headers)
    assert response.status_code == 204
    
    # Verify it's gone
    response = client.get('/api/stations/1', headers=auth_headers)
    assert response.status_code == 404

def test_find_route(client, auth_headers, sample_station):
    # Create two stations
    station1 = sample_station.copy()
    station2 = sample_station.copy()
    station2['name'] = 'Test Station 2'
    station2['latitude'] = 51.5075
    station2['longitude'] = -0.1279
    
    client.post(
        '/api/stations',
        headers=auth_headers,
        data=json.dumps(station1)
    )
    client.post(
        '/api/stations',
        headers=auth_headers,
        data=json.dumps(station2)
    )
    
    # Find route
    route_data = {
        'start_id': 1,
        'end_id': 2,
        'battery_capacity': 75,
        'current_charge': 80,
        'vehicle_efficiency': 0.2
    }
    
    response = client.post(
        '/api/route',
        headers=auth_headers,
        data=json.dumps(route_data)
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'route' in data
    assert 'distance' in data

def test_register_user(client, sample_user):
    response = client.post(
        '/api/auth/register',
        headers={'Content-Type': 'application/json'},
        data=json.dumps(sample_user)
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['username'] == sample_user['username']
    assert 'token' in data

def test_login_user(client, sample_user):
    # First register
    client.post(
        '/api/auth/register',
        headers={'Content-Type': 'application/json'},
        data=json.dumps(sample_user)
    )
    
    # Then login
    login_data = {
        'username': sample_user['username'],
        'password': sample_user['password']
    }
    response = client.post(
        '/api/auth/login',
        headers={'Content-Type': 'application/json'},
        data=json.dumps(login_data)
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'token' in data

def test_get_user_profile(client, auth_headers, sample_user):
    # First register
    client.post(
        '/api/auth/register',
        headers={'Content-Type': 'application/json'},
        data=json.dumps(sample_user)
    )
    
    # Get profile
    response = client.get('/api/user/profile', headers=auth_headers)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['username'] == sample_user['username']
    assert data['email'] == sample_user['email'] 