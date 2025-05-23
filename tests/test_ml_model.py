import pytest
import numpy as np
from app.ml.load_predictor import LoadPredictor
from datetime import datetime, timedelta

@pytest.fixture
def sample_data():
    # Generate sample data for testing
    n_samples = 100
    np.random.seed(42)
    
    # Generate timestamps
    base_time = datetime.now()
    timestamps = [base_time + timedelta(hours=i) for i in range(n_samples)]
    
    # Generate features
    data = {
        'timestamp': timestamps,
        'hour': [t.hour for t in timestamps],
        'day_of_week': [t.weekday() for t in timestamps],
        'is_weekend': [1 if t.weekday() >= 5 else 0 for t in timestamps],
        'temperature': np.random.normal(20, 5, n_samples),
        'humidity': np.random.normal(60, 10, n_samples),
        'load': np.random.uniform(0, 1, n_samples)
    }
    
    return data

@pytest.fixture
def predictor():
    return LoadPredictor()

def test_model_initialization(predictor):
    assert predictor.model is not None
    assert predictor.scaler is not None

def test_prepare_features(predictor, sample_data):
    X = predictor.prepare_features(sample_data)
    assert X.shape[0] == len(sample_data['timestamp'])
    assert X.shape[1] == 5  # hour, day_of_week, is_weekend, temperature, humidity

def test_train_model(predictor, sample_data):
    # Train the model
    predictor.train(sample_data)
    
    # Test prediction
    test_data = {
        'timestamp': [datetime.now()],
        'hour': [datetime.now().hour],
        'day_of_week': [datetime.now().weekday()],
        'is_weekend': [1 if datetime.now().weekday() >= 5 else 0],
        'temperature': [20],
        'humidity': [60],
        'load': [0.5]
    }
    
    prediction = predictor.predict(test_data)
    assert 0 <= prediction <= 1

def test_model_accuracy(predictor, sample_data):
    # Split data into train and test
    train_size = int(len(sample_data['timestamp']) * 0.8)
    train_data = {k: v[:train_size] for k, v in sample_data.items()}
    test_data = {k: v[train_size:] for k, v in sample_data.items()}
    
    # Train the model
    predictor.train(train_data)
    
    # Make predictions
    predictions = predictor.predict(test_data)
    actual = test_data['load']
    
    # Calculate mean absolute error
    mae = np.mean(np.abs(predictions - actual))
    assert mae < 0.3  # Model should be reasonably accurate

def test_save_and_load_model(predictor, sample_data, tmp_path):
    # Train the model
    predictor.train(sample_data)
    
    # Save the model
    model_path = tmp_path / "model.pkl"
    scaler_path = tmp_path / "scaler.pkl"
    predictor.save_model(str(model_path), str(scaler_path))
    
    # Create new predictor and load the model
    new_predictor = LoadPredictor()
    new_predictor.load_model(str(model_path), str(scaler_path))
    
    # Test prediction with both predictors
    test_data = {
        'timestamp': [datetime.now()],
        'hour': [datetime.now().hour],
        'day_of_week': [datetime.now().weekday()],
        'is_weekend': [1 if datetime.now().weekday() >= 5 else 0],
        'temperature': [20],
        'humidity': [60],
        'load': [0.5]
    }
    
    pred1 = predictor.predict(test_data)
    pred2 = new_predictor.predict(test_data)
    
    assert np.isclose(pred1, pred2)  # Predictions should be the same

def test_feature_importance(predictor, sample_data):
    # Train the model
    predictor.train(sample_data)
    
    # Get feature importance
    importance = predictor.get_feature_importance()
    
    assert len(importance) == 5  # Should have importance for all features
    assert all(0 <= imp <= 1 for imp in importance.values())  # Importance should be between 0 and 1
    assert sum(importance.values()) == pytest.approx(1.0)  # Should sum to 1 