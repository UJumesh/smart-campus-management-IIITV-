import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import scheduleReducer from './slices/scheduleSlice';
import resourceReducer from './slices/resourceSlice';
import reservationReducer from './slices/reservationSlice';
import eventReducer from './slices/eventSlice';
import messageReducer from './slices/messageSlice';
import notificationReducer from './slices/notificationSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    schedule: scheduleReducer,
    resource: resourceReducer,
    reservation: reservationReducer,
    event: eventReducer,
    message: messageReducer,
    notification: notificationReducer,
    analytics: analyticsReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
}); 