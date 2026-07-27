/**
 * Token and auth storage utility for LocalStorage
 */

export const setToken = (token) => localStorage.setItem('token', token);
export const getToken = () => localStorage.getItem('token');

export const setRole = (role) => localStorage.setItem('role', role);
export const getRole = () => localStorage.getItem('role');

export const setUserId = (userId) => localStorage.setItem('user_id', userId);
export const getUserId = () => localStorage.getItem('user_id');

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user_id');
};

export const getAuthData = () => {
  return {
    token: getToken(),
    role: getRole(),
    userId: getUserId(),
  };
};
