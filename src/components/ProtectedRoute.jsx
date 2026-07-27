import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken, getRole, clearAuth } from '../utils/token';
import { isTokenExpired } from '../utils/auth';
import { hasPermission } from '../utils/role';

/**
 * Route protection guard that checks for authenticated tokens and role permissions
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = getToken();
  const role = getRole();

  // If no token exists, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If token is expired, clear local storage and redirect to login
  if (isTokenExpired(token)) {
    clearAuth();
    return <Navigate to="/login" replace />;
  }

  // If user role is not allowed for this route, redirect them to their respective dashboard
  if (allowedRoles && !hasPermission(role, allowedRoles)) {
    if (role === 'owner') {
      return <Navigate to="/owner" replace />;
    } else if (role === 'user') {
      return <Navigate to="/user" replace />;
    } else if (role === 'driver') {
      return <Navigate to="/driver" replace />;
    } else if (role === 'manager') {
      return <Navigate to="/manager" replace />;
    }
    
    // Fallback clear
    clearAuth();
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
