from flask import Blueprint, jsonify, request
from ..models import db, User
from datetime import datetime

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/user', methods=['POST'])
def create_user():
    """Register a new user"""
    data = request.get_json()
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({
            'error': 'User with this email already exists'
        }), 400
    
    # Create new user
    new_user = User(
        name=data['name'],
        email=data['email'],
        vehicle_type=data.get('vehicle_type')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'message': 'User created successfully',
        'user_id': new_user.id
    }), 201

@user_bp.route('/user/<int:id>', methods=['GET'])
def get_user(id):
    """Get user details"""
    user = User.query.get_or_404(id)
    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'vehicle_type': user.vehicle_type,
        'created_at': user.created_at
    })

@user_bp.route('/user/<int:id>', methods=['PUT'])
def update_user(id):
    """Update user details"""
    user = User.query.get_or_404(id)
    data = request.get_json()
    
    if 'name' in data:
        user.name = data['name']
    if 'vehicle_type' in data:
        user.vehicle_type = data['vehicle_type']
    
    db.session.commit()
    
    return jsonify({
        'message': 'User updated successfully',
        'user': {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'vehicle_type': user.vehicle_type
        }
    }) 