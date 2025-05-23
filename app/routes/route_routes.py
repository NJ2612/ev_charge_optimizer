from flask import Blueprint, jsonify, request
from ..models import db, Route, Station
from ..services.route_optimizer import find_optimal_station
import googlemaps
import os
from datetime import datetime

route_bp = Blueprint('route_bp', __name__)
gmaps = googlemaps.Client(key=os.getenv('GOOGLE_MAPS_API_KEY'))

@route_bp.route('/route', methods=['POST'])
def optimize_route():
    """Find the optimal charging station based on source and destination"""
    data = request.get_json()
    
    # Extract coordinates
    source_lat = data['source_lat']
    source_lng = data['source_lng']
    dest_lat = data['dest_lat']
    dest_lng = data['dest_lng']
    user_id = data.get('user_id')  # Optional
    
    # Get all available stations
    stations = Station.query.filter(Station.current_availability > 0).all()
    
    # Find optimal station using our optimization service
    optimal_station = find_optimal_station(
        source=(source_lat, source_lng),
        destination=(dest_lat, dest_lng),
        stations=stations,
        gmaps_client=gmaps
    )
    
    if not optimal_station:
        return jsonify({
            'error': 'No available charging stations found'
        }), 404
    
    # If user is logged in, save the route
    if user_id:
        route = Route(
            user_id=user_id,
            source_lat=source_lat,
            source_lng=source_lng,
            dest_lat=dest_lat,
            dest_lng=dest_lng,
            recommended_station_id=optimal_station.id
        )
        db.session.add(route)
        db.session.commit()
    
    # Get directions to the optimal station
    directions = gmaps.directions(
        origin=f"{source_lat},{source_lng}",
        destination=f"{optimal_station.latitude},{optimal_station.longitude}",
        mode="driving"
    )
    
    return jsonify({
        'station': {
            'id': optimal_station.id,
            'name': optimal_station.name,
            'latitude': optimal_station.latitude,
            'longitude': optimal_station.longitude,
            'current_availability': optimal_station.current_availability
        },
        'route': directions[0] if directions else None
    })

@route_bp.route('/routes/user/<int:user_id>', methods=['GET'])
def get_user_routes(user_id):
    """Get route history for a user"""
    routes = Route.query.filter_by(user_id=user_id).order_by(Route.created_at.desc()).all()
    return jsonify([{
        'id': route.id,
        'source_lat': route.source_lat,
        'source_lng': route.source_lng,
        'dest_lat': route.dest_lat,
        'dest_lng': route.dest_lng,
        'recommended_station_id': route.recommended_station_id,
        'created_at': route.created_at
    } for route in routes]) 