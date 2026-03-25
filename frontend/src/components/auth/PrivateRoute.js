import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { checkAuth } from "../../store/slices/authSlice";
import {
  CircularProgress,
  Box,
  Typography,
  Button,
  Alert,
} from "@mui/material";
import { hasAnyRole } from "../../utils/permissions";

const PrivateRoute = ({ children, roles }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading, user, error } = useSelector(
    (state) => state.auth
  );
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Add more logging to troubleshoot issues
        console.log('PrivateRoute - Checking auth status...');
        console.log('PrivateRoute - isAuthenticated:', isAuthenticated);
        console.log('PrivateRoute - user:', user);
        
        if (!isAuthenticated || !user) {
          // Gather information from localStorage as fallback
          const storedToken = localStorage.getItem('token');
          const storedUser = localStorage.getItem('user');
          
          console.log('PrivateRoute - Found in localStorage:', 
            storedToken ? 'token exists' : 'no token',
            storedUser ? 'user exists' : 'no user');
          
          // Try to restore from localStorage if possible
          if (storedToken && storedUser) {
            console.log('PrivateRoute - Restoring auth from localStorage');
            try {
              const parsedUser = JSON.parse(storedUser);
              if (parsedUser && parsedUser.role) {
                // User and token exist in localStorage, consider authenticated
                console.log('PrivateRoute - Valid user found in localStorage');
                setIsChecking(false);
                return;
              }
            } catch (parseError) {
              console.error('PrivateRoute - Error parsing stored user:', parseError);
            }
          }
          
          // Otherwise verify with the server
          console.log('PrivateRoute - Verifying with server via checkAuth');
          await dispatch(checkAuth()).unwrap();
        }
      } catch (err) {
        console.error('PrivateRoute - Auth verification failed:', err);
        // Clear localStorage on verification failure
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        console.log('PrivateRoute - Auth check complete');
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [dispatch, isAuthenticated, user]);

  // Show loading state
  if (loading || isChecking) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "background.default",
        }}
      >
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
          Verifying your credentials...
        </Typography>
      </Box>
    );
  }

  // Handle authentication error
  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "background.default",
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ mb: 2, maxWidth: 400 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/login")}
        >
          Return to Login
        </Button>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (roles && roles.length > 0) {
    // Get the user's role, defaulting to student if not available
    const userRole = user?.role || "student";

    if (!hasAnyRole(userRole, roles)) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            backgroundColor: "background.default",
            p: 3,
          }}
        >
          <Alert severity="error" sx={{ mb: 2, maxWidth: 400 }}>
            Access Denied
          </Alert>
          <Typography
            variant="body1"
            color="text.secondary"
            align="center"
            sx={{ maxWidth: 400, mb: 2 }}
          >
            You don't have permission to access this page.
            {userRole && (
              <>
                <br />
                Your role: {userRole}
                <br />
                Required roles: {roles.join(", ")}
              </>
            )}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/dashboard")}
          >
            Return to Dashboard
          </Button>
        </Box>
      );
    }
  }

  return children;
};

export default PrivateRoute;
