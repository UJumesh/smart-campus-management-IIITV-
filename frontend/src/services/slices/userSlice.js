import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import api from "../api";

const initialState = {
  users: [],
  user: null,
  pagination: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

// Get user profile
export const getUserProfile = createAsyncThunk(
  "user/getProfile",
  async (_, thunkAPI) => {
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
  }
);

// Update user profile
export const updateUserProfile = createAsyncThunk(
  "user/updateProfile",
  async (userData, thunkAPI) => {
    try {
      const response = await api.put("/api/auth/updatedetails", userData);
      toast.success("Profile updated successfully");
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

// Get all users (with pagination)
export const getAllUsers = createAsyncThunk(
  "users/getAllUsers",
  async ({ page = 1, limit = 10, search = "", role = "" }, thunkAPI) => {
    try {
      const params = new URLSearchParams();
      if (page) params.append("page", page);
      if (limit) params.append("limit", limit);
      if (search) params.append("search", search);
      if (role) params.append("role", role);

      const token = thunkAPI.getState().auth.user?.token;
      const response = await api.get(`/api/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update user role
export const updateUserRole = createAsyncThunk(
  "users/updateUserRole",
  async ({ userId, role }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      const response = await api.patch(
        `/api/users/${userId}/role`,
        { role },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user?.token;
      const response = await api.delete(`/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return { userId, data: response.data };
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const userSlice = createSlice({
  name: "user",
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
      // Get user profile
      .addCase(getUserProfile.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.data;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.data;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get all users
      .addCase(getAllUsers.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = "";
        // Don't clear users array here to prevent UI flicker
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.users = action.payload.data;
        state.pagination = {
          ...action.payload.pagination,
          total: action.payload.count || action.payload.data.length || 0,
        };
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.users = [];
        state.pagination = null;
      })
      // Update user role
      .addCase(updateUserRole.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.users = state.users.map((user) =>
          user._id === action.payload.data._id ? action.payload.data : user
        );
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.users = state.users.filter(
          (user) => user._id !== action.payload.userId
        );
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = userSlice.actions;
export default userSlice.reducer;
