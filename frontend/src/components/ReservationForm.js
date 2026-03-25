import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { createReservation, reset, getResourceReservations } from '../services/slices/reservationSlice';
import { format } from 'date-fns';

const ReservationForm = ({ resource, open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user } = useSelector(state => state.auth || {});
  const { isLoading, isSuccess, isError, message } = useSelector(state => state.reservation || {});
  
  const [formData, setFormData] = useState({
    resource: resource?._id || '',
    title: '',
    purpose: '',
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000), // Default to 1 hour later
    attendees: 1
  });
  
  const [errors, setErrors] = useState({});
  const [existingReservations, setExistingReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  
  // Load existing reservations when resource changes
  useEffect(() => {
    if (resource?._id && open) {
      setLoadingReservations(true);
      dispatch(getResourceReservations(resource._id))
        .unwrap()
        .then(result => {
          if (result && result.data) {
            setExistingReservations(result.data);
          }
          setLoadingReservations(false);
        })
        .catch(error => {
          console.error('Failed to load reservations:', error);
          setLoadingReservations(false);
        });
    }
  }, [resource, dispatch, open]);
  
  // Handle success and error states
  useEffect(() => {
    if (isSuccess) {
      toast.success('Reservation created successfully');
      dispatch(reset());
      onClose();
    }
    
    if (isError) {
      toast.error(message || 'Failed to create reservation');
      dispatch(reset());
    }
  }, [isSuccess, isError, message, dispatch, onClose]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleDateChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };
  
  // Check if the selected time conflicts with existing reservations
  const hasTimeConflict = (startTime, endTime) => {
    if (!existingReservations || existingReservations.length === 0) {
      return false;
    }
    
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    
    return existingReservations.some(reservation => {
      const reservationStart = new Date(reservation.startTime).getTime();
      const reservationEnd = new Date(reservation.endTime).getTime();
      
      // Check for overlap
      return (start < reservationEnd && end > reservationStart);
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Check required fields
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    } else if (formData.endTime <= formData.startTime) {
      newErrors.endTime = 'End time must be after start time';
    }
    
    if (!formData.attendees || formData.attendees < 1) {
      newErrors.attendees = 'Number of attendees must be at least 1';
    } else if (
      resource && 
      (resource.type === 'classroom' || resource.type === 'laboratory') && 
      formData.attendees > resource.capacity
    ) {
      newErrors.attendees = `Number of attendees cannot exceed capacity (${resource.capacity})`;
    }
    
    // Check for time conflicts
    if (formData.startTime && formData.endTime) {
      if (hasTimeConflict(formData.startTime, formData.endTime)) {
        newErrors.conflict = 'This time slot conflicts with an existing reservation';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Format dates to ISO strings for backend compatibility
      const formattedData = {
        ...formData,
        startTime: formData.startTime instanceof Date ? formData.startTime.toISOString() : formData.startTime,
        endTime: formData.endTime instanceof Date ? formData.endTime.toISOString() : formData.endTime
      };
      
      console.log('Submitting reservation:', formattedData);
      dispatch(createReservation(formattedData));
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Error creating reservation');
    }
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'MMM dd, yyyy h:mm a');
    } catch (e) {
      return date.toString();
    }
  };
  
  // Only lecturers and admins can book resources
  const canBookResource = user && (user.role === 'lecturer' || user.role === 'admin');
  
  if (!resource) {
    return null;
  }
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Book {resource.name}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          {!canBookResource ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Only lecturers and administrators can book resources.
            </Alert>
          ) : !resource.availability ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              This resource is currently unavailable for booking.
            </Alert>
          ) : (
            <>
              <DialogContentText sx={{ mb: 3 }}>
                Please fill in the details to book this resource.
                {resource.reservationRequiresApproval && (
                  <Typography component="span" color="warning.main" fontWeight="bold">
                    {' '}Note: This reservation will require approval before it is confirmed.
                  </Typography>
                )}
              </DialogContentText>
              
              {errors.conflict && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.conflict}
                </Alert>
              )}
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          required
                          fullWidth
                          id="title"
                          name="title"
                          label="Reservation Title"
                          value={formData.title}
                          onChange={handleChange}
                          error={!!errors.title}
                          helperText={errors.title}
                          disabled={isLoading}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          required
                          fullWidth
                          id="purpose"
                          name="purpose"
                          label="Purpose"
                          multiline
                          rows={3}
                          value={formData.purpose}
                          onChange={handleChange}
                          error={!!errors.purpose}
                          helperText={errors.purpose}
                          disabled={isLoading}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <DateTimePicker
                          label="Start Time"
                          value={formData.startTime}
                          onChange={(newValue) => handleDateChange('startTime', newValue)}
                          renderInput={(params) => (
                            <TextField 
                              {...params} 
                              fullWidth 
                              required
                              error={!!errors.startTime}
                              helperText={errors.startTime}
                            />
                          )}
                          disabled={isLoading}
                          minDateTime={new Date()}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <DateTimePicker
                          label="End Time"
                          value={formData.endTime}
                          onChange={(newValue) => handleDateChange('endTime', newValue)}
                          renderInput={(params) => (
                            <TextField 
                              {...params} 
                              fullWidth 
                              required
                              error={!!errors.endTime}
                              helperText={errors.endTime}
                            />
                          )}
                          disabled={isLoading}
                          minDateTime={formData.startTime}
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          required
                          fullWidth
                          id="attendees"
                          name="attendees"
                          label="Number of Attendees"
                          type="number"
                          value={formData.attendees}
                          onChange={handleChange}
                          error={!!errors.attendees}
                          helperText={errors.attendees}
                          disabled={isLoading}
                          InputProps={{ inputProps: { min: 1, max: resource.capacity || 9999 } }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={5}>
                  <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="h6" gutterBottom>
                      Existing Reservations
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {loadingReservations ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : existingReservations.length > 0 ? (
                      <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                        {existingReservations.map((reservation) => (
                          <React.Fragment key={reservation._id}>
                            <ListItem alignItems="flex-start">
                              <ListItemText
                                primary={reservation.title}
                                secondary={
                                  <>
                                    <Typography variant="body2" component="span">
                                      Start: {formatDate(reservation.startTime)}
                                    </Typography>
                                    <br />
                                    <Typography variant="body2" component="span">
                                      End: {formatDate(reservation.endTime)}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                            <Divider component="li" />
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        No existing reservations for this resource.
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        {canBookResource && resource.availability && (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary" 
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Book Resource'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReservationForm; 