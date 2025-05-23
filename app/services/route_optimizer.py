import networkx as nx
from typing import Tuple, List, Optional
import numpy as np
from ..models import Station

def calculate_distance(point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
    """Calculate Haversine distance between two points"""
    lat1, lon1 = point1
    lat2, lon2 = point2
    
    R = 6371  # Earth's radius in kilometers
    
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    
    return R * c

def calculate_detour_score(source: Tuple[float, float], 
                          destination: Tuple[float, float],
                          station: Tuple[float, float]) -> float:
    """Calculate how much detour is needed to visit the station"""
    direct_distance = calculate_distance(source, destination)
    via_station_distance = calculate_distance(source, station) + calculate_distance(station, destination)
    
    return via_station_distance - direct_distance

def calculate_station_score(station: Station,
                          source: Tuple[float, float],
                          destination: Tuple[float, float],
                          gmaps_client) -> float:
    """Calculate overall score for a station based on multiple factors"""
    station_coords = (station.latitude, station.longitude)
    
    # Calculate base scores
    detour_score = calculate_detour_score(source, destination, station_coords)
    availability_score = station.current_availability / station.capacity
    
    # Get real-time traffic data if available
    try:
        # Get driving time to station
        matrix = gmaps_client.distance_matrix(
            origins=[f"{source[0]},{source[1]}"],
            destinations=[f"{station.latitude},{station.longitude}"],
            mode="driving",
            departure_time="now"
        )
        
        if matrix['rows'][0]['elements'][0]['status'] == 'OK':
            duration_in_traffic = matrix['rows'][0]['elements'][0]['duration_in_traffic']['value']
            traffic_score = 1 / (1 + duration_in_traffic/3600)  # Normalize to 0-1 range
        else:
            traffic_score = 1.0
    except Exception:
        traffic_score = 1.0
    
    # Weights for different factors
    DETOUR_WEIGHT = 0.4
    AVAILABILITY_WEIGHT = 0.3
    TRAFFIC_WEIGHT = 0.3
    
    # Calculate final score (lower is better)
    final_score = (
        DETOUR_WEIGHT * detour_score +
        AVAILABILITY_WEIGHT * (1 - availability_score) +
        TRAFFIC_WEIGHT * (1 - traffic_score)
    )
    
    return final_score

def find_optimal_station(source: Tuple[float, float],
                        destination: Tuple[float, float],
                        stations: List[Station],
                        gmaps_client) -> Optional[Station]:
    """Find the optimal charging station based on multiple factors"""
    if not stations:
        return None
    
    # Calculate scores for each station
    station_scores = [
        (station, calculate_station_score(station, source, destination, gmaps_client))
        for station in stations
    ]
    
    # Sort by score (lower is better) and return the best station
    return min(station_scores, key=lambda x: x[1])[0] 