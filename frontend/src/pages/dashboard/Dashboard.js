import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  Event as EventIcon,
  CalendarMonth as CalendarIcon,
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  AutorenewOutlined as AutoRefreshIcon,
  Announcement as AnnouncementIcon,
} from "@mui/icons-material";
import DashboardSkeleton from "../../components/ui/DashboardSkeleton";
import useAuth from "../../hooks/useAuth";
import { getPermissions } from "../../utils/permissions";
import {
  getNotifications,
  markAsRead,
} from "../../services/slices/notificationSlice";
import { getEvents, getUpcomingEvents } from "../../services/slices/eventSlice";
import { UpcomingEvents } from "../../components/events";
import api from "../../services/api";

// Import the fetchDashboardData action with proper error handling
let fetchDashboardData;
try {
  // Try different paths for the dashboard slice
  try {
    const dashboardModule = require("../../store/slices/dashboardSlice");
    fetchDashboardData = dashboardModule.fetchDashboardData;
    console.log("Dashboard module loaded from store/slices");
  } catch (innerError) {
    console.log("Trying alternate path for dashboard module");
    const dashboardModule = require("../../services/slices/dashboardSlice");
    fetchDashboardData = dashboardModule.fetchDashboardData;
    console.log("Dashboard module loaded from services/slices");
  }
} catch (error) {
  console.error("Error loading dashboard module:", error);
  // Define a dummy action as fallback
  fetchDashboardData = () => ({ type: "DUMMY_FETCH_DASHBOARD_DATA" });
}

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Use our custom auth hook with redirection
  const { user } = useAuth({
    redirectIfNotAuth: true,
    redirectTo: "/login",
  });

  // Get permissions based on user role
  const permissions = getPermissions(user?.role || "student");

  // Get dashboard state with fallback
  const dashboardState = useSelector((state) => state.dashboard) || {
    stats: {
      totalUsers: 0,
      totalCourses: 0,
      totalEvents: 0,
      activeUsers: 0,
      pendingRequests: 0,
    },
    upcomingEvents: [],
    loading: false,
    error: null,
  };

  // Get events state
  const eventsState = useSelector((state) => state.events) || {
    events: [],
    upcomingEvents: [],
    isLoading: false,
  };

  // Get notification state
  const notificationState = useSelector((state) => state.notification) || {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
  };

  const { stats, loading, error } = dashboardState;
  const { notifications = [], unreadCount = 0 } = notificationState;
  const { events = [], upcomingEvents = [] } = eventsState;

  // Function to handle manual refresh
  const handleRefresh = useCallback(() => {
    dispatch(fetchDashboardData());
    dispatch(getUpcomingEvents());
    dispatch(getNotifications());
    setLastRefreshed(new Date());
  }, [dispatch]);

  // Initial data fetch
  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  // Add error reporting for debugging
  useEffect(() => {
    if (error) {
      console.error("Dashboard error:", error);
    }
  }, [error]);

  // Set up auto-refresh at 60-second intervals
  useEffect(() => {
    let intervalId;

    if (autoRefreshEnabled) {
      intervalId = setInterval(() => {
        console.log("Auto-refreshing dashboard data...");
        handleRefresh();
      }, 60000); // Refresh every 60 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefreshEnabled, handleRefresh]);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => !prev);
  }, []);

  // Memoize the date formatter to prevent unnecessary re-renders
  const formatDate = useMemo(() => {
    return (dateString) => {
      const options = {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return new Date(dateString).toLocaleDateString("en-US", options);
    };
  }, []);

  // Format time since last refresh
  const getTimeSinceRefresh = () => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - lastRefreshed) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    }
  };

  // Handle notification click
  const handleNotificationClick = useCallback(
    (notification) => {
      if (!notification.read) {
        dispatch(markAsRead(notification._id));
      }

      if (notification.link) {
        navigate(notification.link);
      }
    },
    [dispatch, navigate]
  );

  // Show loading skeleton
  if (loading && !stats) {
    return <DashboardSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ mt: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" color="primary" onClick={handleRefresh}>
          Retry
        </Button>
      </Box>
    );
  }

  // Render different dashboard sections based on user role
  const renderRoleBasedContent = () => {
    if (!user) return null;

    return (
      <Grid container spacing={3}>
        {/* Common sections for all roles */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
              background:
                "linear-gradient(135deg, rgba(0,105,192,0.12) 0%, rgba(25,118,210,0.05) 100%)",
              p: 3,
              borderRadius: 3,
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              border: "1px solid rgba(25,118,210,0.1)",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                opacity: 0.3,
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                animation: "fadeIn 0.6s ease-out",
                "@keyframes fadeIn": {
                  "0%": {
                    opacity: 0,
                    transform: "translateY(10px)",
                  },
                  "100%": {
                    opacity: 1,
                    transform: "translateY(0)",
                  },
                },
              }}
            >
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: "primary.main",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                  mr: 2,
                  border: "2px solid white",
                }}
              >
                {user.firstName?.charAt(0)}
                {user.lastName?.charAt(0)}
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "primary.main",
                    mt: 0,
                    position: "relative",
                    textShadow: "1px 1px 1px rgba(0,0,0,0.05)",
                    fontSize: { xs: "1.5rem", sm: "2rem" },
                    letterSpacing: "-0.5px",
                  }}
                >
                  Welcome back, {user.firstName}!
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "text.secondary",
                    mt: 0.5,
                    opacity: 0.9,
                    fontWeight: 500,
                  }}
                >
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </Typography>
              </Box>
            </Box>

            <Chip
              label={`Last refreshed: ${getTimeSinceRefresh()}`}
              variant="outlined"
              size="small"
              icon={<RefreshIcon fontSize="small" />}
              onClick={handleRefresh}
              sx={{
                borderRadius: 5,
                px: 1,
                bgcolor: "rgba(255,255,255,0.7)",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.9)",
                },
                cursor: "pointer",
                borderColor: "primary.light",
                color: "text.secondary",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
            />
          </Box>
        </Grid>

        {/* Admin Dashboard */}
        {permissions.canManageUsers && (
          <>
            <Grid item xs={12} md={6} lg={3}>
              <Card
                elevation={2}
                sx={{
                  height: "100%",
                  borderRadius: 2,
                  transition: "all 0.3s",
                  overflow: "visible",
                  border: "1px solid rgba(0,0,0,0.05)",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      sx={{
                        bgcolor: "primary.main",
                        width: 50,
                        height: 50,
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                      <PeopleIcon />
                    </Avatar>
                    <div>
                      <Typography
                        variant="h6"
                        sx={{ mb: 0.5, fontWeight: 600 }}
                      >
                        Users
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{ fontWeight: "bold", color: "primary.main" }}
                      >
                        {stats?.totalUsers || 0}
                      </Typography>
                    </div>
                  </Box>
                </CardContent>
                <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
                  <Button
                    size="small"
                    onClick={() => navigate("/admin/users")}
                    variant="contained"
                    sx={{
                      borderRadius: 4,
                      textTransform: "none",
                      boxShadow: 1,
                    }}
                  >
                    Manage Users
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card
                elevation={2}
                sx={{
                  height: "100%",
                  borderRadius: 2,
                  transition: "all 0.3s",
                  overflow: "visible",
                  border: "1px solid rgba(0,0,0,0.05)",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      sx={{
                        bgcolor: "secondary.main",
                        width: 50,
                        height: 50,
                        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                      <AssessmentIcon />
                    </Avatar>
                    <div>
                      <Typography
                        variant="h6"
                        sx={{ mb: 0.5, fontWeight: 600 }}
                      >
                        Analytics
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: "bold", color: "secondary.main" }}
                      >
                        System Overview
                      </Typography>
                    </div>
                  </Box>
                </CardContent>
                <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
                  <Button
                    size="small"
                    onClick={() => navigate("/admin/analytics")}
                    variant="contained"
                    color="secondary"
                    sx={{
                      borderRadius: 4,
                      textTransform: "none",
                      boxShadow: 1,
                    }}
                  >
                    View Analytics
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} md={12}>
              <UpcomingEvents />
            </Grid>
          </>
        )}

        {/* Student Dashboard */}
        {!permissions.canManageCourses && !permissions.canManageUsers && (
          <>
            <Grid item xs={12} md={6}>
              <Card
                elevation={2}
                sx={{
                  height: "100%",
                  borderRadius: 2,
                  transition: "all 0.3s",
                  border: "1px solid rgba(0,0,0,0.05)",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 600,
                      color: "text.primary",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <SchoolIcon sx={{ mr: 1, color: "primary.main" }} />
                    My Courses
                  </Typography>
                  <List sx={{ px: 0 }}>
                    {stats?.enrolledCourses?.slice(0, 3).map((course) => (
                      <ListItem
                        key={course.id}
                        sx={{
                          px: { xs: 1, sm: 2 },
                          py: 1.5,
                          borderRadius: 2,
                          backgroundColor: "rgba(0,0,0,0.02)",
                          mb: 1.5,
                          transition: "all 0.2s",
                          "&:hover": {
                            bgcolor: "action.hover",
                            transform: "translateX(5px)",
                          },
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: "success.main",
                              boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                            }}
                          >
                            <SchoolIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 500 }}
                            >
                              {course.name}
                            </Typography>
                          }
                          secondary={course.lecturer}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <CardActions sx={{ justifyContent: "flex-end", px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    onClick={() => navigate("/courses")}
                    variant="contained"
                    sx={{ borderRadius: 4, textTransform: "none" }}
                  >
                    View All Courses
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <UpcomingEvents />
            </Grid>
          </>
        )}

        {/* Notifications Section - Common for all roles */}
        <Grid item xs={12}>
          <Card
            elevation={2}
            sx={{
              height: "100%",
              borderRadius: 2,
              transition: "all 0.3s",
              border: "1px solid rgba(0,0,0,0.05)",
              position: "relative",
              overflow: "visible",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
              },
              ...(unreadCount > 0 && {
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: -5,
                  right: -5,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "error.main",
                  animation: "pulse 2s infinite",
                },
                "@keyframes pulse": {
                  "0%": {
                    boxShadow: "0 0 0 0 rgba(211, 47, 47, 0.7)",
                  },
                  "70%": {
                    boxShadow: "0 0 0 10px rgba(211, 47, 47, 0)",
                  },
                  "100%": {
                    boxShadow: "0 0 0 0 rgba(211, 47, 47, 0)",
                  },
                },
              }),
            }}
          >
            <CardContent sx={{ pb: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: "text.primary",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <NotificationsIcon sx={{ mr: 1, color: "primary.main" }} />
                Recent Notifications{" "}
                {unreadCount > 0 && (
                  <Chip
                    size="small"
                    label={unreadCount}
                    color="error"
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </Typography>
              {notificationState.isLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <LinearProgress sx={{ width: "50%" }} />
                </Box>
              ) : notifications.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 2 }}>
                  <Typography
                    color="textSecondary"
                    variant="body2"
                    sx={{ mb: 2 }}
                  >
                    No new notifications
                  </Typography>
                  {process.env.NODE_ENV !== "production" && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={async () => {
                        try {
                          await api.post("/api/notifications/generate-samples");
                          dispatch(getNotifications());
                        } catch (error) {
                          console.error("Error generating samples:", error);
                        }
                      }}
                    >
                      Generate Sample Notifications
                    </Button>
                  )}
                </Box>
              ) : (
                <List sx={{ px: 0 }}>
                  {notifications.slice(0, 5).map((notification) => (
                    <ListItem
                      key={notification._id}
                      sx={{
                        px: { xs: 1, sm: 2 },
                        py: 1,
                        borderRadius: 1,
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: "action.hover",
                        },
                        mb: 1,
                        bgcolor: !notification.read
                          ? "action.selected"
                          : "transparent",
                      }}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: !notification.read
                              ? "primary.main"
                              : "action.disabledBackground",
                          }}
                        >
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography
                            variant="subtitle2"
                            fontWeight={!notification.read ? 600 : 400}
                          >
                            {notification.title}
                          </Typography>
                        }
                        secondary={formatDate(notification.createdAt)}
                      />
                      {!notification.read && (
                        <Chip
                          label="New"
                          color="primary"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions
              sx={{ pt: 0, pb: 2, px: 2, justifyContent: "flex-end" }}
            >
              <Button
                size="small"
                onClick={() => navigate("/notifications")}
                variant="outlined"
                endIcon={<NotificationsIcon fontSize="small" />}
              >
                View All Notifications
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Add this helper function for notification icons right after formatDate or another appropriate spot

  const getNotificationIcon = (type) => {
    switch (type) {
      case "event_invitation":
      case "event_reminder":
        return <EventIcon />;
      case "schedule_change":
        return <CalendarIcon />;
      case "message":
        return <MessageIcon />;
      case "announcement":
      case "system":
        return <AnnouncementIcon />; // Import this if not already imported
      default:
        return <NotificationsIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ mb: 3, p: 3, position: "relative" }}>
        {/* Refresh controls */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mr: 2, alignSelf: "center" }}
          >
            {getTimeSinceRefresh()}
          </Typography>
          <Tooltip title="Manual refresh">
            <IconButton onClick={handleRefresh} color="primary" size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={autoRefreshEnabled ? "Auto-refresh on" : "Auto-refresh off"}
          >
            <IconButton
              onClick={toggleAutoRefresh}
              color={autoRefreshEnabled ? "success" : "default"}
              size="small"
              sx={{ ml: 1 }}
            >
              <AutoRefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Error display */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            <Typography variant="subtitle2">
              Failed to load dashboard data
            </Typography>
            <Typography variant="caption" display="block">
              {error}
            </Typography>
            <Typography variant="caption" display="block">
              This might be due to an API configuration issue. Make sure the
              backend is running correctly.
            </Typography>
          </Alert>
        )}

        {/* Loading skeleton */}
        {loading ? <DashboardSkeleton /> : renderRoleBasedContent()}
      </Paper>
    </Box>
  );
};

export default Dashboard;
