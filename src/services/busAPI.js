import apiClient from './apiClient';

/**
 * Bus API services
 */
export const busAPI = {
  /**
   * Get all buses
   */
  getAllBuses: async () => {
    const response = await apiClient.get('/buses');
    return response.data;
  },

  /**
   * Get single bus details
   * @param {number} busId
   */
  getBusById: async (busId) => {
    const response = await apiClient.get(`/bus/${busId}`);
    return response.data;
  },

  /**
   * Add a new bus (Owner only)
   * @param {object} busData { bus_number, source, destination, total_seats }
   */
  addBus: async (busData) => {
    const response = await apiClient.post('/add-bus', busData);
    return response.data;
  },

  /**
   * Delete a bus (Owner only)
   * @param {number} busId
   */
  deleteBus: async (busId) => {
    const response = await apiClient.delete(`/bus/${busId}`);
    return response.data;
  },

  /**
   * Get available seats and remaining seat count for a bus
   * @param {number} busId
   */
  getAvailableSeats: async (busId) => {
    const response = await apiClient.get(`/available-seats/${busId}`);
    return response.data;
  },

  /**
   * Get total booking count for a single bus (Owner/Manager only)
   * @param {number} busId
   */
  getBusBookingCount: async (busId) => {
    const response = await apiClient.get(`/bus-bookings/${busId}`);
    return response.data;
  }
};

export default busAPI;
