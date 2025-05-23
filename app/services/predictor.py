from typing import List, Tuple
import numpy as np
from datetime import datetime, timedelta
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from ..models import Station, StationLog

def extract_features(timestamp: datetime) -> List[float]:
    """Extract time-based features for prediction"""
    return [
        timestamp.hour / 24.0,  # Hour of day (normalized)
        timestamp.weekday() / 7.0,  # Day of week (normalized)
        np.sin(2 * np.pi * timestamp.hour / 24),  # Cyclical encoding of hour
        np.cos(2 * np.pi * timestamp.hour / 24),
        np.sin(2 * np.pi * timestamp.weekday() / 7),  # Cyclical encoding of weekday
        np.cos(2 * np.pi * timestamp.weekday() / 7)
    ]

def prepare_training_data(logs: List[StationLog]) -> Tuple[np.ndarray, np.ndarray]:
    """Prepare features and targets for model training"""
    X = []  # Features
    y = []  # Targets (used slots)
    
    for log in logs:
        features = extract_features(log.timestamp)
        X.append(features)
        y.append(log.used_slots)
    
    return np.array(X), np.array(y)

def predict_station_load(station: Station, logs: List[StationLog]) -> List[Tuple[datetime, float]]:
    """Predict station load for the next 24 hours"""
    if not logs:
        return []
    
    # Prepare training data
    X_train, y_train = prepare_training_data(logs)
    
    # Initialize and train model
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    model = LinearRegression()
    model.fit(X_train_scaled, y_train)
    
    # Generate predictions for next 24 hours
    predictions = []
    current_time = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    
    for hour in range(24):
        prediction_time = current_time + timedelta(hours=hour)
        features = extract_features(prediction_time)
        features_scaled = scaler.transform([features])
        
        # Predict load and ensure it's within bounds
        predicted_load = max(0, min(
            station.capacity,
            round(model.predict(features_scaled)[0])
        ))
        
        predictions.append((prediction_time, predicted_load))
    
    return predictions 