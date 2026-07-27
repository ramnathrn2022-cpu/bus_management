import apiClient from './apiClient';

/**
 * Trip & Tracking API services
 */
export const tripAPI = {
  /**
   * Start a new trip (Driver only)
   * @param {object} tripData { bus_id, driver_id }
   */
  startTrip: async (tripData) => {
    const response = await apiClient.post('/trips/start', tripData);
    return response.data;
  },

  /**
   * Send live GPS location updates (Driver only)
   * @param {object} locationData { driver_id, bus_id, trip_id, latitude, longitude, speed, status, timestamp }
   */
  updateLocation: async (locationData) => {
    const response = await apiClient.post('/trips/update-location', locationData);
    return response.data;
  },

  /**
   * Update the status of a trip (Driver only)
   * @param {number} tripId
   * @param {string} status 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'
   */
  updateStatus: async (tripId, status) => {
    const response = await apiClient.post(`/trips/update-status?trip_id=${tripId}&status=${status}`);
    return response.data;
  },

  /**
   * Get all active trips (Owner/Manager/User)
   */
  getActiveTrips: async () => {
    const response = await apiClient.get('/trips/active');
    return response.data;
  },

  /**
   * Get the current active trip for a driver (Driver/Owner/Manager)
   * @param {number} driverId
   */
  getDriverActiveTrip: async (driverId) => {
    const response = await apiClient.get(`/trips/driver/${driverId}/active`);
    return response.data;
  },

  /**
   * Get the current active trip for a bus (User/Owner/Manager)
   * @param {number} busId
   */
  getBusActiveTrip: async (busId) => {
    const response = await apiClient.get(`/trips/bus/${busId}/active`);
    return response.data;
  }
};

export default tripAPI;
