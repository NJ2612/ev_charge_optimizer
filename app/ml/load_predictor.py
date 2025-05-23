import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib
from typing import Dict, List, Tuple
import pandas as pd
from datetime import datetime, timedelta

class LoadPredictor:
    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def prepare_features(self, 
                        station_id: int,
                        timestamp: datetime,
                        historical_data: pd.DataFrame) -> np.ndarray:
        """
        Prepare features for prediction:
        - Time of day (hour)
        - Day of week
        - Historical load at this time
        - Current weather conditions
        - Special events
        """
        features = []
        
        # Time features
        features.extend([
            timestamp.hour,
            timestamp.weekday(),
            timestamp.month,
            timestamp.day
        ])
        
        # Historical load features
        for i in range(1, 8):  # Last 7 days
            prev_time = timestamp - timedelta(days=i)
            prev_load = historical_data[
                (historical_data['station_id'] == station_id) &
                (historical_data['timestamp'].dt.hour == prev_time.hour) &
                (historical_data['timestamp'].dt.weekday == prev_time.weekday())
            ]['load'].mean()
            features.append(prev_load if not np.isnan(prev_load) else 0)
        
        # Add weather features if available
        # TODO: Integrate with weather API
        
        return np.array(features).reshape(1, -1)
    
    def train(self, 
             historical_data: pd.DataFrame,
             target_column: str = 'load'):
        """
        Train the model on historical data.
        
        Args:
            historical_data: DataFrame with columns:
                - station_id
                - timestamp
                - load
                - weather_conditions (optional)
        """
        X = []
        y = []
        
        for station_id in historical_data['station_id'].unique():
            station_data = historical_data[historical_data['station_id'] == station_id]
            
            for _, row in station_data.iterrows():
                features = self.prepare_features(
                    station_id,
                    row['timestamp'],
                    historical_data
                )
                X.append(features[0])
                y.append(row[target_column])
        
        X = np.array(X)
        y = np.array(y)
        
        # Scale features
        X = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X, y)
        self.is_trained = True
    
    def predict_load(self,
                    station_id: int,
                    timestamp: datetime,
                    historical_data: pd.DataFrame) -> float:
        """
        Predict the load for a specific station at a given time.
        
        Returns:
            Predicted load (0-1 scale)
        """
        if not self.is_trained:
            raise ValueError("Model needs to be trained before making predictions")
        
        features = self.prepare_features(station_id, timestamp, historical_data)
        features = self.scaler.transform(features)
        
        prediction = self.model.predict(features)[0]
        return max(0, min(1, prediction))  # Ensure prediction is between 0 and 1
    
    def predict_loads_for_route(self,
                              station_ids: List[int],
                              start_time: datetime,
                              historical_data: pd.DataFrame) -> Dict[int, float]:
        """
        Predict loads for all stations in a route.
        
        Returns:
            Dictionary mapping station IDs to predicted loads
        """
        predictions = {}
        current_time = start_time
        
        for station_id in station_ids:
            predictions[station_id] = self.predict_load(
                station_id,
                current_time,
                historical_data
            )
            # Add estimated travel time to next station
            current_time += timedelta(minutes=30)  # TODO: Use actual travel time
        
        return predictions
    
    def save_model(self, model_path: str, scaler_path: str):
        """Save the trained model and scaler."""
        if not self.is_trained:
            raise ValueError("No trained model to save")
        
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
    
    def load_model(self, model_path: str, scaler_path: str):
        """Load a trained model and scaler."""
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        self.is_trained = True 