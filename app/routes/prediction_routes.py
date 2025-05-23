from flask import Blueprint, jsonify, request
from ..models import db, Prediction, Station, StationLog
from ..services.predictor import predict_station_load
from datetime import datetime, timedelta

prediction_bp = Blueprint('prediction_bp', __name__)

@prediction_bp.route('/predictions/station/<int:station_id>', methods=['GET'])
def get_station_predictions(station_id):
    """Get load predictions for a specific station"""
    # Get predictions for the next 24 hours
    start_time = datetime.utcnow()
    end_time = start_time + timedelta(hours=24)
    
    predictions = Prediction.query.filter(
        Prediction.station_id == station_id,
        Prediction.timestamp >= start_time,
        Prediction.timestamp <= end_time
    ).order_by(Prediction.timestamp).all()
    
    return jsonify([{
        'timestamp': pred.timestamp,
        'predicted_load': pred.predicted_load
    } for pred in predictions])

@prediction_bp.route('/predictions/update', methods=['POST'])
def update_predictions():
    """Update predictions for all stations"""
    stations = Station.query.all()
    
    for station in stations:
        # Get historical data for training
        logs = StationLog.query.filter_by(station_id=station.id)\
            .order_by(StationLog.timestamp.desc())\
            .limit(168)  # Last week of hourly data
        
        if not logs:
            continue
        
        # Generate predictions for next 24 hours
        predictions = predict_station_load(station, logs)
        
        # Save predictions
        for timestamp, load in predictions:
            prediction = Prediction(
                station_id=station.id,
                timestamp=timestamp,
                predicted_load=load
            )
            db.session.add(prediction)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Predictions updated successfully'
    }) 