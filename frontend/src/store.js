import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./services/slices/authSlice";
import userReducer from "./services/slices/userSlice";
import eventReducer from "./services/slices/eventSlice";
import resourceReducer from "./services/slices/resourceSlice";
import courseReducer from "./services/slices/courseSlice";
import notificationReducer from "./services/slices/notificationSlice";

// Create a dummy message reducer for fallback
const dummyMessageReducer = (
  state = {
    messages: [],
    conversations: [],
    currentConversation: null,
    searchResults: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: "",
  },
  action
) => {
  return state;
};

// Create a dummy analytics reducer for fallback
const dummyAnalyticsReducer = (
  state = {
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
      departmentDistribution: {},
      registrationTrends: {},
      systemHealth: {
        serverStatus: "Unknown",
        databaseStatus: "Unknown",
        storageUsage: "0%",
        memoryUsage: "0%",
        cpuUsage: "0%",
      },
      loginActivity: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
      },
    },
    loading: false,
    error: null,
  },
  action
) => {
  return state;
};

// Create a dummy dashboard reducer for fallback
const dummyDashboardReducer = (
  state = {
    stats: {
      totalUsers: 0,
      totalCourses: 0,
      totalEvents: 0,
      activeUsers: 0,
      pendingRequests: 0,
    },
    upcomingEvents: [],
    notifications: [],
    loading: false,
    error: null,
  },
  action
) => {
  return state;
};

// Lazy load the message reducer to prevent app crashes
let messageReducer;
try {
  // Try to import the message reducer - if it fails, we'll use the dummy one
  messageReducer = require("./services/slices/messageSlice").default;
} catch (error) {
  messageReducer = dummyMessageReducer;
}

// Try to load the analytics reducer
let analyticsReducer;
try {
  analyticsReducer = require("./services/slices/analyticsSlice").default;
} catch (error) {
  analyticsReducer = dummyAnalyticsReducer;
}

// Try to load the dashboard reducer
let dashboardReducer;
try {
  // Try both possible paths for the dashboard slice
  try {
    dashboardReducer = require("./store/slices/dashboardSlice").default;
  } catch (innerError) {
    dashboardReducer = require("./services/slices/dashboardSlice").default;
  }
} catch (error) {
  dashboardReducer = dummyDashboardReducer;
}

const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    events: eventReducer,
    resources: resourceReducer,
    message: messageReducer,
    courses: courseReducer,
    analytics: analyticsReducer,
    dashboard: dashboardReducer,
    notification: notificationReducer,
  },
});

export default store;
