import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { checkAuth, logout } from "../store/slices/authSlice";
import { hasAnyRole, getPermissions } from "../utils/permissions";

/**
 * Custom hook for authentication-related functionality
 * @param {Object} options - Configuration options
 * @param {boolean} options.redirectIfNotAuth - Whether to redirect to login if not authenticated
 * @param {string} options.redirectTo - Path to redirect to if not authenticated
 * @param {Array<string>} options.requiredRoles - Roles required to access the current page
 * @returns {Object} Authentication state and functions
 */
const useAuth = (options = {}) => {
  const {
    redirectIfNotAuth = false,
    redirectTo = "/login",
    requiredRoles = [],
  } = options;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );

  // Default to student role if no role provided
  const userRole = user?.role || "student";

  // Get permissions based on user role, default to student if no role
  const permissions = getPermissions(userRole);

  // Check if user has required role
  const hasRequiredRole = useCallback(() => {
    if (!requiredRoles.length) return true;
    // Default to student role if no role provided
    const role = user?.role || "student";
    return hasAnyRole(role, requiredRoles);
  }, [user, requiredRoles]);

  // Verify authentication status
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      dispatch(checkAuth());
    }
  }, [dispatch, isAuthenticated, loading]);

  // Handle redirection if not authenticated
  useEffect(() => {
    if (redirectIfNotAuth && !loading && !isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [redirectIfNotAuth, navigate, redirectTo, isAuthenticated, loading]);

  // Handle role-based access
  useEffect(() => {
    if (isAuthenticated && requiredRoles.length > 0 && !hasRequiredRole()) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, requiredRoles, hasRequiredRole, navigate]);

  // Logout function
  const handleLogout = useCallback(() => {
    dispatch(logout());
    // The redirection will be handled by the logout thunk
  }, [dispatch]);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    hasRequiredRole,
    permissions,
    logout: handleLogout,
  };
};

export default useAuth;
