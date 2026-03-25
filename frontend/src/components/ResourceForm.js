import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Switch,
  Paper,
  Stack,
  Alert,
  Tooltip,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { createResource, updateResource, reset } from '../services/slices/resourceSlice';

const ResourceForm = ({ resource, isEditing = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Fix the issue by accessing resources (plural) from state
  const resourceState = useSelector(state => state.resources || {});
  const { isLoading = false, isSuccess = false, isError = false, message = '' } = resourceState;
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'classroom',
    location: {
      building: '',
      floor: '',
      roomNumber: ''
    },
    capacity: 30,
    description: '',
    availability: true,
    reservationRequiresApproval: false,
    allowedRoles: ['lecturer', 'admin']
  });
  
  const [errors, setErrors] = useState({});
  
  // Initialize form with resource data if editing
  useEffect(() => {
    if (isEditing && resource) {
      setFormData({
        name: resource.name || '',
        type: resource.type || 'classroom',
        location: {
          building: resource.location?.building || '',
          floor: resource.location?.floor || '',
          roomNumber: resource.location?.roomNumber || ''
        },
        capacity: resource.capacity || 30,
        description: resource.description || '',
        availability: resource.availability !== undefined ? resource.availability : true,
        reservationRequiresApproval: resource.reservationRequiresApproval !== undefined ? resource.reservationRequiresApproval : false,
        allowedRoles: resource.allowedRoles || ['lecturer', 'admin']
      });
    }
  }, [isEditing, resource]);
  
  // Reset state on successful submission and navigate back to resources page
  useEffect(() => {
    if (isSuccess) {
      // Reset the success state
      dispatch(reset());
      
      // Show success message
      const message = isEditing ? 'Resource updated successfully' : 'Resource created successfully';
      toast.success(message);
      
      // Navigate back to resources list for both create and update operations
      setTimeout(() => {
        navigate('/resources', { 
          state: { 
            fromCreate: true,
            timestamp: new Date().getTime() // Add timestamp to ensure state is unique
          } 
        });
      }, 1000);
    }
  }, [isSuccess, dispatch, navigate, isEditing]);
  
  // Show error message
  useEffect(() => {
    if (isError) {
      toast.error(message);
      dispatch(reset());
    }
  }, [isError, message, dispatch]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleBooleanChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleRoleChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      allowedRoles: value
    }));
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Check required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.location.building.trim()) {
      newErrors['location.building'] = 'Building is required';
    }
    
    if (!formData.location.floor.trim()) {
      newErrors['location.floor'] = 'Floor is required';
    }
    
    // Check capacity for classrooms and laboratories
    if ((formData.type === 'classroom' || formData.type === 'laboratory')) {
      if (!formData.capacity) {
        newErrors.capacity = 'Capacity is required';
      } else if (formData.capacity <= 0) {
        newErrors.capacity = 'Capacity must be greater than 0';
      }
    }
    
    // Check if at least one role is selected
    if (!formData.allowedRoles.length) {
      newErrors.allowedRoles = 'At least one role must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    try {
      // Deep clone the form data to avoid any mutation issues
      const formDataForSubmission = JSON.parse(JSON.stringify(formData));
      
      // Convert capacity to number if present
      if (formDataForSubmission.capacity) {
        formDataForSubmission.capacity = Number(formDataForSubmission.capacity);
      }
      
      // Make sure allowedRoles is properly formed
      if (typeof formDataForSubmission.allowedRoles === 'string') {
        formDataForSubmission.allowedRoles = JSON.parse(formDataForSubmission.allowedRoles);
      }
      
      if (isEditing) {
        dispatch(updateResource({ 
          resourceId: resource._id, 
          resourceData: formDataForSubmission 
        }));
      } else {
        // Create the resource and set success flag on completion
        dispatch(createResource(formDataForSubmission))
          .unwrap()
          .then(() => {
            console.log('Resource created successfully, setting success flag');
          })
          .catch(error => {
            console.error('Error creating resource:', error);
          });
      }
    } catch (error) {
      console.error('Error preparing form data:', error);
      toast.error('Error preparing form data: ' + error.message);
    }
  };
  
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'lecturer':
        return 'primary';
      case 'student':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Card elevation={3}>
        <CardHeader 
          title={
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {isEditing ? 'Edit Resource' : 'Add New Resource'}
            </Typography>
          }
          subheader={
            <Typography variant="subtitle1" color="text.secondary">
              {isEditing ? 'Update resource details' : 'Fill in the details to add a new resource'}
            </Typography>
          }
          sx={{ bgcolor: 'background.paper', pb: 0 }}
        />
        <Divider sx={{ mx: 2 }} />
        <CardContent sx={{ pt: 3 }}>
          {isError && (
            <Alert severity="error" sx={{ mb: 3 }}>{message}</Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              {/* Basic Information Section */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: 2, mb: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom color="primary.dark" sx={{ display: 'flex', alignItems: 'center' }}>
                    Basic Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {/* Name */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        required
                        fullWidth
                        id="name"
                        name="name"
                        label="Resource Name"
                        value={formData.name}
                        onChange={handleChange}
                        error={!!errors.name}
                        helperText={errors.name}
                        variant="outlined"
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    
                    {/* Type */}
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                        <InputLabel id="type-label">Resource Type</InputLabel>
                        <Select
                          labelId="type-label"
                          id="type"
                          name="type"
                          value={formData.type}
                          label="Resource Type"
                          onChange={handleChange}
                        >
                          <MenuItem value="classroom">Classroom</MenuItem>
                          <MenuItem value="laboratory">Laboratory</MenuItem>
                          <MenuItem value="equipment">Equipment</MenuItem>
                          <MenuItem value="facility">Facility</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {/* Capacity (only for classroom and laboratory) */}
                    {(formData.type === 'classroom' || formData.type === 'laboratory') && (
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          id="capacity"
                          name="capacity"
                          label="Capacity"
                          type="number"
                          value={formData.capacity}
                          onChange={handleChange}
                          error={!!errors.capacity}
                          helperText={errors.capacity}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Tooltip title="Maximum number of people that can use this resource">
                                  <InfoIcon color="action" fontSize="small" />
                                </Tooltip>
                              </InputAdornment>
                            ),
                            inputProps: { min: 1 }
                          }}
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                    )}
                    
                    {/* Description */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        id="description"
                        name="description"
                        label="Description"
                        multiline
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        variant="outlined"
                        placeholder="Provide details about this resource"
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              {/* Location Section */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: 2, mb: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom color="primary.dark">
                    Location Details
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {/* Building */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        required
                        fullWidth
                        id="location.building"
                        name="location.building"
                        label="Building"
                        value={formData.location.building}
                        onChange={handleChange}
                        error={!!errors['location.building']}
                        helperText={errors['location.building']}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BusinessIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                        variant="outlined"
                      />
                    </Grid>
                    
                    {/* Floor */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        required
                        fullWidth
                        id="location.floor"
                        name="location.floor"
                        label="Floor"
                        value={formData.location.floor}
                        onChange={handleChange}
                        error={!!errors['location.floor']}
                        helperText={errors['location.floor']}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ApartmentIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                        variant="outlined"
                      />
                    </Grid>
                    
                    {/* Room Number */}
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        id="location.roomNumber"
                        name="location.roomNumber"
                        label="Room Number"
                        value={formData.location.roomNumber}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MeetingRoomIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              {/* Availability and Permissions Section */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.subtle', borderRadius: 2 }}>
                  <Typography variant="h6" component="h3" gutterBottom color="primary.dark">
                    Availability & Permissions
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {/* Availability */}
                    <Grid item xs={12} md={6}>
                      <FormControl component="fieldset" variant="standard" sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.availability}
                              onChange={handleBooleanChange}
                              name="availability"
                              color="primary"
                            />
                          }
                          label={
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body1" component="span">
                                Resource is Available
                              </Typography>
                              <Tooltip title="Toggle to indicate if this resource is currently available for booking">
                                <InfoIcon color="action" fontSize="small" sx={{ ml: 1 }} />
                              </Tooltip>
                            </Box>
                          }
                        />
                      </FormControl>
                    </Grid>
                    
                    {/* Requires Approval */}
                    <Grid item xs={12} md={6}>
                      <FormControl component="fieldset" variant="standard" sx={{ mb: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.reservationRequiresApproval}
                              onChange={handleBooleanChange}
                              name="reservationRequiresApproval"
                              color="primary"
                            />
                          }
                          label={
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body1" component="span">
                                Reservations Require Approval
                              </Typography>
                              <Tooltip title="If enabled, reservations will need admin approval before being confirmed">
                                <InfoIcon color="action" fontSize="small" sx={{ ml: 1 }} />
                              </Tooltip>
                            </Box>
                          }
                        />
                      </FormControl>
                    </Grid>
                    
                    {/* Allowed Roles */}
                    <Grid item xs={12}>
                      <FormControl fullWidth error={!!errors.allowedRoles} variant="outlined" sx={{ mb: 2 }}>
                        <InputLabel id="allowed-roles-label">Allowed Roles</InputLabel>
                        <Select
                          labelId="allowed-roles-label"
                          id="allowedRoles"
                          multiple
                          value={formData.allowedRoles}
                          label="Allowed Roles"
                          onChange={handleRoleChange}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip 
                                  key={value} 
                                  label={value.charAt(0).toUpperCase() + value.slice(1)} 
                                  color={getRoleColor(value)}
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          )}
                        >
                          <MenuItem value="student">Student</MenuItem>
                          <MenuItem value="lecturer">Lecturer</MenuItem>
                          <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                        {errors.allowedRoles && (
                          <FormHelperText>{errors.allowedRoles}</FormHelperText>
                        )}
                        <FormHelperText>Select which user roles are allowed to book this resource</FormHelperText>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
              
              {/* Submit Button */}
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                  <Button
                    type="button"
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/resources')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isLoading}
                    sx={{ px: 4 }}
                  >
                    {isLoading ? (
                      <CircularProgress size={24} />
                    ) : isEditing ? (
                      'Update Resource'
                    ) : (
                      'Add Resource'
                    )}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default ResourceForm; 