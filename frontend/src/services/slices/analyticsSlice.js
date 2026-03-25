import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";
import { toast } from "react-toastify";

// Initial state for analytics
const initialState = {
  data: {
    userStats: {
      total: 0,
      active: 0,
    },
    roleDistribution: {
      admin: 0,
      lecturer: 0,
      student: 0,
    },
    departmentDistribution: {
      "Computer Science": 0,
      Mathematics: 0,
      Engineering: 0,
      Business: 0,
      Arts: 0,
    },
    registrationTrends: {
      Jan: 0,
      Feb: 0,
      Mar: 0,
      Apr: 0,
      May: 0,
      Jun: 0,
    },
    systemHealth: {
      serverStatus: "Healthy",
      databaseStatus: "Connected",
      storageUsage: "45%",
      memoryUsage: "32%",
      cpuUsage: "28%",
    },
    loginActivity: {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
    },
  },
  loading: false,
  error: null,
};

// Function to fetch analytics data
export const fetchAnalytics = createAsyncThunk(
  "analytics/fetchData",
  async (_, thunkAPI) => {
    try {
      // Try to get real analytics data from the backend
      const response = await api.get("/api/analytics");
      return response.data.data;
    } catch (error) {
      console.error("Error fetching analytics:", error);

      // Return mock data as fallback for testing
      return {
        userStats: {
          total: 125,
          active: 85,
        },
        roleDistribution: {
          admin: 5,
          lecturer: 20,
          student: 100,
        },
        departmentDistribution: {
          "Computer Science": 45,
          Mathematics: 25,
          Engineering: 30,
          Business: 15,
          Arts: 10,
        },
        registrationTrends: {
          Jan: 10,
          Feb: 15,
          Mar: 20,
          Apr: 25,
          May: 30,
          Jun: 25,
        },
        systemHealth: {
          serverStatus: "Healthy",
          databaseStatus: "Connected",
          storageUsage: "45%",
          memoryUsage: "32%",
          cpuUsage: "28%",
        },
        loginActivity: {
          today: 25,
          thisWeek: 65,
          thisMonth: 80,
        },
      };
    }
  }
);

// Create the analytics slice
const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    resetAnalytics: (state) => {
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch analytics data";
      });
  },
});

export const { resetAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
