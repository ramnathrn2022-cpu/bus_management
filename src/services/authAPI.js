import apiClient from './apiClient';

/**
 * Authentication API services
 */
export const authAPI = {
  /**
   * Register a new user
   * @param {object} userData { name, email, password, role }
   */
  register: async (userData) => {
    const response = await apiClient.post('/register', userData);
    return response.data;
  },

  /**
   * Log in user and receive JWT
   * @param {object} credentials { email, password }
   */
  login: async (credentials) => {
    const response = await apiClient.post('/login', credentials);
    return response.data;
  },

  /**
   * Fetch current authenticated user profile
   */
  getProfile: async () => {
    const response = await apiClient.get('/me');
    return response.data;
  }
};

export default authAPI;
