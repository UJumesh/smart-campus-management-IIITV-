import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

// Get all notifications
export const getNotifications = createAsyncThunk(
  "notification/getAll",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/notifications");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Mark notification as read
export const markAsRead = createAsyncThunk(
  "notification/markAsRead",
  async (id, thunkAPI) => {
    try {
      const response = await api.put(`/api/notifications/${id}`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Mark all notifications as read
export const markAllAsRead = createAsyncThunk(
  "notification/markAllAsRead",
  async (_, thunkAPI) => {
    try {
      const response = await api.put("/api/notifications/mark-all-read");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Delete notification
export const deleteNotification = createAsyncThunk(
  "notification/delete",
  async (id, thunkAPI) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      return id;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

// Delete all notifications
export const deleteAllNotifications = createAsyncThunk(
  "notification/deleteAll",
  async (_, thunkAPI) => {
    try {
      await api.delete("/api/notifications/delete-all");
      return;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || error.message
      );
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
};

export const notificationSlice = createSlice({
  name: "notification",
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
      // Get notifications
      .addCase(getNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.notifications = action.payload.data;
        state.unreadCount = action.payload.data.filter(
          (notification) => !notification.read
        ).length;
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.isSuccess = true;
        const index = state.notifications.findIndex(
          (notification) => notification._id === action.payload.data._id
        );
        if (index !== -1) {
          state.notifications[index].read = true;
          state.unreadCount = state.notifications.filter(
            (notification) => !notification.read
          ).length;
        }
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })
      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.isSuccess = true;
        state.notifications.forEach((notification) => {
          notification.read = true;
        });
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })
      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.notifications = state.notifications.filter(
          (notification) => notification._id !== action.payload
        );
        state.unreadCount = state.notifications.filter(
          (notification) => !notification.read
        ).length;
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })
      // Delete all notifications
      .addCase(deleteAllNotifications.fulfilled, (state) => {
        state.isSuccess = true;
        state.notifications = [];
        state.unreadCount = 0;
      })
      .addCase(deleteAllNotifications.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = notificationSlice.actions;
export default notificationSlice.reducer;
