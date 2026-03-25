import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import scheduleReducer from "./slices/scheduleSlice";
import userReducer from "./slices/userSlice";
import dashboardReducer from "./slices/dashboardSlice";
import analyticsReducer from "./slices/analyticsSlice";

// Try to import message reducer with error handling
let messageReducer;
try {
  messageReducer = require("../services/slices/messageSlice").default;
} catch (error) {
  console.error("Error loading message reducer:", error);
  // Create a dummy reducer if the real one fails to load
  messageReducer = (
    state = { conversations: [], currentConversation: null, isLoading: false },
    action
  ) => state;
}

// Try to import notification reducer with error handling
let notificationReducer;
try {
  notificationReducer = require("../services/slices/notificationSlice").default;
} catch (error) {
  console.error("Error loading notification reducer:", error);
  // Create a dummy reducer if the real one fails to load
  notificationReducer = (
    state = { notifications: [], unreadCount: 0, isLoading: false },
    action
  ) => state;
}

const store = configureStore({
  reducer: {
    auth: authReducer,
    schedule: scheduleReducer,
    users: userReducer,
    dashboard: dashboardReducer,
    analytics: analyticsReducer,
    message: messageReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== "production",
});

export default store;
