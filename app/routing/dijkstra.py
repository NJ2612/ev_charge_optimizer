import networkx as nx
import numpy as np
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass

@dataclass
class Station:
    id: int
    name: str
    lat: float
    lng: float
    capacity: int
    current_load: float
    status: str
    charging_rate: float  # kW

class ChargingRouter:
    def __init__(self):
        self.graph = nx.Graph()
        
    def add_station(self, station: Station):
        """Add a charging station to the graph."""
        self.graph.add_node(station.id, 
                          name=station.name,
                          lat=station.lat,
                          lng=station.lng,
                          capacity=station.capacity,
                          current_load=station.current_load,
                          status=station.status,
                          charging_rate=station.charging_rate)
    
    def add_connection(self, station1_id: int, station2_id: int, 
                      distance: float, traffic_factor: float = 1.0):
        """Add a connection between two stations with distance and traffic factor."""
        self.graph.add_edge(station1_id, station2_id,
                          distance=distance,
                          traffic_factor=traffic_factor,
                          weight=distance * traffic_factor)
    
    def find_optimal_route(self, 
                          start_id: int, 
                          end_id: int,
                          battery_capacity: float,
                          current_charge: float,
                          vehicle_efficiency: float,
                          predicted_loads: Optional[Dict[int, float]] = None) -> Tuple[List[int], float]:
        """
        Find the optimal route between two stations considering:
        - Distance
        - Traffic conditions
        - Station availability
        - Battery constraints
        - Predicted station loads
        
        Returns:
            Tuple of (route as list of station IDs, total distance)
        """
        def weight_function(u, v, d):
            # Base weight is the distance
            weight = d['weight']
            
            # Adjust weight based on predicted load if available
            if predicted_loads:
                v_load = predicted_loads.get(v, 0)
                weight *= (1 + v_load)  # Increase weight for stations with higher predicted load
            
            # Check if station is available
            v_status = self.graph.nodes[v]['status']
            if v_status != 'available':
                return float('inf')
            
            # Check if we have enough battery to reach the station
            distance = d['distance']
            energy_needed = distance * vehicle_efficiency
            if energy_needed > current_charge * battery_capacity / 100:
                return float('inf')
            
            return weight
        
        try:
            # Find shortest path using Dijkstra's algorithm
            path = nx.shortest_path(self.graph, 
                                  start_id, 
                                  end_id, 
                                  weight=weight_function)
            
            # Calculate total distance
            total_distance = sum(self.graph[path[i]][path[i+1]]['distance'] 
                               for i in range(len(path)-1))
            
            return path, total_distance
            
        except nx.NetworkXNoPath:
            return [], float('inf')
    
    def get_station_info(self, station_id: int) -> Dict:
        """Get information about a specific station."""
        return self.graph.nodes[station_id]
    
    def update_station_status(self, station_id: int, 
                            current_load: float, 
                            status: str):
        """Update the status and load of a station."""
        if station_id in self.graph:
            self.graph.nodes[station_id]['current_load'] = current_load
            self.graph.nodes[station_id]['status'] = status 