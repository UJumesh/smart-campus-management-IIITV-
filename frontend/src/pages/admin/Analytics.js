import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  Fade,
  Zoom,
  Grow,
} from "@mui/material";
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Dashboard as DashboardIcon,
  Insights as InsightsIcon,
} from "@mui/icons-material";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie, Line, Doughnut } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Custom styled components
const StatsCard = ({ title, value, subValue, icon, color, index }) => {
  const theme = useTheme();
  const IconComponent = icon;

  return (
    <Grow in={true} timeout={(index + 1) * 300}>
      <Card
        sx={{
          height: "100%",
          minHeight: 180,
          borderRadius: 4,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 8px 24px " + alpha(theme.palette[color].main, 0.2),
          background: `linear-gradient(135deg, ${theme.palette[color].main} 0%, ${theme.palette[color].dark} 100%)`,
          transition: "transform 0.3s, box-shadow 0.3s",
          "&:hover": {
            transform: "translateY(-8px)",
            boxShadow: "0 12px 28px " + alpha(theme.palette[color].main, 0.3),
          },
        }}
      >
        <CardContent
          sx={{ position: "relative", zIndex: 1, p: 3, color: "white" }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" component="div" fontWeight="600">
              {title}
            </Typography>
            <Box
              sx={{
                backgroundColor: alpha("#ffffff", 0.2),
                borderRadius: "50%",
                p: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconComponent fontSize="medium" />
            </Box>
          </Box>
          <Typography
            variant="h3"
            component="div"
            fontWeight="bold"
            sx={{ mb: 1 }}
          >
            {value}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {subValue}
          </Typography>
        </CardContent>
        <Box
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            opacity: 0.1,
            transform: "translateY(-30%) translateX(20%)",
          }}
        >
          <IconComponent sx={{ fontSize: 140 }} />
        </Box>
      </Card>
    </Grow>
  );
};

const StatPaper = ({ title, height, children, index }) => {
  const theme = useTheme();

  return (
    <Zoom in={true} style={{ transitionDelay: `${(index + 1) * 150}ms` }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          height: { xs: "auto", md: height || 350 },
          minHeight: 300,
          borderRadius: 4,
          backgroundColor: "background.paper",
          boxShadow: "0 8px 16px " + alpha(theme.palette.primary.main, 0.1),
          transition: "transform 0.3s",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: "0 12px 20px " + alpha(theme.palette.primary.main, 0.15),
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <InsightsIcon sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6" component="div" fontWeight="600">
            {title}
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        {children}
      </Paper>
    </Zoom>
  );
};

const StatusItem = ({ icon, color, primary, secondary }) => {
  const IconComponent = icon;
  const theme = useTheme();

  return (
    <ListItem
      sx={{
        py: 1.5,
        px: 2,
        mb: 1.5,
        borderRadius: 2,
        backgroundColor: alpha(theme.palette[color].main, 0.08),
        "&:hover": {
          backgroundColor: alpha(theme.palette[color].main, 0.12),
        },
      }}
    >
      <ListItemIcon>
        <Box
          sx={{
            backgroundColor: alpha(theme.palette[color].main, 0.2),
            borderRadius: "50%",
            p: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconComponent sx={{ color: theme.palette[color].main }} />
        </Box>
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography variant="subtitle2" color="textPrimary" fontWeight={600}>
            {primary}
          </Typography>
        }
        secondary={
          <Typography variant="body2" color="textSecondary">
            {secondary}
          </Typography>
        }
      />
    </ListItem>
  );
};

const Analytics = () => {
  const dispatch = useDispatch();
  const theme = useTheme();

  // Check if analytics state exists in Redux store, if not use a default value
  const analyticsState = useSelector((state) => state.analytics) || {
    data: null,
    loading: false,
    error: null,
  };
  const { data, loading, error } = analyticsState;

  const { user } = useSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  // Use local state as fallback when Redux state isn't available
  const [localStats, setLocalStats] = useState({
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
  });

  // Import the fetchAnalytics action with proper error handling
  let fetchAnalytics;
  try {
    // Try different paths for the analytics slice
    const analyticsModule = require("../../services/slices/analyticsSlice");
    fetchAnalytics = analyticsModule.fetchAnalytics;
    console.log("Analytics module loaded successfully");
  } catch (error) {
    console.error("Error loading analytics module:", error);
    // Define a dummy action as fallback
    fetchAnalytics = () => ({ type: "DUMMY_FETCH_ANALYTICS" });
  }

  // Fetch analytics data on component mount
  useEffect(() => {
    try {
      if (typeof dispatch === "function") {
        // Check if the fetchAnalytics action is available
        if (typeof fetchAnalytics === "function") {
          dispatch(fetchAnalytics());
        } else {
          console.warn("fetchAnalytics action not available");
        }
      }
    } catch (err) {
      console.error("Error dispatching analytics action:", err);
    }
  }, [dispatch]);

  // Ensure displayData always has a valid structure
  const isValidData =
    data &&
    typeof data === "object" &&
    data.roleDistribution &&
    typeof data.roleDistribution === "object" &&
    "admin" in data.roleDistribution;

  const displayData = isValidData ? data : localStats;

  // Handle refresh button click
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchAnalytics());
    setRefreshing(false);
  };

  // Prepare chart data for role distribution
  const roleChartData = {
    labels: ["Admin", "Lecturer", "Student"],
    datasets: [
      {
        label: "Users by Role",
        data:
          displayData && displayData.roleDistribution
            ? [
                displayData.roleDistribution.admin || 0,
                displayData.roleDistribution.lecturer || 0,
                displayData.roleDistribution.student || 0,
              ]
            : [0, 0, 0],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
        ],
        borderColor: [
          theme.palette.primary.dark,
          theme.palette.secondary.dark,
          theme.palette.success.dark,
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data for department distribution
  const departmentChartData = {
    labels:
      displayData && displayData.departmentDistribution
        ? Object.keys(displayData.departmentDistribution)
        : [],
    datasets: [
      {
        label: "Users by Department",
        data:
          displayData && displayData.departmentDistribution
            ? Object.values(displayData.departmentDistribution)
            : [],
        backgroundColor: [
          "#4361ee",
          "#3a0ca3",
          "#7209b7",
          "#f72585",
          "#4cc9f0",
          "#4895ef",
          "#480ca8",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare chart data for registration trends
  const registrationTrendsData = {
    labels:
      displayData && displayData.registrationTrends
        ? Object.keys(displayData.registrationTrends).reverse()
        : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "New Registrations",
        data:
          displayData && displayData.registrationTrends
            ? Object.values(displayData.registrationTrends).reverse()
            : [0, 0, 0, 0, 0, 0],
        fill: true,
        backgroundColor: alpha(theme.palette.primary.main, 0.2),
        borderColor: theme.palette.primary.main,
        tension: 0.4,
      },
    ],
  };

  // If loading, show loading spinner
  if (loading && !displayData) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading analytics data...
        </Typography>
      </Box>
    );
  }

  // If error, show error message
  if (error && !displayData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={handleRefresh}
          startIcon={<RefreshIcon />}
          sx={{
            borderRadius: 2,
            py: 1,
            px: 3,
          }}
        >
          Try Again
        </Button>
      </Container>
    );
  }

  return (
    <Fade in={true} timeout={800}>
      <Container maxWidth="lg" sx={{ mt: 5, mb: 6 }}>
        {/* Header with refresh button */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            mb: 4,
          }}
        >
          <Box sx={{ mb: { xs: 2, sm: 0 } }}>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
              Analytics Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Welcome back, {user?.firstName || "Admin"}! Here's your data
              overview.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={
              refreshing || loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <RefreshIcon />
              )
            }
            onClick={handleRefresh}
            disabled={refreshing || loading}
            sx={{
              borderRadius: 2,
              py: 1,
              px: 2,
              boxShadow: "0 4px 12px " + alpha(theme.palette.primary.main, 0.3),
              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
          >
            {refreshing || loading ? "Refreshing..." : "Refresh Data"}
          </Button>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={4} sx={{ mb: 5 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatsCard
              title="Total Users"
              value={displayData?.userStats.total || 0}
              subValue={`${
                displayData?.userStats.active || 0
              } active (${Math.round(
                ((displayData?.userStats.active || 0) /
                  (displayData?.userStats.total || 1)) *
                  100
              )}%)`}
              icon={PeopleIcon}
              color="primary"
              index={0}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatsCard
              title="Lecturers"
              value={displayData?.roleDistribution.lecturer || 0}
              subValue={`${Math.round(
                ((displayData?.roleDistribution.lecturer || 0) /
                  (displayData?.userStats.total || 1)) *
                  100
              )}% of total users`}
              icon={SchoolIcon}
              color="secondary"
              index={1}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatsCard
              title="Students"
              value={displayData?.roleDistribution.student || 0}
              subValue={`${Math.round(
                ((displayData?.roleDistribution.student || 0) /
                  (displayData?.userStats.total || 1)) *
                  100
              )}% of total users`}
              icon={PersonIcon}
              color="success"
              index={2}
            />
          </Grid>
        </Grid>

        {/* Detailed Statistics */}
        <Grid container spacing={4}>
          {/* User Role Distribution */}
          <Grid item xs={12} md={5}>
            <StatPaper title="User Role Distribution" height={400} index={0}>
              <Box
                sx={{
                  height: { xs: 250, md: "100%" },
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mt: 1,
                  mb: 2,
                }}
              >
                <Doughnut
                  data={roleChartData}
                  options={{
                    maintainAspectRatio: false,
                    cutout: "60%",
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          pointStyle: "circle",
                        },
                      },
                    },
                    animation: {
                      animateScale: true,
                      animateRotate: true,
                    },
                  }}
                />
              </Box>
            </StatPaper>
          </Grid>

          {/* System Health */}
          <Grid item xs={12} md={7}>
            <StatPaper title="System Health" height={400} index={1}>
              <Box sx={{ height: "100%", overflow: "auto", pr: 1 }}>
                <StatusItem
                  icon={CheckCircleIcon}
                  color={
                    displayData?.systemHealth.serverStatus === "Healthy"
                      ? "success"
                      : "error"
                  }
                  primary="Server Status"
                  secondary={
                    displayData?.systemHealth.serverStatus || "Unknown"
                  }
                />
                <StatusItem
                  icon={CheckCircleIcon}
                  color={
                    displayData?.systemHealth.databaseStatus === "Connected"
                      ? "success"
                      : "error"
                  }
                  primary="Database Status"
                  secondary={
                    displayData?.systemHealth.databaseStatus || "Unknown"
                  }
                />
                <StatusItem
                  icon={StorageIcon}
                  color="info"
                  primary="Storage Usage"
                  secondary={
                    displayData?.systemHealth.storageUsage || "Unknown"
                  }
                />
                <StatusItem
                  icon={MemoryIcon}
                  color="warning"
                  primary="Memory Usage"
                  secondary={displayData?.systemHealth.memoryUsage || "Unknown"}
                />
                <StatusItem
                  icon={SpeedIcon}
                  color="secondary"
                  primary="CPU Usage"
                  secondary={displayData?.systemHealth.cpuUsage || "Unknown"}
                />
              </Box>
            </StatPaper>
          </Grid>

          {/* Registration Trends */}
          <Grid item xs={12}>
            <StatPaper
              title="Registration Trends (Last 6 Months)"
              height={400}
              index={2}
            >
              <Box
                sx={{
                  height: { xs: 300, md: "100%" },
                  display: "flex",
                  justifyContent: "center",
                  mt: 1,
                  mb: 2,
                }}
              >
                <Line
                  data={registrationTrendsData}
                  options={{
                    maintainAspectRatio: false,
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          drawBorder: false,
                          color: alpha(theme.palette.text.secondary, 0.08),
                        },
                      },
                      x: {
                        grid: {
                          drawBorder: false,
                          display: false,
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    elements: {
                      line: {
                        tension: 0.4,
                      },
                    },
                    interaction: {
                      mode: "index",
                      intersect: false,
                    },
                    animation: {
                      duration: 1500,
                    },
                  }}
                />
              </Box>
            </StatPaper>
          </Grid>

          {/* Department Distribution */}
          <Grid item xs={12} md={7}>
            <StatPaper title="Department Distribution" height={450} index={3}>
              <Box
                sx={{
                  height: { xs: 350, md: "100%" },
                  display: "flex",
                  justifyContent: "center",
                  mt: 1,
                  mb: 2,
                }}
              >
                <Bar
                  data={departmentChartData}
                  options={{
                    maintainAspectRatio: false,
                    responsive: true,
                    indexAxis: "y",
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          display: false,
                        },
                      },
                      x: {
                        grid: {
                          color: alpha(theme.palette.text.secondary, 0.05),
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    animation: {
                      duration: 1000,
                    },
                  }}
                />
              </Box>
            </StatPaper>
          </Grid>

          {/* Login Activity */}
          <Grid item xs={12} md={5}>
            <StatPaper title="Login Activity" height={450} index={4}>
              <Box sx={{ p: 1, height: "100%", overflow: "auto" }}>
                <StatusItem
                  icon={TrendingUpIcon}
                  color="primary"
                  primary="Today's Logins"
                  secondary={`${
                    displayData?.loginActivity.today || 0
                  } users (${Math.round(
                    ((displayData?.loginActivity.today || 0) /
                      (displayData?.userStats.active || 1)) *
                      100
                  )}% of active users)`}
                />
                <StatusItem
                  icon={TrendingUpIcon}
                  color="primary"
                  primary="This Week's Logins"
                  secondary={`${
                    displayData?.loginActivity.thisWeek || 0
                  } users (${Math.round(
                    ((displayData?.loginActivity.thisWeek || 0) /
                      (displayData?.userStats.active || 1)) *
                      100
                  )}% of active users)`}
                />
                <StatusItem
                  icon={TrendingUpIcon}
                  color="primary"
                  primary="This Month's Logins"
                  secondary={`${
                    displayData?.loginActivity.thisMonth || 0
                  } users (${Math.round(
                    ((displayData?.loginActivity.thisMonth || 0) /
                      (displayData?.userStats.active || 1)) *
                      100
                  )}% of active users)`}
                />
                <StatusItem
                  icon={TrendingUpIcon}
                  color="success"
                  primary="Active User Rate"
                  secondary={`${Math.round(
                    ((displayData?.userStats.active || 0) /
                      (displayData?.userStats.total || 1)) *
                      100
                  )}% of total registered users`}
                />
              </Box>
            </StatPaper>
          </Grid>
        </Grid>
      </Container>
    </Fade>
  );
};

export default Analytics;
