import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchSchedules = createAsyncThunk(
  'schedules/fetchSchedules',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/schedules');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const createSchedule = createAsyncThunk(
  'schedules/createSchedule',
  async (scheduleData, { rejectWithValue }) => {
    try {
      const response = await api.post('/schedules', scheduleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const updateSchedule = createAsyncThunk(
  'schedules/updateSchedule',
  async ({ id, scheduleData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/schedules/${id}`, scheduleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const deleteSchedule = createAsyncThunk(
  'schedules/deleteSchedule',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/schedules/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const checkConflicts = createAsyncThunk(
  'schedules/checkConflicts',
  async (scheduleData, { rejectWithValue }) => {
    try {
      const response = await api.post('/schedules/check-conflicts', scheduleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const initialState = {
  schedules: [],
  conflicts: [],
  loading: false,
  error: null,
  success: false,
  filters: {
    type: 'all',
    status: 'all',
    date: null,
  },
  view: 'month',
};

const scheduleSlice = createSlice({
  name: 'schedules',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setView: (state, action) => {
      state.view = action.payload;
    },
    clearConflicts: (state) => {
      state.conflicts = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Schedules
      .addCase(fetchSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules = action.payload;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch schedules';
      })
      // Create Schedule
      .addCase(createSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.schedules.push(action.payload);
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create schedule';
      })
      // Update Schedule
      .addCase(updateSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.schedules.findIndex(schedule => schedule._id === action.payload._id);
        if (index !== -1) {
          state.schedules[index] = action.payload;
        }
      })
      .addCase(updateSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update schedule';
      })
      // Delete Schedule
      .addCase(deleteSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.schedules = state.schedules.filter(schedule => schedule._id !== action.payload);
      })
      .addCase(deleteSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete schedule';
      })
      // Check Conflicts
      .addCase(checkConflicts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkConflicts.fulfilled, (state, action) => {
        state.loading = false;
        state.conflicts = action.payload;
      })
      .addCase(checkConflicts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to check conflicts';
      });
  },
});

export const { clearError, clearSuccess, setFilters, setView, clearConflicts } = scheduleSlice.actions;
export default scheduleSlice.reducer; 