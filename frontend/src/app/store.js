import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../services/slices/authSlice';
import scheduleReducer from '../services/slices/scheduleSlice';
import eventReducer from '../services/slices/eventSlice';
// ... other imports ...

export const store = configureStore({
  reducer: {
    auth: authReducer,
    schedule: scheduleReducer,
    events: eventReducer,
    // ... other reducers ...
  },
}); 