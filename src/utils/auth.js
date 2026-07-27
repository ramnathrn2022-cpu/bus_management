import { getToken, clearAuth } from './token';

/**
 * Decodes a JWT token without external libraries
 * @param {string} token 
 * @returns {object|null} payload
 */
export const decodeToken = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

/**
 * Checks if the JWT token is expired
 * @param {string} token 
 * @returns {boolean}
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  // exp is in seconds, convert to ms
  return decoded.exp * 1000 < Date.now();
};

/**
 * Checks if the user is currently authenticated with a valid token
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  const expired = isTokenExpired(token);
  if (expired) {
    clearAuth();
    return false;
  }
  return true;
};
