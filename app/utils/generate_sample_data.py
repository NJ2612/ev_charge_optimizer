import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

def generate_station_data(num_stations: int = 10) -> pd.DataFrame:
    """Generate sample station data."""
    stations = []
    
    # Generate stations in a grid pattern
    grid_size = int(np.ceil(np.sqrt(num_stations)))
    lat_step = 0.01
    lng_step = 0.01
    
    for i in range(num_stations):
        row = i // grid_size
        col = i % grid_size
        
        stations.append({
            'id': i + 1,
            'name': f'Station {i + 1}',
            'lat': 51.5074 + row * lat_step,
            'lng': -0.1278 + col * lng_step,
            'capacity': np.random.randint(2, 6),  # 2-5 charging points
            'current_load': np.random.random(),  # 0-1
            'status': np.random.choice(['available', 'occupied', 'maintenance'], p=[0.7, 0.2, 0.1]),
            'charging_rate': np.random.choice([50, 100, 150])  # kW
        })
    
    return pd.DataFrame(stations)

def generate_historical_loads(stations_df: pd.DataFrame, days: int = 30) -> pd.DataFrame:
    """Generate historical load data for stations."""
    loads = []
    start_date = datetime.now() - timedelta(days=days)
    
    for _, station in stations_df.iterrows():
        for day in range(days):
            current_date = start_date + timedelta(days=day)
            
            # Generate hourly data
            for hour in range(24):
                timestamp = current_date + timedelta(hours=hour)
                
                # Base load with daily and weekly patterns
                base_load = 0.3 + 0.2 * np.sin(hour * np.pi / 12)  # Daily pattern
                base_load += 0.1 * np.sin(day * np.pi / 3.5)  # Weekly pattern
                
                # Add some randomness
                load = base_load + np.random.normal(0, 0.1)
                load = max(0, min(1, load))  # Ensure load is between 0 and 1
                
                loads.append({
                    'station_id': station['id'],
                    'timestamp': timestamp,
                    'load': load
                })
    
    return pd.DataFrame(loads)

def main():
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Generate and save station data
    stations_df = generate_station_data()
    stations_df.to_csv('data/stations.csv', index=False)
    print(f"Generated {len(stations_df)} stations")
    
    # Generate and save historical load data
    loads_df = generate_historical_loads(stations_df)
    loads_df.to_csv('data/historical_loads.csv', index=False)
    print(f"Generated {len(loads_df)} historical load records")

if __name__ == '__main__':
    main() 