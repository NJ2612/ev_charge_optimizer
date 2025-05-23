from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import pandas as pd
from typing import Dict, List
import os
import csv

from routing.dijkstra import ChargingRouter, Station
from ml.load_predictor import LoadPredictor

app = Flask(__name__)
CORS(app)

# Initialize components
router = ChargingRouter()
load_predictor = LoadPredictor()

# Load historical data for ML predictions
HISTORICAL_DATA_PATH = 'data/historical_loads.csv'
if os.path.exists(HISTORICAL_DATA_PATH):
    historical_data = pd.read_csv(HISTORICAL_DATA_PATH)
    historical_data['timestamp'] = pd.to_datetime(historical_data['timestamp'])
    load_predictor.train(historical_data)

# Load saved model if available
MODEL_PATH = 'models/load_predictor.joblib'
SCALER_PATH = 'models/scaler.joblib'
if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
    load_predictor.load_model(MODEL_PATH, SCALER_PATH)

# Serve frontend static files and HTML
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend'))

def load_stations_from_csv(csv_path):
    with open(csv_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        station_id = 1
        for row in reader:
            # Parse coordinates from 'New Georeferenced Column'
            try:
                point = row['New Georeferenced Column']
                lng, lat = point.replace('POINT (', '').replace(')', '').split()
                lat, lng = float(lat), float(lng)
            except Exception:
                continue  # skip if coordinates are invalid

            name = row['Station Name']
            # Use Level 2 chargers as capacity, fallback to 1 if NONE
            capacity = int(row['EV Level2 EVSE Num']) if row['EV Level2 EVSE Num'] != 'NONE' and row['EV Level2 EVSE Num'].isdigit() else 1
            current_load = 0.0  # Assume empty for now
            status = 'available'
            charging_rate = 50  # Default value

            router.add_station(Station(
                station_id, name, lat, lng, capacity, current_load, status, charging_rate
            ))
            station_id += 1

    # Optionally, add connections (for demo, connect each to the next)
    for i in range(1, station_id - 1):
        router.add_connection(i, i + 1, 1.0)  # Dummy distance

# Call the loader function after router is initialized
load_stations_from_csv('../Electric_Vehicle_Charging_Stations.csv')

@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/login')
def serve_login():
    return send_from_directory(FRONTEND_DIR, 'login.html')

@app.route('/<path:path>')
def serve_static(path):
    # Serve static files (js, css, images, etc.)
    return send_from_directory(FRONTEND_DIR, path)

@app.route('/api/stations', methods=['GET'])
def get_stations():
    """Get all charging stations."""
    stations = []
    for node in router.graph.nodes():
        station_info = router.get_station_info(node)
        stations.append({
            'id': node,
            'name': station_info['name'],
            'lat': station_info['lat'],
            'lng': station_info['lng'],
            'capacity': station_info['capacity'],
            'current_load': station_info['current_load'],
            'status': station_info['status'],
            'charging_rate': station_info['charging_rate']
        })
    return jsonify(stations)

@app.route('/api/route', methods=['POST'])
def get_route():
    """Get optimal route between two stations."""
    data = request.json
    
    # Extract parameters
    start_id = data.get('start_id')
    end_id = data.get('end_id')
    battery_capacity = data.get('battery_capacity', 75)  # kWh
    current_charge = data.get('current_charge', 20)  # percentage
    vehicle_efficiency = data.get('vehicle_efficiency', 0.2)  # kWh/km
    
    # Get predicted loads for all stations
    predicted_loads = load_predictor.predict_loads_for_route(
        list(router.graph.nodes()),
        datetime.now(),
        historical_data
    )
    
    # Find optimal route
    route, total_distance = router.find_optimal_route(
        start_id,
        end_id,
        battery_capacity,
        current_charge,
        vehicle_efficiency,
        predicted_loads
    )
    
    if not route:
        return jsonify({
            'error': 'No feasible route found'
        }), 404
    
    # Prepare route details
    route_details = []
    for i, station_id in enumerate(route):
        station_info = router.get_station_info(station_id)
        predicted_load = predicted_loads.get(station_id, 0)
        
        route_details.append({
            'id': station_id,
            'name': station_info['name'],
            'lat': station_info['lat'],
            'lng': station_info['lng'],
            'charging_rate': station_info['charging_rate'],
            'predicted_load': predicted_load,
            'is_final': i == len(route) - 1
        })
    
    return jsonify({
        'route': route_details,
        'total_distance': total_distance,
        'estimated_time': total_distance * 2  # Rough estimate: 2 minutes per km
    })

@app.route('/api/station/<int:station_id>/status', methods=['GET'])
def get_station_status(station_id):
    """Get current status of a specific station."""
    try:
        station_info = router.get_station_info(station_id)
        predicted_load = load_predictor.predict_load(
            station_id,
            datetime.now(),
            historical_data
        )
        
        return jsonify({
            'id': station_id,
            'name': station_info['name'],
            'current_load': station_info['current_load'],
            'status': station_info['status'],
            'predicted_load': predicted_load,
            'charging_rate': station_info['charging_rate']
        })
    except KeyError:
        return jsonify({
            'error': 'Station not found'
        }), 404

@app.route('/api/station/<int:station_id>/status', methods=['PUT'])
def update_station_status(station_id):
    """Update status of a specific station."""
    data = request.json
    current_load = data.get('current_load')
    status = data.get('status')
    
    if current_load is None or status is None:
        return jsonify({
            'error': 'Missing required fields'
        }), 400
    
    router.update_station_status(station_id, current_load, status)
    return jsonify({
        'message': 'Station status updated successfully'
    })

if __name__ == '__main__':
    app.run(debug=True) 