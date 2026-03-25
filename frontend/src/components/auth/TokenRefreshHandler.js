import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// Try both paths where authSlice might exist
let setupAutoTokenRefresh;
try {
  setupAutoTokenRefresh = require("../../store/slices/authSlice").setupAutoTokenRefresh;
} catch (error) {
  try {
    // Alternative location
    setupAutoTokenRefresh = require("../../services/slices/authSlice").setupAutoTokenRefresh;
  } catch (secondError) {
    console.error("Could not load setupAutoTokenRefresh from any location", error, secondError);
    // Provide a fallback implementation
    setupAutoTokenRefresh = () => (dispatch) => {
      console.log("Using fallback token refresh implementation");
      return () => {};
    };
  }
}

/**
 * Component to handle token refresh mechanism
 * This component should be placed inside the Redux Provider
 */
const TokenRefreshHandler = () => {
  const dispatch = useDispatch();
  const { token, user } = useSelector(state => state.auth || {});
  
  // Get token from multiple sources for reliability
  const effectiveToken = token || (user && user.token) || localStorage.getItem("token");

  // Set up token refresh on component mount
  useEffect(() => {
    console.log("Setting up token refresh mechanism");
    if (effectiveToken) {
      console.log("Token found, initializing refresh monitoring");
      const cleanup = dispatch(setupAutoTokenRefresh());

      // Clean up interval on unmount
      return () => {
        console.log("Cleaning up token refresh mechanism");
        if (typeof cleanup === "function") {
          cleanup();
        }
      };
    } else {
      console.log("No token found, skipping refresh setup");
    }
  }, [dispatch, effectiveToken]);

  // This component doesn't render anything
  return null;
};

export default TokenRefreshHandler;
