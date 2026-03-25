import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { register, reset } from "../../store/slices/authSlice";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  PersonAdd,
  School,
  Work,
  AdminPanelSettings,
} from "@mui/icons-material";

const Register = () => {

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const { firstName, lastName, email, password, confirmPassword, role } =
    formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess) {
      toast.success(
        "Registration successful! Please log in with your credentials."
      );
      navigate("/login");
    }

    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    // Allow only IIIT Vadodara email
    if (!email.endsWith("@iiitvadodara.ac.in")) {
      toast.error("Only IIIT Vadodara email allowed");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const userData = {
      firstName,
      lastName,
      email,
      password,
      role,
    };

    dispatch(register(userData));
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >

        <Paper elevation={3} sx={{ p: 4, width: "100%" }}>

          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            mb={3}
          >
            <PersonAdd fontSize="large" color="primary" sx={{ mr: 1 }} />
            <Typography component="h1" variant="h4">
              Create an Account
            </Typography>
          </Box>

          <Typography
            variant="body1"
            align="center"
            color="text.secondary"
            mb={3}
          >
            Join the Smart Campus Management System to access all campus resources and services
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box component="form" onSubmit={onSubmit} noValidate>

            <Grid container spacing={2}>

              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  required
                  fullWidth
                  label="First Name"
                  value={firstName}
                  onChange={onChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={lastName}
                  onChange={onChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="IIIT Vadodara Email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  placeholder="202451164@iiitvadodara.ac.in"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={onChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={onChange}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>

                  <Select
                    name="role"
                    value={role}
                    label="Role"
                    onChange={onChange}
                  >

                    <MenuItem value="student">
                      <Box display="flex" alignItems="center">
                        <School sx={{ mr: 1 }} />
                        Student
                      </Box>
                    </MenuItem>

                    <MenuItem value="lecturer">
                      <Box display="flex" alignItems="center">
                        <Work sx={{ mr: 1 }} />
                        Lecturer
                      </Box>
                    </MenuItem>

                    <MenuItem value="admin">
                      <Box display="flex" alignItems="center">
                        <AdminPanelSettings sx={{ mr: 1 }} />
                        Administrator
                      </Box>
                    </MenuItem>

                  </Select>
                </FormControl>
              </Grid>

            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              Register
            </Button>

            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link to="/login" style={{ textDecoration: "none" }}>
                  <Typography variant="body2" color="primary">
                    Already have an account? Sign in
                  </Typography>
                </Link>
              </Grid>
            </Grid>

          </Box>

        </Paper>
      </Box>
    </Container>
  );
};

export default Register;