import apiClient from './apiClient';

/**
 * Driver API services
 */
export const driverAPI = {
  /**
   * Add a new driver (Owner only)
   * @param {object} driverData { user_id, license_number, phone }
   */
  addDriver: async (driverData) => {
    const response = await apiClient.post('/add-driver', driverData);
    return response.data;
  },

  /**
   * Assign a driver to a specific bus (Owner only)
   * @param {object} assignData { driver_id, bus_id }
   */
  assignDriver: async (assignData) => {
    const response = await apiClient.post('/assign-driver', assignData);
    return response.data;
  },

  /**
   * Get all registered drivers (Owner/Manager only)
   */
  getAllDrivers: async () => {
    const response = await apiClient.get('/drivers');
    return response.data;
  },

  /**
   * Get details of a single driver (Owner/Manager only)
   * @param {number} driverId
   */
  getDriverById: async (driverId) => {
    const response = await apiClient.get(`/driver/${driverId}`);
    return response.data;
  },

  /**
   * Remove a driver (Owner only)
   * @param {number} driverId
   */
  removeDriver: async (driverId) => {
    const response = await apiClient.delete(`/driver/${driverId}`);
    return response.data;
  },

  /**
   * Get the bus assigned to the current driver (Driver only)
   */
  getMyAssignedBus: async () => {
    const response = await apiClient.get('/my-bus');
    return response.data;
  }
};

export default driverAPI;
