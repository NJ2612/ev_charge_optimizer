from flask import jsonify
from werkzeug.exceptions import HTTPException
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from functools import wraps
import traceback

class APIError(Exception):
    """Base class for API errors"""
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['message'] = self.message
        rv['status'] = 'error'
        return rv

class ValidationError(APIError):
    """Raised when input validation fails"""
    def __init__(self, message, payload=None):
        super().__init__(message, status_code=400, payload=payload)

class AuthenticationError(APIError):
    """Raised when authentication fails"""
    def __init__(self, message="Authentication required", payload=None):
        super().__init__(message, status_code=401, payload=payload)

class AuthorizationError(APIError):
    """Raised when user doesn't have required permissions"""
    def __init__(self, message="Not authorized", payload=None):
        super().__init__(message, status_code=403, payload=payload)

class NotFoundError(APIError):
    """Raised when resource is not found"""
    def __init__(self, message="Resource not found", payload=None):
        super().__init__(message, status_code=404, payload=payload)

def handle_error(app):
    """Register error handlers with the Flask app"""
    
    @app.errorhandler(APIError)
    def handle_api_error(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(HTTPException)
    def handle_http_error(error):
        response = jsonify({
            'status': 'error',
            'message': error.description,
        })
        response.status_code = error.code
        return response

    @app.errorhandler(SQLAlchemyError)
    def handle_db_error(error):
        if isinstance(error, IntegrityError):
            message = "Database integrity error. Possible duplicate entry."
        else:
            message = "Database error occurred."
        
        response = jsonify({
            'status': 'error',
            'message': message
        })
        response.status_code = 500
        return response

    @app.errorhandler(Exception)
    def handle_generic_error(error):
        # Log the full error with traceback
        app.logger.error(f"Unhandled exception: {str(error)}")
        app.logger.error(traceback.format_exc())
        
        if app.debug:
            message = str(error)
        else:
            message = "An unexpected error occurred."
        
        response = jsonify({
            'status': 'error',
            'message': message
        })
        response.status_code = 500
        return response

def error_handler(f):
    """Decorator to handle errors in route functions"""
    @wraps(f)
    def wrapped(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except APIError as e:
            raise
        except SQLAlchemyError as e:
            raise
        except Exception as e:
            raise APIError(str(e), 500)
    return wrapped 