from flask import Blueprint, jsonify, request
from ..models import db, Station
from datetime import datetime

station_bp = Blueprint('station_bp', __name__)

@station_bp.route('/stations', methods=['GET'])
def get_stations():
    """Get all charging stations with real-time status"""
    stations = Station.query.all()
    return jsonify([{
        'id': station.id,
        'name': station.name,
        'latitude': station.latitude,
        'longitude': station.longitude,
        'capacity': station.capacity,
        'current_availability': station.current_availability
    } for station in stations])

@station_bp.route('/station/<int:id>', methods=['GET'])
def get_station(id):
    """Get detailed information about a specific station"""
    station = Station.query.get_or_404(id)
    return jsonify({
        'id': station.id,
        'name': station.name,
        'latitude': station.latitude,
        'longitude': station.longitude,
        'capacity': station.capacity,
        'current_availability': station.current_availability,
        'created_at': station.created_at,
        'updated_at': station.updated_at
    })

@station_bp.route('/station', methods=['POST'])
def create_station():
    """Create a new charging station"""
    data = request.get_json()
    
    new_station = Station(
        name=data['name'],
        latitude=data['latitude'],
        longitude=data['longitude'],
        capacity=data['capacity'],
        current_availability=data['capacity']  # Initially all slots are available
    )
    
    db.session.add(new_station)
    db.session.commit()
    
    return jsonify({
        'message': 'Station created successfully',
        'station_id': new_station.id
    }), 201

@station_bp.route('/station/<int:id>', methods=['PUT'])
def update_station(id):
    """Update station availability"""
    station = Station.query.get_or_404(id)
    data = request.get_json()
    
    if 'current_availability' in data:
        station.current_availability = data['current_availability']
    
    station.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'message': 'Station updated successfully',
        'current_availability': station.current_availability
    }) 