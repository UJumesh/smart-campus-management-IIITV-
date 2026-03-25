import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import api from "../api";

// Get user from localStorage
const user = JSON.parse(localStorage.getItem("user"));

const initialState = {
  user: user ? user : null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
  isAuthenticated: user ? true : false,
};

// Register user
export const register = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      const response = await api.post("/api/auth/register", userData);

      if (response.data) {
        // Don't store user data or token after registration
        toast.success(
          "Registration successful! Please log in with your credentials."
        );
      }

      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.error) ||
        error.message ||
        error.toString();

      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Login user
export const login = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      console.log(`Login attempt for: ${userData.email}`);
      const response = await api.post("/api/auth/login", userData);
      console.log(`Login response received: ${response.status}`);

      if (response.data) {
        console.log(`Response structure:`, Object.keys(response.data));

        // Handle different response formats
        let userObj;
        let token;

        if (response.data.token && response.data.data) {
          // Standard format - separate token and data
          console.log("Standard response format detected");
          userObj = response.data.data;
          token = response.data.token;
        } else if (response.data.user && response.data.token) {
          // Alternative format
          console.log("Alternative response format detected");
          userObj = response.data.user;
          token = response.data.token;
        } else if (
          typeof response.data === "object" &&
          response.data !== null
        ) {
          // Fallback - assume the response itself contains user data
          console.log("Using response data as user object");
          userObj = response.data;
          token = response.data.token || null;
        }

        if (userObj) {
          // Store user data with token
          const userData = {
            ...userObj,
            token: token,
          };
          localStorage.setItem("user", JSON.stringify(userData));

          // Also store token separately for easier access
          if (token) {
            localStorage.setItem("token", token);
          }

          console.log(
            `Authentication successful: ${token} ( ${userObj.role} )`
          );
          toast.success("Login successful");

          return { data: userObj, token };
        }
      }

      return response.data;
    } catch (error) {
      // Log the error for debugging
      console.error("Login error:", error);

      // Extract the error message from the response
      let errorMessage =
        "Authentication failed. Please check your credentials.";

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log("Response error data:", error.response.data);

        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 401) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (error.response.status === 404) {
          errorMessage = "Login service unavailable. Please try again later.";
        } else if (error.response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.log("No response received:", error.request);
        errorMessage =
          "No response from server. Please check your internet connection.";
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Request error:", error.message);
        errorMessage = error.message || "An error occurred during login.";
      }

      // Display the error message to the user using toast
      toast.error(errorMessage);

      // Return the error message to be stored in the state
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Check authentication status
export const checkAuth = createAsyncThunk("auth/check", async (_, thunkAPI) => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem("token");

    if (!token) {
      return thunkAPI.rejectWithValue("No authentication token found");
    }

    // Try to verify the token with the backend
    const response = await api.get("/api/auth/verify");

    if (response.data && response.data.data) {
      // Authentication successful
      return {
        data: response.data.data,
        token,
      };
    } else {
      return thunkAPI.rejectWithValue("Authentication failed");
    }
  } catch (error) {
    // Clear local storage on authentication failure
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    const message =
      (error.response && error.response.data && error.response.data.error) ||
      error.message ||
      error.toString();

    return thunkAPI.rejectWithValue("Authentication failed: " + message);
  }
});

// Logout user
export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    // Try to call the logout endpoint
    await api.get("/api/auth/logout");

    // Remove user data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    toast.success("Logged out successfully");
    return null;
  } catch (error) {
    console.error("Logout error:", error);

    // Even if the server request fails, clear local storage
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Return a success value anyway since we've logged out locally
    return null;
  }
});

// Forgot password
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, thunkAPI) => {
    try {
      const response = await api.post("/api/auth/forgotpassword", { email });

      toast.success(response.data.message || "Password reset email sent");

      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.error) ||
        error.message ||
        error.toString();

      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Reset password
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ resetToken, password }, thunkAPI) => {
    try {
      const response = await api.put(`/auth/resetpassword/${resetToken}`, {
        password,
      });
      toast.success("Password reset successful");
      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.error) ||
        error.message ||
        error.toString();

      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get current user
export const getMe = createAsyncThunk("auth/getMe", async (_, thunkAPI) => {
  try {
    const response = await api.get("/api/auth/me");

    return response.data;
  } catch (error) {
    const message =
      (error.response && error.response.data && error.response.data.error) ||
      error.message ||
      error.toString();

    // Don't show toast for getMe errors, as they're common for unauthenticated users
    return thunkAPI.rejectWithValue(message);
  }
});

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message =
          "Registration successful! Please log in with your credentials.";
        // Don't set user after registration
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.data
          ? {
              ...action.payload.data,
              token: action.payload.token,
            }
          : null;
        state.isAuthenticated = !!state.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.data
          ? {
              ...action.payload.data,
              token: action.payload.token,
            }
          : null;
        state.isAuthenticated = !!state.user;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get Current User
      .addCase(getMe.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Get token from existing user
        const token = state.user?.token;
        state.user = action.payload.data
          ? {
              ...action.payload.data,
              token: token, // Preserve the token
            }
          : null;
        state.isAuthenticated = !!state.user;
      })
      .addCase(getMe.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.isAuthenticated = false;
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;
