import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { setAuthToken } from "../../services/api";
import { toast } from "react-toastify";

// Get stored auth data
const storedUser = localStorage.getItem("user");

// Helper function to get error message from various error formats
const getErrorMessage = (error) => {
  return (
    (error.response && error.response.data && error.response.data.message) ||
    (error.response && error.response.data && error.response.data.error) ||
    error.message ||
    "An error occurred"
  );
};

// Helper function to validate token
const isTokenValid = (token) => {
  if (!token) return false;

  try {
    // For JWT tokens, you can check expiration
    // This is a simple check - in production, you might want more validation
    const base64Url = token.split(".")[1];
    if (!base64Url) return false;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const { exp } = JSON.parse(jsonPayload);
    const expired = Date.now() >= exp * 1000;

    return !expired;
  } catch (error) {
    return false;
  }
};

// Helper function to calculate time until token expiration (in milliseconds)
const getTimeUntilExpiration = (token) => {
  if (!token) return 0;

  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return 0;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const { exp } = JSON.parse(jsonPayload);
    return exp * 1000 - Date.now();
  } catch (error) {
    return 0;
  }
};

// Initialize auth header if token exists and is valid
const storedToken = localStorage.getItem("token");
if (storedToken && isTokenValid(storedToken)) {
  api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
} else if (storedToken) {
  // If token exists but is invalid, remove it
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// Async thunks
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, thunkAPI) => {
    try {
      const response = await api.post("/api/users/login", credentials);
      
      // Format response data to ensure consistent structure
      let userData;
      
      if (response.data) {
        if (response.data.data && response.data.data.user) {
          // Standard response format
          userData = {
            ...response.data.data.user,
            token: response.data.data.token,
          };
        } else if (response.data.token && response.data.user) {
          // Alternative response format
          userData = {
            ...response.data.user,
            token: response.data.token,
          };
        } else if (response.data.token) {
          // Minimal format with just token
          userData = {
            token: response.data.token,
            ...response.data, // Include any other fields directly on the data object
          };
        } else {
          // Unable to determine format
          throw new Error(
            "Authentication successful but received unexpected data format"
          );
        }
      }
      
      // Store the user data in local storage
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Update the auth token for API calls
      setAuthToken(userData.token);
      
      return userData;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      if (!userData.password || userData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      const response = await api.post("/api/auth/register", userData);

      // Don't store user in localStorage after registration
      toast.success("Registration successful! Please log in.");

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      // Handle error and provide feedback
      console.error("Registration error:", error);
      const message = getErrorMessage(error);
      toast.error(message);
      throw error; // Re-throw for the component to catch
    }
  }
);

// Check auth status thunk
export const checkAuth = createAsyncThunk("auth/check", async (_, thunkAPI) => {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
      throw new Error("No auth data found");
    }

    // Verify token with backend
    const response = await api.get("/api/auth/verify");
    return { token, user: response.data.user };
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return thunkAPI.rejectWithValue("Authentication failed");
  }
});

export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    // Try to call the logout endpoint, but don't fail if it doesn't exist
    try {
      await api.post("/api/auth/logout");
      console.log("Server logout successful");
    } catch (serverError) {
      // If endpoint doesn't exist (404) or other server error, log it but continue with client-side logout
      console.log(
        "Server logout failed or endpoint not found:",
        serverError.message
      );
      // Don't rethrow - we still want to clear local storage
    }

    // Always clear local storage regardless of server response
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear auth headers
    delete api.defaults.headers.common["Authorization"];

    toast.success("Logged out successfully");
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    // Even if there's some unexpected error, always clear local storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    return thunkAPI.rejectWithValue("Logout failed, but session cleared");
  }
});

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/auth/forgot-password", { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ resetToken, password }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/auth/reset-password/${resetToken}`, {
        password,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message }
      );
    }
  }
);

// Test API connection
export const testConnection = createAsyncThunk(
  "auth/testConnection",
  async (_, thunkAPI) => {
    try {
      console.log("Testing API connection...");
      const response = await api.get("/health");
      console.log("Connection test successful:", response.data);
      return response.data;
    } catch (error) {
      console.error("Connection test failed:", error);
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message || "Connection failed"
      );
    }
  }
);

