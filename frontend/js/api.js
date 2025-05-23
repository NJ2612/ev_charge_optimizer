const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
    async getStations() {
        try {
            const response = await fetch(`${API_BASE_URL}/stations`);
            if (!response.ok) throw new Error('Failed to fetch stations');
            return await response.json();
        } catch (error) {
            console.error('Error fetching stations:', error);
            throw error;
        }
    }

    async getRoute(params) {
        try {
            const response = await fetch(`${API_BASE_URL}/route`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });
            if (!response.ok) throw new Error('Failed to find route');
            return await response.json();
        } catch (error) {
            console.error('Error finding route:', error);
            throw error;
        }
    }

    async getStationStatus(stationId) {
        try {
            const response = await fetch(`${API_BASE_URL}/station/${stationId}/status`);
            if (!response.ok) throw new Error('Failed to fetch station status');
            return await response.json();
        } catch (error) {
            console.error('Error fetching station status:', error);
            throw error;
        }
    }

    async updateStationStatus(stationId, status) {
        try {
            const response = await fetch(`${API_BASE_URL}/station/${stationId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(status),
            });
            if (!response.ok) throw new Error('Failed to update station status');
            return await response.json();
        } catch (error) {
            console.error('Error updating station status:', error);
            throw error;
        }
    }
}

const apiService = new ApiService(); 