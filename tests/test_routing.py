import pytest
from app.routing.dijkstra import ChargingRouter, Station

@pytest.fixture
def sample_stations():
    return [
        Station(1, "Station 1", 51.5074, -0.1278, 4, 0.5, "available", 50),
        Station(2, "Station 2", 51.5075, -0.1279, 3, 0.3, "available", 100),
        Station(3, "Station 3", 51.5076, -0.1280, 2, 0.7, "available", 150),
        Station(4, "Station 4", 51.5077, -0.1281, 4, 0.2, "available", 50),
        Station(5, "Station 5", 51.5078, -0.1282, 3, 0.4, "available", 100)
    ]

@pytest.fixture
def router(sample_stations):
    router = ChargingRouter()
    for station in sample_stations:
        router.add_station(station)
    
    # Add connections between stations
    router.add_connection(1, 2, 1.0)
    router.add_connection(2, 3, 1.5)
    router.add_connection(3, 4, 2.0)
    router.add_connection(4, 5, 1.0)
    router.add_connection(1, 5, 4.0)  # Direct but longer route
    
    return router

def test_router_initialization():
    router = ChargingRouter()
    assert router.graph is not None

def test_add_station(router, sample_stations):
    station = sample_stations[0]
    assert station.id in router.graph.nodes
    assert router.graph.nodes[station.id]['name'] == station.name

def test_add_connection(router):
    assert router.graph.has_edge(1, 2)
    assert router.graph.has_edge(2, 3)
    assert router.graph.has_edge(3, 4)
    assert router.graph.has_edge(4, 5)
    assert router.graph.has_edge(1, 5)

def test_find_optimal_route(router):
    route, distance = router.find_optimal_route(
        start_id=1,
        end_id=5,
        battery_capacity=75,
        current_charge=80,
        vehicle_efficiency=0.2
    )
    
    assert route is not None
    assert len(route) > 0
    assert distance > 0
    assert route[0] == 1
    assert route[-1] == 5

def test_find_optimal_route_with_insufficient_battery(router):
    route, distance = router.find_optimal_route(
        start_id=1,
        end_id=5,
        battery_capacity=10,
        current_charge=20,
        vehicle_efficiency=0.2
    )
    
    assert len(route) == 0
    assert distance == float('inf')

def test_find_optimal_route_with_unavailable_station(router):
    # Make a station unavailable
    router.update_station_status(2, 0.5, "maintenance")
    
    route, distance = router.find_optimal_route(
        start_id=1,
        end_id=5,
        battery_capacity=75,
        current_charge=80,
        vehicle_efficiency=0.2
    )
    
    assert 2 not in route  # Should not use the unavailable station

def test_get_station_info(router, sample_stations):
    station_info = router.get_station_info(1)
    assert station_info['name'] == "Station 1"
    assert station_info['capacity'] == 4
    assert station_info['current_load'] == 0.5
    assert station_info['status'] == "available"

def test_update_station_status(router):
    router.update_station_status(1, 0.8, "occupied")
    station_info = router.get_station_info(1)
    assert station_info['current_load'] == 0.8
    assert station_info['status'] == "occupied" 