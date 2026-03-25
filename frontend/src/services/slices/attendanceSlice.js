import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  attendanceRecords: [],
  currentRecord: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: ''
};

export const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    }
  },
  extraReducers: (builder) => {
    // Attendance actions will be implemented here
  }
});

export const { reset } = attendanceSlice.actions;
export default attendanceSlice.reducer; 