import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from '../store/slices/authSlice';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';

const PrivateRoute = ({ children, roles = [] }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const { isAuthenticated, loading, user, error } = useSelector((state) => state.auth);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        console.log('Verifying authentication...');
        const result = await dispatch(checkAuth()).unwrap();
        console.log('Auth verification result:', result);
        setIsVerifying(false);
      } catch (error) {
        console.error('Auth verification failed:', error);
        setIsVerifying(false);
      }
    };

    // Check if we have stored credentials
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    console.log('Stored auth state:', { 
      hasToken: !!token, 
      hasUser: !!storedUser,
      currentPath: location.pathname
    });

    verifyAuth();
  }, [dispatch, location]);

  // Debug logging
  useEffect(() => {
    console.log('Auth state:', {
      isVerifying,
      loading,
      isAuthenticated,
      userRole: user?.role,
      requiredRoles: roles,
      currentPath: location.pathname
    });
  }, [isVerifying, loading, isAuthenticated, user, roles, location]);

  if (isVerifying || loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body2" color="textSecondary">
          Verifying access...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    // Store the attempted path for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if route requires specific roles
  if (roles.length > 0) {
    const userRole = user?.role || 'student';
    console.log('Checking role access:', { userRole, requiredRoles: roles });
    
    if (!roles.includes(userRole)) {
      console.log('Access denied: insufficient role permissions');
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          p={3}
        >
          <Alert 
            severity="error" 
            sx={{ mb: 2, maxWidth: 400 }}
          >
            You don't have permission to access this page
          </Alert>
          <Typography variant="body1" color="textSecondary" align="center" sx={{ maxWidth: 400 }}>
            Required role: {roles.join(' or ')}
            <br />
            Your role: {userRole}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Please contact your administrator if you believe this is an error.
          </Typography>
        </Box>
      );
    }
  }

  if (error) {
    console.log('Auth error:', error);
  }

  console.log('Access granted:', {
    path: location.pathname,
    userRole: user?.role,
    requiredRoles: roles
  });

  return children;
};

export default PrivateRoute; 