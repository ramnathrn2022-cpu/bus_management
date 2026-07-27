import axios from 'axios';
import { getToken, clearAuth } from '../utils/token';

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT Bearer Token if it exists
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global response error interceptor (handles token expiration & formatting)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 1. NO INTERNET / NETWORK ERROR
    if (!error.response) {
      const networkError = {
        status: 0,
        message: 'No Internet connection or server is unreachable. Please check your network.',
        detail: 'Network Error'
      };
      return Promise.reject(networkError);
    }

    const { status, data } = error.response;
    const detail = data?.detail || 'Something went wrong. Please try again.';

    // 2. TOKEN EXPIRED / UNAUTHORIZED (401)
    if (status === 401) {
      clearAuth();
      window.dispatchEvent(new Event('auth-expired'));
      const expiredError = {
        status: 401,
        message: detail === 'Signature has expired.' || detail === 'Invalid or Expired Token' 
          ? 'Your session has expired. Please log in again.' 
          : detail,
        detail
      };
      return Promise.reject(expiredError);
    }

    // 3. SEAT ALREADY BOOKED OR OTHER VALIDATION ERRORS (400, 422, 404, 500)
    const formattedError = {
      status,
      message: typeof detail === 'string' ? detail : JSON.stringify(detail),
      detail
    };

    return Promise.reject(formattedError);
  }
);

export default apiClient;
