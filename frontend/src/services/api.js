import axios from "axios";
import { toast } from "react-toastify";

// Create an instance of axios with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5002",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000, // 15 seconds
});

// Keep track of retry attempts
const retryMap = new Map();
// Keep track of pending requests to avoid duplicate toasts
const pendingRequests = new Map();
// Flag to track if token refresh is in progress
let isRefreshingToken = false;
// Queue of requests waiting for token refresh
let refreshSubscribers = [];

// Helper function to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
};

// Helper function to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  // Check if expiration time is in the past (with 30-second buffer)
  return Date.now() >= (decoded.exp * 1000) - 30000;
};

// Helper function to check if token will expire soon (within 5 minutes)
const willTokenExpireSoon = (token) => {
  if (!token) return false;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return false;

  // Check if token will expire within 5 minutes
  const expiresIn = decoded.exp * 1000 - Date.now();
  return expiresIn > 0 && expiresIn < 5 * 60 * 1000; // 5 minutes
};

// Helper function to refresh the token
const refreshToken = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No token available to refresh");
  }

  try {
    const response = await axios.post(
      `${api.defaults.baseURL}/api/auth/refresh-token`,
      { token },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data || !response.data.token) {
      throw new Error("No token received from refresh endpoint");
    }

    const newToken = response.data.token;
    const userData = response.data.user || JSON.parse(localStorage.getItem("user"));

    // Update token in localStorage
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify({
      ...userData,
      token: newToken,
    }));

    // Update axios default headers
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

    return newToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    // Clear tokens and user data on refresh failure
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    throw error;
  }
};

// Function to process queued requests after token refresh
const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

// Function to add request to the queue
const addSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// Add retry interceptor with exponential backoff
api.interceptors.response.use(undefined, async (err) => {
  const { config } = err;
  if (!config || !config.retry) {
    return Promise.reject(err);
  }

  const retryKey = `${config.method}-${config.url}`;
  const retryCount = retryMap.get(retryKey) || 0;

  // Only retry for network errors or 5xx errors
  const isNetworkError = !err.response;
  const is5xxError =
    err.response && err.response.status >= 500 && err.response.status < 600;

  if ((isNetworkError || is5xxError) && retryCount < (config.retry || 3)) {
    retryMap.set(retryKey, retryCount + 1);
    // Exponential backoff with jitter
    const baseDelay = 1000 * Math.pow(2, retryCount);
    const jitter = Math.random() * 1000;
    const delayMs = Math.min(baseDelay + jitter, 10000);

    console.log(
      `Retrying request to ${config.url} (attempt ${
        retryCount + 1
      }) after ${delayMs}ms`
    );

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return api(config);
  }

  retryMap.delete(retryKey);
  return Promise.reject(err);
});

// Request ID generator
let requestCounter = 0;
const getRequestId = () => {
  requestCounter += 1;
  return `req_${Date.now()}_${requestCounter}`;
};

