import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Card,
  CardContent,
  Alert,
  Paper,
  Divider,
  Avatar,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import { login, reset } from "../../services/slices/authSlice";
import { setAuthToken } from "../../services/api";
import { toast } from "react-toastify";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [animated, setAnimated] = useState(false);

  // Get the redirect path from location state or default to dashboard
  // eslint-disable-next-line no-unused-vars
  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    // Trigger animation after component mounts
    setTimeout(() => {
      setAnimated(true);
    }, 100);

    if (isAuthenticated && user) {
      // Redirect based on user role
      switch (user.role) {
        case "admin":
          navigate("/admin/analytics");
          break;
        case "lecturer":
          navigate("/dashboard");
          break;
        case "student":
        case "user":
          navigate("/dashboard");
          break;
        default:
          navigate("/dashboard");
      }
    }
  }, [isAuthenticated, user, navigate]);

  // After successful login, ensure token is properly stored
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("Login successful, ensuring token is properly stored");

      // Explicitly set the token in localStorage as a backup
      if (user.token) {
        localStorage.setItem("token", user.token);

        // Also ensure the API default headers are set
        if (typeof setAuthToken === "function") {
          setAuthToken(user.token);
        }
      }
    }
  }, [isAuthenticated, user]);

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
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
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    // Clear API error when user makes changes
    if (error) {
      dispatch(reset());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        // Clear any previous errors
        dispatch(reset());

        // Dispatch login action and get the result
        const resultAction = await dispatch(login(formData));

        // Check if the action was rejected (login failed)
        if (login.rejected.match(resultAction)) {
          // Error handling is managed by the toast in the slice
          console.error("Login failed:", resultAction.payload);
          // Keep the user on the page (no redirect happens)
        }
        // Success case is handled by the useEffect that watches isAuthenticated
      } catch (error) {
        console.error("Login error:", error);
        // Show error message to user
        toast.error(
          error.message || "Login failed. Please check your credentials."
        );
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #64b5f6 0%, #1976d2 100%)",
        backgroundSize: "cover",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.2) 1%, transparent 3%), " +
            "radial-gradient(circle at 70% 60%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.15) 1%, transparent 3%)",
          backgroundSize: "100% 100%",
          zIndex: 1,
        },
        p: 3,
      }}

      
    >
      
      {/* Add back the header logo section */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          left: 30,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            bgcolor: "white",
            width: 40,
            height: 40,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <SchoolIcon sx={{ color: "#1976d2" }} />
        </Avatar>
        <Typography
          variant="h6"
          sx={{
            color: "white",
            fontWeight: 700,
            textShadow: "0 2px 4px rgba(0,0,0,0.2)",
            display: { xs: "none", sm: "block" },
          }}
        >
          Smart Campus Management System
        </Typography>
      </Box>

      <Paper
        elevation={12}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          maxWidth: 900,
          width: "100%",
          overflow: "hidden",
          borderRadius: 3,
          transform: animated
            ? "translateY(0) scale(1)"
            : "translateY(20px) scale(0.98)",
          opacity: animated ? 1 : 0,
          transition: "all 0.4s ease-out",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Left side - Decorative */}
        <Box
          sx={{
            flexBasis: { md: "45%" },
            background: "linear-gradient(135deg, #64b5f6 0%, #1976d2 100%)",
            p: 5,
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            textAlign: "center",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "url('https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.2,
            },
          }}
        >
          <Box sx={{ position: "relative", mb: 3 }}>
            <SchoolIcon sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Smart Campus
            </Typography>
            <Typography variant="body1">
              Empowering education through technology
            </Typography>
          </Box>

          <Box
            sx={{
              mt: 5,
              p: 2,
              borderRadius: 2,
              position: "relative",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography
              variant="body2"
              sx={{ opacity: 0.9, fontStyle: "italic" }}
            >
              "Education is the passport to the future, for tomorrow belongs to
              those who prepare for it today."
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: "block", mt: 1, opacity: 0.7 }}
            >
              — Malcolm X
            </Typography>
          </Box>
        </Box>

        {/* Right side - Login form */}
        <Box
          sx={{
            flexBasis: { md: "55%" },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            p: { xs: 3, sm: 5 },
            backgroundColor: "white",
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Avatar
              sx={{
                mx: "auto",
                mb: 2,
                bgcolor: "primary.main",
                width: 56,
                height: 56,
              }}
            >
              <LockIcon />
            </Avatar>
            <Typography
              variant="h4"
              component="h1"
              fontWeight={700}
              gutterBottom
              sx={{
                background: "linear-gradient(90deg, #007BFF 0%, #6610f2 100%)",
                backgroundClip: "text",
                textFillColor: "transparent",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Sign in to continue to Smart Campus
            </Typography>
            <Divider sx={{ width: "40%", mx: "auto", mb: 4 }} />
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                animation: "shake 0.5s",
                "@keyframes shake": {
                  "0%, 100%": { transform: "translateX(0)" },
                  "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
                  "20%, 40%, 60%, 80%": { transform: "translateX(5px)" },
                },
              }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={Boolean(validationErrors.email)}
              helperText={validationErrors.email}
              disabled={loading}
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  transition: "all 0.3s",
                  "&:hover fieldset": {
                    borderColor: "primary.main",
                  },
                  "&.Mui-focused fieldset": {
                    borderWidth: "1px",
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              error={Boolean(validationErrors.password)}
              helperText={validationErrors.password}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={togglePasswordVisibility}
                      edge="end"
                      aria-label={
                        showPassword ? "hide password" : "show password"
                      }
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  transition: "all 0.3s",
                  "&:hover fieldset": {
                    borderColor: "primary.main",
                  },
                  "&.Mui-focused fieldset": {
                    borderWidth: "1px",
                  },
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              disabled={loading}
              sx={{
                mb: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "0 4px 14px 0 rgba(0,118,255,0.39)",
                transition: "all 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 6px 20px rgba(0,118,255,0.39)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Sign In"
              )}
            </Button>

            <Box
              sx={{
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Link
                to="/forgot-password"
                style={{
                  textDecoration: "none",
                  color: "#6B73FF",
                  fontWeight: 500,
                  fontSize: "0.875rem",
                }}
              >

                Forgot Password?
              </Link>
            </Box>
            
            <Typography
            variant="body2"
             sx={{
                  mt: 2,
                  textAlign: "center",
                  color: "text.secondary",
                   }}
                >
               Don't have an account?{" "}
               <Link
               to="/signup"
               style={{
               textDecoration: "none",
               color: "#1976d2",
              fontWeight: 600,
               }}
   >
               Sign Up
             </Link>
            </Typography>
          </form>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
