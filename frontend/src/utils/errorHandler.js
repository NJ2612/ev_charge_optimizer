import axios from 'axios';

export class APIError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

export const handleAPIError = (error) => {
  if (axios.isAxiosError(error)) {
    // Handle Axios errors
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'An error occurred';
      throw new APIError(message, error.response.status, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      throw new APIError('No response from server', 503);
    } else {
      // Error in request configuration
      throw new APIError('Request configuration error', 400);
    }
  }
  
  // Handle non-Axios errors
  throw new APIError(error.message || 'An unexpected error occurred', 500);
};

export const getErrorMessage = (error) => {
  if (error instanceof APIError) {
    return error.message;
  }

  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.status === 404) {
      return 'Resource not found';
    }
    if (error.response?.status === 401) {
      return 'Authentication required';
    }
    if (error.response?.status === 403) {
      return 'Not authorized';
    }
    if (error.response?.status >= 500) {
      return 'Server error occurred';
    }
    return error.message;
  }

  return 'An unexpected error occurred';
};

export const isAuthenticationError = (error) => {
  return error instanceof APIError && error.status === 401;
};

export const isAuthorizationError = (error) => {
  return error instanceof APIError && error.status === 403;
};

export const isNetworkError = (error) => {
  return axios.isAxiosError(error) && !error.response;
};

export const isValidationError = (error) => {
  return error instanceof APIError && error.status === 400;
}; 