// Add a request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    // Generate unique request ID
    const requestId = getRequestId();
    config.requestId = requestId;

    // Add timeout to all requests if not specified
    if (!config.timeout) {
      config.timeout = 15000;
    }

    // Add retry property if not specified
    if (config.retry === undefined) {
      config.retry = 3; // Default to 3 retries
    }

    // Skip token check for auth endpoints to avoid infinite loops
    if (
      config.url && 
      (config.url.includes("/api/auth/login") || 
       config.url.includes("/api/auth/refresh-token") ||
       config.url.includes("/health"))
    ) {
      return config;
    }

    // Get token from localStorage
    let token = localStorage.getItem("token");

    // If token doesn't exist, try to get it from the user object
    if (!token) {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user && user.token) {
            token = user.token;
          } else {
            console.warn("User object exists but has no token");
          }
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
      }
    }

    // Check if token is expired or will expire soon
    if (token && (isTokenExpired(token) || willTokenExpireSoon(token))) {
      if (!isRefreshingToken) {
        isRefreshingToken = true;
        
        try {
          // Try to refresh the token
          const newToken = await refreshToken();
          isRefreshingToken = false;
          onTokenRefreshed(newToken);
          
          // Set the new token in the request
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (error) {
          isRefreshingToken = false;
          refreshSubscribers = [];
          
          // If we can't refresh, redirect to login
          if (!config.url.includes("login")) {
            toast.error("Your session has expired. Please log in again.");
            setTimeout(() => {
              window.location.href = "/login";
            }, 1000);
          }
          
          throw error;
        }
      } else {
        // If a refresh is already in progress, add this request to the queue
        return new Promise((resolve) => {
          addSubscriber((newToken) => {
            config.headers.Authorization = `Bearer ${newToken}`;
            resolve(config);
          });
        });
      }
    } else if (token) {
      // If token exists and is valid, add it to headers
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Track pending request
    pendingRequests.set(requestId, {
      url: config.url,
      method: config.method,
      startTime: Date.now(),
    });

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Remove from pending requests
    if (response.config.requestId) {
      pendingRequests.delete(response.config.requestId);
    }

    // Calculate and log response time for performance monitoring
    if (response.config.requestId) {
      const pendingRequest = pendingRequests.get(response.config.requestId);
      if (pendingRequest) {
        const responseTime = Date.now() - pendingRequest.startTime;
        if (responseTime > 1000) {
          console.warn(
            `Slow response: ${response.config.method} ${response.config.url} took ${responseTime}ms`
          );
        }
      }
    }

    return response;
  },
  (error) => {
    // Remove from pending requests
    if (error.config?.requestId) {
      pendingRequests.delete(error.config.requestId);
    }

    // Handle Axios timeout
    if (error.code === "ECONNABORTED" && error.message.includes("timeout")) {
      console.error("Request timeout:", error.config.url);
      toast.error(`Request timed out. Please try again.`);
      return Promise.reject(error);
    }

    // Handle specific error cases
    if (error.response) {
      // Server responded with an error status
      console.error(
        "Response error:",
        error.response.status,
        error.response.data
      );

      // Handle 401 Unauthorized - could be expired token
      if (error.response.status === 401) {
        // Skip token refresh for auth endpoints to avoid loops
        if (
          error.config.url &&
          (error.config.url.includes("/api/auth/login") ||
           error.config.url.includes("/api/auth/refresh-token"))
        ) {
          // Unauthorized on login or refresh - clear storage and redirect
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          toast.error("Authentication failed. Please log in again.");
          setTimeout(() => {
            window.location.href = "/login";
          }, 1000);
          return Promise.reject(error);
        }

        // Try to refresh the token if we haven't tried already for this request
        if (!error.config._retry) {
          error.config._retry = true;
          
          // If already refreshing, wait for that to complete and then retry
          if (isRefreshingToken) {
            return new Promise((resolve, reject) => {
              addSubscriber((newToken) => {
                error.config.headers.Authorization = `Bearer ${newToken}`;
                resolve(api(error.config));
              });
            });
          }
          
          // Otherwise, refresh the token ourselves
          isRefreshingToken = true;
          
          return refreshToken()
            .then((newToken) => {
              isRefreshingToken = false;
              onTokenRefreshed(newToken);
              error.config.headers.Authorization = `Bearer ${newToken}`;
              return api(error.config);
            })
            .catch((refreshError) => {
              isRefreshingToken = false;
              refreshSubscribers = [];
              
              // If refresh fails, redirect to login
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              toast.error("Your session has expired. Please log in again.");
              setTimeout(() => {
                window.location.href = "/login";
              }, 1000);
              
              return Promise.reject(refreshError);
            });
        }
      } else if (error.response.status === 404) {
        // Not found
        console.error("Resource not found:", error.config.url);
      } else if (error.response.status === 500) {
        // Server error
        toast.error("Server error. Please try again later.");
      } else {
        // Other errors - avoid duplicate error messages
        const errorMessage =
          error.response.data.message ||
          error.response.data.error ||
          "An error occurred";
        toast.error(errorMessage);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error("Network error:", error.request);
      toast.error("Network error. Please check your connection and try again.");
    } else {
      // Something else happened
      console.error("Error:", error.message);
      toast.error("An unexpected error occurred");
    }

    return Promise.reject(error);
  }
);

// Test API connection
export const testApiConnection = async () => {
  try {
    const response = await api.get("/health", {
      timeout: 5000,
      retry: 1,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("API connection test failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Ping server to check if it's running
export const pingServer = async () => {
  try {
    const response = await api.get("/health", {
      timeout: 3000,
      retry: 0,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Server ping failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Function to set auth token
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// Function to cancel all pending requests (useful during page transitions)
export const cancelPendingRequests = () => {
  // Implementation can be added as needed
};

// Helper function to check if a token is valid and not expired
export const isTokenValid = (token) => {
  if (!token) return false;
  return !isTokenExpired(token);
};

// Helper function to get time until expiration
export const getTimeUntilExpiration = (token) => {
  if (!token) return 0;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;

  return Math.max(0, decoded.exp * 1000 - Date.now());
};

// A fallback token refresh setup that can be used if the main one fails
export const setupAutoTokenRefresh = () => (dispatch, getState) => {
  let refreshInterval;

  const checkAndRefreshToken = async () => {
    // Get token from multiple sources
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found, skipping refresh check");
      return;
    }

    try {
      const timeUntilExpiration = getTimeUntilExpiration(token);
      console.log(`Token expiration: ${timeUntilExpiration}ms remaining`);

      // Refresh if token will expire in less than 5 minutes (300000ms)
      if (timeUntilExpiration > 0 && timeUntilExpiration < 300000) {
        console.log("Token expiring soon, refreshing...");
        await refreshToken();
      }
    } catch (error) {
      console.error("Error checking token expiration:", error);
    }
  };

  // Clear any existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Check token every minute
  refreshInterval = setInterval(checkAndRefreshToken, 60000);

  // Initial check
  checkAndRefreshToken();

  return () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  };
};

export default api;
