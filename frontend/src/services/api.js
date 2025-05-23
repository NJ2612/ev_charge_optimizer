import axios from 'axios';
import { handleAPIError } from '../utils/errorHandler';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Station endpoints
export const getStations = async () => {
  try {
    const response = await api.get('/stations');
    return response;
  } catch (error) {
    throw handleAPIError(error);
  }
};

export const getStation = async (id) => {
  try {
    const response = await api.get(`/station/${id}`);
    return response;
  } catch (error) {
    throw handleAPIError(error);
  }
};

export const updateStation = async (id, data) => {
  try {
    const response = await api.put(`/station/${id}`, data);
    return response;
  } catch (error) {
    throw handleAPIError(error);
  }
};

// Route endpoints
export const optimizeRoute = async (data) => {
  try {
    const response = await api.post('/route', data);
    return response;
  } catch (error) {
    throw handleAPIError(error);
  }
};

export const getUserRoutes = async (userId) => {
  try {
    const response = await api.get(`/routes/user/${userId}`);
    return response;
  } catch (error) {
    throw handleAPIError(error);
  }
};

// User endpoints
export const registerUser = async (data) => {
  try {
    const response = await api.post('/user', data);
    return response;
  } catch (error) {
    throw handleAPIError(error);
  }
};

export const getUser = async (id) => {
  try {
    const response = await api.get(`/user/${id}`);
    return response;
  } catch (error) {
    throw handleAPIError(error);
  }
};

export const updateUser = async (id, data) => {
  try {
    const response = await api.put(`/user/${id}`, data);
    return response;
  } catch (error) {
    throw handleAPIError(error);
  }
};

// Prediction endpoints
export const getStationPredictions = async (stationId) => {
  try {
    const response = await api.get(`/predictions/station/${stationId}`);
    return response;
  } catch (error) {
    throw handleAPIError(error);
  }
};

export const updatePredictions = async () => {
  try {
    const response = await api.post('/predictions/update');
    return response;
  } catch (error) {
    throw handleAPIError(error);
  }
};

// Auth token management
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api; 