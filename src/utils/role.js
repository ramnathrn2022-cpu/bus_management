/**
 * Role definitions and checking helper
 */

export const ROLES = {
  OWNER: 'owner',
  USER: 'user',
  DRIVER: 'driver',
  MANAGER: 'manager'
};

/**
 * Checks if a user's role is allowed
 * @param {string} userRole 
 * @param {string|string[]} allowedRoles 
 * @returns {boolean}
 */
export const hasPermission = (userRole, allowedRoles) => {
  if (!userRole) return false;
  
  const normalizedUserRole = userRole.toLowerCase();
  
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.map(r => r.toLowerCase()).includes(normalizedUserRole);
  }
  
  return normalizedUserRole === allowedRoles.toLowerCase();
};
