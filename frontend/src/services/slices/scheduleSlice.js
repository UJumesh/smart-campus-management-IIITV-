import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import api from '../api';

const initialState = {
  schedules: [],
  schedule: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
  events: [],
  conflicts: [],
  resourceAvailability: {},
  stats: {
    totalEvents: 0,
    resourceUtilization: {},
    attendanceRate: 0
  },
  refreshNeeded: false,
  refreshParams: null
};

// Get schedules
export const getSchedules = createAsyncThunk(
  'schedule/getSchedules',
  async ({ startDate, endDate }) => {
    const response = await api.get(`/api/schedules?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  }
);

// Get single schedule
export const getSchedule = createAsyncThunk(
  'schedule/get',
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/api/schedules/${id}`);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.error) ||
        error.message ||
        error.toString();
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create schedule
export const createSchedule = createAsyncThunk(
  'schedule/createSchedule',
  async (scheduleData) => {
    const response = await api.post('/api/schedules', scheduleData);
    return response.data;
  }
);

// Update schedule
export const updateSchedule = createAsyncThunk(
  'schedule/updateSchedule',
  async ({ id, ...updateData }) => {
    const response = await api.put(`/api/schedules/${id}`, updateData);
    return response.data;
  }
);

// Delete schedule
export const deleteSchedule = createAsyncThunk(
  'schedule/deleteSchedule',
  async (id) => {
    await api.delete(`/api/schedules/${id}`);
    return id;
  }
);

// Update attendance status
export const updateAttendanceStatus = createAsyncThunk(
  'schedule/updateAttendance',
  async ({ scheduleId, status }, thunkAPI) => {
    try {
      const response = await api.put(`/api/schedules/${scheduleId}/attendance`, { status });
      toast.success('Attendance status updated successfully');
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.error) ||
        error.message ||
        error.toString();
      
      toast.error(message);
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const bulkUpdateSchedules = createAsyncThunk(
  'schedule/bulkUpdate',
  async (updates) => {
    const response = await api.post('/api/schedules/bulk', updates);
    return response.data;
  }
);

export const checkConflicts = createAsyncThunk(
  'schedule/checkConflicts',
  async ({ startDate, endDate, location, resources, excludeId }) => {
    const response = await api.post('/api/schedules/check-conflicts', {
      startDate,
      endDate,
      location,
      resources,
      excludeId
    });
    return response.data;
  }
);

export const getResourceAvailability = createAsyncThunk(
  'schedule/getResourceAvailability',
  async ({ startDate, endDate, resourceIds }) => {
    const response = await api.get('/api/schedules/resource-availability', {
      params: { startDate, endDate, resourceIds }
    });
    return response.data;
  }
);

export const generateReport = createAsyncThunk(
  'schedule/generateReport',
  async ({ startDate, endDate, type, format }) => {
    const response = await api.get('/api/schedules/report', {
      params: { startDate, endDate, type, format },
      responseType: 'blob'
    });
    return response.data;
  }
);

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
      state.refreshNeeded = false;
      state.refreshParams = null;
    },
    clearConflicts: (state) => {
      state.conflicts = [];
    },
    updateStats: (state, action) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    refreshNeeded: (state, action) => {
      // This action is dispatched when an event is created in the Events page
      // It sets a flag that will trigger a refresh of the schedule data
      state.refreshNeeded = true;
      state.refreshParams = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get schedules
      .addCase(getSchedules.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.isSuccess = false;
        state.message = '';
      })
      .addCase(getSchedules.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.schedules = action.payload.data;
        state.events = action.payload.data;
      })
      .addCase(getSchedules.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.error.message;
        state.schedules = [];
        state.events = [];
      })
      // Get single schedule
      .addCase(getSchedule.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.schedule = action.payload.data;
      })
      .addCase(getSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.error.message;
      })
      // Create schedule
      .addCase(createSchedule.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createSchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.schedules.push(action.payload.data);
        state.events.push(action.payload.data);
      })
      .addCase(createSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.error.message;
      })
      // Update schedule
      .addCase(updateSchedule.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateSchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.schedules = state.schedules.map(schedule =>
          schedule._id === action.payload.data._id ? action.payload.data : schedule
        );
        const index = state.events.findIndex(e => e._id === action.payload.data._id);
        if (index !== -1) {
          state.events[index] = action.payload.data;
        }
      })
      .addCase(updateSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.error.message;
      })
      // Delete schedule
      .addCase(deleteSchedule.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteSchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.schedules = state.schedules.filter(schedule => schedule._id !== action.payload);
        state.events = state.events.filter(e => e._id !== action.payload);
      })
      .addCase(deleteSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.error.message;
      })
      // Update attendance status
      .addCase(updateAttendanceStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateAttendanceStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.schedules = state.schedules.map(schedule =>
          schedule._id === action.payload.data._id ? action.payload.data : schedule
        );
        const index = state.events.findIndex(e => e._id === action.payload.data._id);
        if (index !== -1) {
          state.events[index] = action.payload.data;
        }
      })
      .addCase(updateAttendanceStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.error.message;
      })
      // Check Conflicts
      .addCase(checkConflicts.fulfilled, (state, action) => {
        state.conflicts = action.payload.data;
      })
      // Get Resource Availability
      .addCase(getResourceAvailability.fulfilled, (state, action) => {
        state.resourceAvailability = action.payload.data;
      })
      // Bulk Update
      .addCase(bulkUpdateSchedules.fulfilled, (state, action) => {
        const updatedEvents = action.payload.data;
        updatedEvents.forEach(updatedEvent => {
          const index = state.events.findIndex(e => e._id === updatedEvent._id);
          if (index !== -1) {
            state.events[index] = updatedEvent;
          }
        });
      });
  }
});

export const { reset, clearConflicts, updateStats, refreshNeeded } = scheduleSlice.actions;
export default scheduleSlice.reducer; 