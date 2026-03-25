import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { toast } from "react-toastify";

// Get user from localStorage
const user = JSON.parse(localStorage.getItem("user"));

const initialState = {
  user: user || null,
  token: localStorage.getItem("token") || null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: "",
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
      console.log("Login attempt with:", {
        email: userData.email,
        passwordLength: userData.password?.length,
      });

      const response = await api.post("/api/auth/login", userData);

      console.log("Login response:", {
        success: response.data.success,
        hasToken: Boolean(response.data.token),
        hasUser: Boolean(response.data.user),
        userFields: response.data.user ? Object.keys(response.data.user) : [],
      });

      if (
        !response.data.success ||
        !response.data.token ||
        !response.data.user
      ) {
        console.error("Invalid login response format:", response.data);
        return thunkAPI.rejectWithValue("Invalid response format from server");
      }

      // Validate user object has required fields
      const { user, token } = response.data;
      if (!user.id || !user.email || !user.role) {
        console.error("Missing required user fields:", user);
        return thunkAPI.rejectWithValue("User data is incomplete");
      }

      // Store user data in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      return { user, token };
    } catch (error) {
      console.error("Login error:", error);

      // Detailed error logging
      if (error.response) {
        console.error("Server response error:", {
          status: error.response.status,
          data: error.response.data,
        });
        return thunkAPI.rejectWithValue(
          error.response.data?.error ||
            error.response.data?.message ||
            "Authentication failed"
        );
      } else if (error.request) {
        console.error("No response received:", error.request);
        return thunkAPI.rejectWithValue(
          "No response from server. Please check your connection."
        );
      } else {
        console.error("Request setup error:", error.message);
        return thunkAPI.rejectWithValue(error.message);
      }
    }
  }
);

// Logout user
export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  try {
    await api.get("/api/auth/logout");

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  } catch (error) {
    console.error("Logout error:", error);
    // Still remove local data even if API call fails
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }
});

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

    return thunkAPI.rejectWithValue(message);
  }
});

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

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    },
    clearError: (state) => {
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Register cases
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = "";
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message =
          "Registration successful! Please log in with your credentials.";
        // Don't set user or token after registration
        state.user = null;
        state.token = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.isError = true;
        state.message = action.payload || "Registration failed";
        state.user = null;
        state.token = null;
      })
      // Login cases
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = "";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = "";
        // Ensure we have valid user data
        if (action.payload?.user && action.payload?.token) {
          state.user = action.payload.user;
          state.token = action.payload.token;
        } else {
          state.isError = true;
          state.message = "Invalid login response";
          state.user = null;
          state.token = null;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isSuccess = false;
        state.isError = true;
        state.message = action.payload || "Login failed";
        state.user = null;
        state.token = null;
        // Clear localStorage on login failure
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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
      // Logout cases
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isSuccess = false;
        state.isLoading = false;
        state.isError = false;
        state.message = "";
      })
      // Get current user cases
      .addCase(getMe.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        if (action.payload?.data) {
          state.user = action.payload.data;
        }
      })
      .addCase(getMe.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        // Clear localStorage on getCurrentUser failure
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      });
  },
});

export const { reset, clearError } = authSlice.actions;

// Selectors with safe fallbacks
export const selectCurrentUser = (state) => state.auth.user || null;
export const selectUserRole = (state) => state.auth.user?.role || "student";
export const selectIsAuthenticated = (state) =>
  Boolean(state.auth.token && state.auth.user);
export const selectAuthState = (state) => ({
  isLoading: state.auth.isLoading || false,
  isError: state.auth.isError || false,
  isSuccess: state.auth.isSuccess || false,
  message: state.auth.message || "",
});

export default authSlice.reducer;
