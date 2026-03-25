import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { toast } from "react-toastify";

// Async thunk for fetching analytics data
export const fetchAnalytics = createAsyncThunk(
  "analytics/fetchAnalytics",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/analytics");
      return response.data;
    } catch (error) {
      toast.error("Failed to fetch analytics data");
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch analytics data"
      );
    }
  }
);

// Initial state
const initialState = {
  data: null,
  loading: false,
  error: null,
};

// Analytics slice
const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    resetAnalytics: (state) => {
      state.data = null;
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
        state.data = action.payload.data;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch analytics data";
      });
  },
});

export const { resetAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;
