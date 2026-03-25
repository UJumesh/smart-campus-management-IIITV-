import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { toast } from "react-toastify";

// Async thunks
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (params = "", { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/users?${params}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch users");
    }
  }
);

export const createUser = createAsyncThunk(
  "users/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/users", userData);
      toast.success("User created successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create user");
      return rejectWithValue(error.response?.data?.message || "Failed to create user");
    }
  }
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/users/${id}`, userData);
      toast.success("User updated successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user");
      return rejectWithValue(error.response?.data?.message || "Failed to update user");
    }
  }
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/users/${id}`);
      toast.success("User deleted successfully");
      return id;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
      return rejectWithValue(error.response?.data?.message || "Failed to delete user");
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  "users/updateUserStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/users/${id}/status`, { status });
      toast.success("User status updated successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user status");
      return rejectWithValue(error.response?.data?.message || "Failed to update user status");
    }
  }
);

export const bulkUpdateUsers = createAsyncThunk(
  "users/bulkUpdateUsers",
  async ({ userIds, updates }, { rejectWithValue }) => {
    try {
      const response = await api.patch("/api/users/bulk", { userIds, updates });
      toast.success("Users updated successfully");
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update users");
      return rejectWithValue(error.response?.data?.message || "Failed to update users");
    }
  }
);

export const resetUserPassword = createAsyncThunk(
  "users/resetUserPassword",
  async (id, { rejectWithValue }) => {
    try {
      await api.post(`/api/users/${id}/reset-password`);
      toast.success("Password reset email sent successfully");
      return id;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
      return rejectWithValue(error.response?.data?.message || "Failed to reset password");
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  "users/updateUserProfile",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.put("/api/user-profile", userData);
      toast.success("Profile updated successfully");
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update profile";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  success: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
        };
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create User
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.unshift(action.payload.data);
        state.success = true;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update User
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex(
          (user) => user._id === action.payload.data._id
        );
        if (index !== -1) {
          state.users[index] = action.payload.data;
        }
        state.success = true;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete User
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((user) => user._id !== action.payload);
        state.success = true;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update User Status
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const index = state.users.findIndex(
          (user) => user._id === action.payload.data._id
        );
        if (index !== -1) {
          state.users[index] = action.payload.data;
        }
      })
      // Bulk Update Users
      .addCase(bulkUpdateUsers.fulfilled, (state, action) => {
        state.success = true;
      })
      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Update the user in the users array if it exists
        const index = state.users.findIndex(
          (user) => user._id === action.payload.data._id
        );
        if (index !== -1) {
          state.users[index] = action.payload.data;
        }
        // Update selected user if it matches
        if (state.selectedUser?._id === action.payload.data._id) {
          state.selectedUser = action.payload.data;
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess, setSelectedUser, clearSelectedUser } =
  userSlice.actions;

export default userSlice.reducer;
