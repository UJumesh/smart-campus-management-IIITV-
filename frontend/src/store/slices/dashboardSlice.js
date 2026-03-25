import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { toast } from "react-toastify";

// Initial state
const initialState = {
  stats: null,
  recentActivities: [],
  upcomingEvents: [],
  notifications: [],
  loading: false,
  error: null,
};

// Fetch dashboard data
export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/dashboard");
      return response.data;
    } catch (error) {
      let errorMessage = "Failed to fetch dashboard data";

      if (error.response?.status === 401) {
        errorMessage = "Your session has expired. Please login again.";
      } else if (error.response?.status === 404) {
        errorMessage =
          "Dashboard endpoint not found. Please check the server configuration.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Dashboard slice
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboard: (state) => {
      state.stats = null;
      state.recentActivities = [];
      state.upcomingEvents = [];
      state.notifications = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;

        // Handle the nested data structure from the backend
        const dashboardData = action.payload.data || action.payload;

        state.stats = dashboardData.stats || null;
        state.recentActivities = dashboardData.recentActivities || [];
        state.upcomingEvents = dashboardData.upcomingEvents || [];
        state.notifications = dashboardData.notifications || [];
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
