import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Link,
  InputAdornment,
  IconButton,
  Alert,
  Collapse,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { login, clearError } from "../../store/slices/authSlice";
import { toast } from "react-toastify";
import { testApiConnection, pingServer } from "../../services/api";

const SignIn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [latency, setLatency] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced connection check with latency
  const checkConnection = useCallback(async () => {
    setIsConnecting(true);
    try {
      const ping = await pingServer();
      if (ping !== -1) {
        setLatency(ping);
        setConnectionError(false);
        return true;
      }
      throw new Error("Connection failed");
    } catch (error) {
      console.error("Connection check failed:", error);
      setConnectionError(true);
      setLatency(null);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Initial connection check
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Authentication check
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Error handling
  useEffect(() => {
    if (error) {
      if (
        error.includes("Unable to connect") ||
        error.includes("Network Error")
      ) {
        setConnectionError(true);
        setRetryCount((prev) => prev + 1);
      }
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(login(formData)).unwrap();
      toast.success("Login successful!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (
        typeof err === "string" &&
        (err.includes("Unable to connect") || err.includes("Network Error"))
      ) {
        setConnectionError(true);
        await checkConnection();
      }
    }
  };

  const handleRetryConnection = async () => {
    try {
      console.log("Attempting to reconnect...");
      const isConnected = await checkConnection();
      if (isConnected) {
        toast.success(`Connection restored! Latency: ${latency}ms`);
        setRetryCount(0);
      } else {
        toast.error(
          "Still unable to connect. Please check if the backend server is running."
        );
        setRetryCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Retry connection error:", error);
      toast.error("Failed to reconnect. Please try again.");
      setRetryCount((prev) => prev + 1);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  if (isConnecting) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Checking server connection...
        </Typography>
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
          <Box sx={{ mb: 3, textAlign: "center" }}>
            <LoginIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography component="h1" variant="h5">
              Sign In
            </Typography>
            {latency && (
              <Typography variant="caption" color="textSecondary">
                Server latency: {latency}ms
              </Typography>
            )}
          </Box>

          <Collapse in={connectionError}>
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleRetryConnection}
                  startIcon={<RefreshIcon />}
                  disabled={isConnecting}
                >
                  {isConnecting ? "Retrying..." : "RETRY CONNECTION"}
                </Button>
              }
            >
              {retryCount > 3
                ? "Multiple connection attempts failed. Please check your backend server status."
                : "Unable to connect to the server. Please ensure the backend server is running and try again."}
            </Alert>
          </Collapse>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
              disabled={loading || connectionError}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading || connectionError}
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                      disabled={loading || connectionError}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                height: 48,
                position: "relative",
              }}
              disabled={loading || connectionError}
            >
              {loading ? (
                <CircularProgress
                  size={24}
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginTop: "-12px",
                    marginLeft: "-12px",
                  }}
                />
              ) : connectionError ? (
                "Check Server Connection"
              ) : (
                "Sign In"
              )}
            </Button>
            <Box sx={{ textAlign: "center" }}>
              <Link href="/forgot-password" variant="body2" underline="hover">
                Forgot password?
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignIn;