// Refresh token thunk
export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, thunkAPI) => {
    try {
      console.log("Attempting to refresh token");
      const token = localStorage.getItem("token");

      // Skip refresh if no token exists
      if (!token) {
        throw new Error("No token found");
      }

      // Call your refresh token endpoint
      const response = await api.post("/api/auth/refresh-token", { token });

      if (!response.data || !response.data.token) {
        throw new Error("No new token received");
      }

      const newToken = response.data.token;
      const userData =
        response.data.user || JSON.parse(localStorage.getItem("user"));

      // Update token in localStorage
      localStorage.setItem("token", newToken);
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...userData,
          token: newToken,
        })
      );

      // Update API headers
      setAuthToken(newToken);

      console.log("Token refreshed successfully");

      return {
        user: userData,
        token: newToken,
      };
    } catch (error) {
      console.error("Token refresh error:", error);

      // If refresh fails, we can either log the user out or just return the error
      // Here we're just returning the error and not logging them out automatically
      return thunkAPI.rejectWithValue("Failed to refresh session");
    }
  }
);

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
  loading: false,
  error: null,
  success: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    reset: (state) => {
      state.error = null;
      state.success = false;
      state.loading = false;
    },
    // Add a new reducer to setup auto token refresh
    setupTokenRefresh: (state) => {
      // This is just a marker action that doesn't modify state
      // The actual refresh logic will be in a middleware or effect
      return state;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;

        // Fix user and token storage - handle both response formats
        if (action.payload.user && action.payload.token) {
          // Standard format with separate user and token fields
          state.user = action.payload.user;
          state.token = action.payload.token;

          // Save to localStorage
          localStorage.setItem("token", action.payload.token);
          localStorage.setItem("user", JSON.stringify(action.payload.user));

          // Set token in API headers
          setAuthToken(action.payload.token);
          console.log("Login successful, user and token saved separately");
        } else {
          // Alternative format or direct user object
          state.user = action.payload;
          state.token = action.payload.token;

          // Save to localStorage
          if (action.payload.token) {
            localStorage.setItem("token", action.payload.token);
            localStorage.setItem("user", JSON.stringify(action.payload));

            // Set token in API headers
            setAuthToken(action.payload.token);
            console.log("Login successful, full payload saved as user");
          } else {
            console.error("Login response missing token:", action.payload);
          }
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
        state.success = false;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Registration failed";
      })
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
        state.success = true;
      })
      .addCase(logout.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to send reset email";
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to reset password";
      })
      // Test connection cases
      .addCase(testConnection.pending, (state) => {
        state.isLoading = true;
        state.message = "Testing connection...";
      })
      .addCase(testConnection.fulfilled, (state) => {
        state.isLoading = false;
        state.isError = false;
        state.message = "Connection successful";
      })
      .addCase(testConnection.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload || "Connection failed";
      })
      // Handle refreshToken
      .addCase(refreshToken.pending, (state) => {
        state.refreshing = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshing = false;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.refreshing = false;
        // We don't immediately log the user out, that will happen
        // naturally when they try to access a protected resource
        // with an invalid token
        state.refreshError = action.payload;
      });
  },
});

export const {
  resetError,
  clearSuccess,
  setAuthenticated,
  reset,
  setupTokenRefresh,
} = authSlice.actions;
export default authSlice.reducer;

// Export a function to setup automatic token refresh
export const setupAutoTokenRefresh = () => (dispatch, getState) => {
  let refreshInterval;

  const checkAndRefreshToken = () => {
    const { auth } = getState();
    const token = auth.token || localStorage.getItem("token");

    if (!token) {
      console.log("No token found, skipping refresh check");
      return;
    }

    const timeUntilExpiration = getTimeUntilExpiration(token);
    console.log(`Token expiration: ${timeUntilExpiration}ms remaining`);

    // Refresh if token will expire in less than 5 minutes (300000ms)
    if (timeUntilExpiration > 0 && timeUntilExpiration < 300000) {
      console.log("Token expiring soon, refreshing...");
      dispatch(refreshToken());
    }

    // If token is already expired, we'll let the API interceptor handle it
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
