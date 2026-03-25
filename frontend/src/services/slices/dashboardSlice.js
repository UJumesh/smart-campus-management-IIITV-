import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

// Initial state for dashboard
const initialState = {
  stats: {
    totalUsers: 0,
    totalEvents: 0,
    totalResources: 0,
    totalReservations: 0
  },
  recentActivities: [],
  topEvents: [],
  popularResources: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: ""
};

// Get dashboard statistics
export const getDashboardStats = createAsyncThunk(
  "dashboard/getStats",
  async (_, thunkAPI) => {
    try {
      // This is a placeholder - replace with actual API call when backend endpoint is ready
      const response = await api.get("/api/dashboard/stats");
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

// Dashboard slice
const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = "";
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.stats = action.payload.stats || state.stats;
        state.recentActivities = action.payload.recentActivities || [];
        state.topEvents = action.payload.topEvents || [];
        state.popularResources = action.payload.popularResources || [];
      })
      .addCase(getDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  }
});

export const { reset } = dashboardSlice.actions;
export default dashboardSlice.reducer; 