import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, reset } from '../../services/slices/authSlice';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { LockReset } from '@mui/icons-material';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    dispatch(reset());
  }, [dispatch]);

  const onChange = (e) => {
    setEmail(e.target.value);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      dispatch(forgotPassword(email));
      setSubmitted(true);
    }
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
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <LockReset color="primary" sx={{ fontSize: 40, mb: 2 }} />
            <Typography component="h1" variant="h5" gutterBottom>
              Forgot Password
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              Enter your email address and we'll send you a link to reset your password.
            </Typography>

            {isError && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {message}
              </Alert>
            )}

            {isSuccess && submitted && (
              <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                Password reset email sent. Please check your inbox.
              </Alert>
            )}

            <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={onChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, py: 1.5 }}
                disabled={isSuccess && submitted}
              >
                Send Reset Link
              </Button>
              <Grid container>
                <Grid item xs>
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    <Typography variant="body2" color="primary">
                      Back to Login
                    </Typography>
                  </Link>
                </Grid>
                <Grid item>
                  <Link to="/register" style={{ textDecoration: 'none' }}>
                    <Typography variant="body2" color="primary">
                      {"Don't have an account? Sign Up"}
                    </Typography>
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword; 