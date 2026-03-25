/**
 * Utility functions for role-based permissions
 */

// Define role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY = ["student", "lecturer", "admin"];

/**
 * Check if a user has a specific role
 * @param {string} userRole - The user's role
 * @param {string} requiredRole - The role to check against
 * @returns {boolean} - Whether the user has the required role
 */
export const hasRole = (userRole, requiredRole) => {
  // No longer need to convert 'user' to 'student' since we're removing the 'user' role
  return userRole === requiredRole;
};

/**
 * Check if a user has at least the specified role level
 * @param {string} userRole - The user's role
 * @param {string} minimumRole - The minimum role required
 * @returns {boolean} - Whether the user has at least the minimum role
 */
export const hasMinimumRole = (userRole, minimumRole) => {
  // No longer need to convert 'user' to 'student' since we're removing the 'user' role
  const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole);
  const minimumRoleIndex = ROLE_HIERARCHY.indexOf(minimumRole);

  // If role not found in hierarchy, default to no permission
  if (userRoleIndex === -1 || minimumRoleIndex === -1) return false;

  return userRoleIndex >= minimumRoleIndex;
};

/**
 * Check if a user has any of the specified roles
 * @param {string} userRole - The user's role
 * @param {Array<string>} allowedRoles - Array of roles that are allowed
 * @returns {boolean} - Whether the user has any of the allowed roles
 */
export const hasAnyRole = (userRole, allowedRoles) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;

  // No longer need to convert 'user' to 'student' since we're removing the 'user' role
  // Also removing special case handling for 'user' role
  return allowedRoles.includes(userRole);
};

/**
 * Get permissions object based on user role
 * @param {string} userRole - The user's role
 * @returns {Object} - Object containing boolean flags for various permissions
 */
export const getPermissions = (userRole) => {
  // No longer need to convert 'user' to 'student' since we're removing the 'user' role

  // Default permissions (most restrictive)
  const permissions = {
    // Common permissions
    canViewDashboard: true,
    canViewProfile: true,
    canUpdateProfile: true,
    canViewNotifications: true,
    canViewSchedule: true,

    // Event-related permissions
    canViewEvents: true,
    canCreateEvents: false,
    canEditEvents: false,
    canDeleteEvents: false,
    canRegisterForEvents: true,

    // Schedule-related permissions
    canViewOwnSchedule: true,
    canViewAllSchedules: false,
    canManageSchedules: false,

    // Course-related permissions
    canViewEnrolledCourses: true,
    canViewAllCourses: false,
    canManageCourses: false,
    canEnrollInCourses: false,

    // User management permissions
    canViewUsers: false,
    canManageUsers: false,
    canAssignRoles: false,

    // Communication permissions
    canMessageStudents: false,
    canMessageLecturers: false,
    canMessageAdmins: false,
    canSendMessages: true,
    canCreateGroupChats: false,
    canAddUsersToGroups: false,
    canRemoveUsersFromGroups: false,

    // Data management permissions
    canExportData: false,
    canImportData: false,
    canGenerateReports: false,

    // System management permissions
    canManageSettings: false,
    canViewAnalytics: false,
    canManageNotifications: false,
  };

  // Enhance permissions based on role
  if (hasRole(userRole, "student")) {
    // Student permissions
    permissions.canExportData = true;
    permissions.canRegisterForEvents = true;
    permissions.canViewEnrolledCourses = true;
    permissions.canMessageLecturers = true;
    permissions.canViewOwnSchedule = true;
    permissions.canSendMessages = true;
  }

  if (hasMinimumRole(userRole, "lecturer")) {
    // Lecturer permissions
    permissions.canCreateEvents = true;
    permissions.canEditEvents = true;
    permissions.canGenerateReports = true;
    permissions.canViewAllCourses = true;
    permissions.canManageCourses = true;
    permissions.canMessageStudents = true;
    permissions.canMessageLecturers = true;
    permissions.canViewAllSchedules = true;
    permissions.canManageSchedules = true;
    permissions.canEnrollInCourses = true;
    permissions.canExportData = true;
    permissions.canCreateGroupChats = true;
    permissions.canAddUsersToGroups = true;
  }

  if (hasMinimumRole(userRole, "admin")) {
    // Admin permissions - full access
    permissions.canCreateEvents = true;
    permissions.canEditEvents = true;
    permissions.canDeleteEvents = true;
    permissions.canManageUsers = true;
    permissions.canImportData = true;
    permissions.canViewUsers = true;
    permissions.canAssignRoles = true;
    permissions.canMessageAdmins = true;
    permissions.canManageSettings = true;
    permissions.canViewAnalytics = true;
    permissions.canManageNotifications = true;
    permissions.canRemoveUsersFromGroups = true;
  }

  return permissions;
};

// Define the permissions object
const permissions = {
  hasRole,
  hasMinimumRole,
  hasAnyRole,
  getPermissions,
};

export default permissions;
