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
  CircularProgress
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { createEvent, updateEvent, reset } from '../services/slices/eventSlice';

const EventForm = ({ event, isEditing = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, isSuccess, isError, message } = useSelector(state => state.events);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'other',
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour from now
    location: 'Auditorium', // Set default venue
    capacity: 50,
    registrationRequired: true,
    registrationDeadline: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // 1 day from now
    visibility: 'public',
    allowedRoles: ['student', 'lecturer', 'admin'],
    tags: [],
    image: '',
    speakers: []
  });
  
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [speakerInput, setSpeakerInput] = useState({
    name: '',
    title: '',
    organization: '',
    bio: ''
  });
  
  // Initialize form with event data if editing
  useEffect(() => {
    if (isEditing && event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        type: event.type || 'other',
        startDate: event.startDate ? new Date(event.startDate) : new Date(),
        endDate: event.endDate ? new Date(event.endDate) : new Date(new Date().getTime() + 60 * 60 * 1000),
        location: event.location || 'Auditorium',
        capacity: event.capacity || 50,
        registrationRequired: event.registrationRequired !== undefined ? event.registrationRequired : true,
        registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline) : new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
        visibility: event.visibility || 'public',
        allowedRoles: event.allowedRoles || ['student', 'lecturer', 'admin'],
        tags: event.tags || [],
        image: event.image || '',
        speakers: event.speakers || []
      });
    }
  }, [isEditing, event]);
  
  // Reset state on successful submission
  useEffect(() => {
    if (isSuccess) {
      dispatch(reset());
      navigate('/events');
    }
  }, [isSuccess, dispatch, navigate]);
  
  // Show error message
  useEffect(() => {
    if (isError) {
      toast.error(message);
      dispatch(reset());
    }
  }, [isError, message, dispatch]);
  
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
  
  const handleDateChange = (name, value) => {
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
  
  const handleCheckboxChange = (e) => {
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
  
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };
  
  const handleDeleteTag = (tagToDelete) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToDelete)
    }));
  };
  
  const handleSpeakerInputChange = (e) => {
    const { name, value } = e.target;
    setSpeakerInput(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAddSpeaker = () => {
    if (speakerInput.name.trim()) {
      setFormData(prev => ({
        ...prev,
        speakers: [...prev.speakers, { ...speakerInput }]
      }));
      setSpeakerInput({
        name: '',
        title: '',
        organization: '',
        bio: ''
      });
    }
  };
  
  const handleDeleteSpeaker = (index) => {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== index)
    }));
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (formData.endDate <= formData.startDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    if (formData.registrationRequired && formData.registrationDeadline >= formData.startDate) {
      newErrors.registrationDeadline = 'Registration deadline must be before event start date';
    }
    
    if (formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }
    
    if (formData.visibility === 'restricted' && formData.allowedRoles.length === 0) {
      newErrors.allowedRoles = 'At least one role must be selected for restricted visibility';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    if (isEditing) {
      dispatch(updateEvent({
        id: event._id,
        eventData: formData
      }));
    } else {
      dispatch(createEvent(formData));
    }
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Card>
        <CardHeader 
          title={isEditing ? 'Edit Event' : 'Create New Event'} 
          subheader={isEditing ? 'Update event details' : 'Fill in the details to create a new event'}
        />
        <Divider />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={3}>
              {/* Title */}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="title"
                  name="title"
                  label="Event Title"
                  value={formData.title}
                  onChange={handleChange}
                  error={!!errors.title}
                  helperText={errors.title}
                />
              </Grid>
              
              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  id="description"
                  name="description"
                  label="Description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  error={!!errors.description}
                  helperText={errors.description}
                />
              </Grid>
              
              {/* Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="type-label">Event Type</InputLabel>
                  <Select
                    labelId="type-label"
                    id="type"
                    name="type"
                    value={formData.type}
                    label="Event Type"
                    onChange={handleChange}
                  >
                    <MenuItem value="seminar">Seminar</MenuItem>
                    <MenuItem value="workshop">Workshop</MenuItem>
                    <MenuItem value="conference">Conference</MenuItem>
                    <MenuItem value="guest_lecture">Guest Lecture</MenuItem>
                    <MenuItem value="social">Social Event</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Location */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.location}>
                  <InputLabel id="location-label">Venue</InputLabel>
                  <Select
                    labelId="location-label"
                    id="location"
                    name="location"
                    value={formData.location}
                    label="Venue"
                    onChange={handleChange}
                  >
                    <MenuItem value="Auditorium">Auditorium</MenuItem>
                    <MenuItem value="Lecture Hall 1">Lecture Hall 1</MenuItem>
                    <MenuItem value="Lecture Hall 2">Lecture Hall 2</MenuItem>
                    <MenuItem value="Lecture Hall 3">Lecture Hall 3</MenuItem>
                    <MenuItem value="Lecture Hall 4">Lecture Hall 4</MenuItem>
                    <MenuItem value="Lecture Hall 5">Lecture Hall 5</MenuItem>
                    <MenuItem value="Lecture Hall 6">Lecture Hall 6</MenuItem>
                    <MenuItem value="Lecture Hall 7">Lecture Hall 7</MenuItem>
                    <MenuItem value="Lecture Hall 8">Lecture Hall 8</MenuItem>
                    <MenuItem value="Lecture Hall 9">Lecture Hall 9</MenuItem>
                    <MenuItem value="Lecture Hall 10">Lecture Hall 10</MenuItem>
                    <MenuItem value="Computer Lab 1">Computer Lab 1</MenuItem>
                    <MenuItem value="Computer Lab 2">Computer Lab 2</MenuItem>
                    <MenuItem value="Computer Lab 3">Computer Lab 3</MenuItem>
                    <MenuItem value="Chemistry Lab">Chemistry Lab</MenuItem>
                    <MenuItem value="Gymnasium">Gymnasium</MenuItem>
                    <MenuItem value="Cafeteria">Cafeteria</MenuItem>
                    <MenuItem value="Indoor Sports Complex">Indoor Sports Complex</MenuItem>
                    <MenuItem value="Campus Ground">Campus Ground</MenuItem>
                  </Select>
                  {errors.location && <FormHelperText>{errors.location}</FormHelperText>}
                </FormControl>
              </Grid>
              
              {/* Start Date */}
              <Grid item xs={12} md={6}>
                <DateTimePicker
                  label="Start Date & Time"
                  value={formData.startDate}
                  onChange={(newValue) => handleDateChange('startDate', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.startDate,
                      helperText: errors.startDate
                    }
                  }}
                />
              </Grid>
              
              {/* End Date */}
              <Grid item xs={12} md={6}>
                <DateTimePicker
                  label="End Date & Time"
                  value={formData.endDate}
                  onChange={(newValue) => handleDateChange('endDate', newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.endDate,
                      helperText: errors.endDate
                    }
                  }}
                />
              </Grid>
              
              {/* Capacity */}
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  id="capacity"
                  name="capacity"
                  label="Capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  error={!!errors.capacity}
                  helperText={errors.capacity}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              
              {/* Registration Required */}
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.registrationRequired}
                      onChange={handleCheckboxChange}
                      name="registrationRequired"
                    />
                  }
                  label="Registration Required"
                />
              </Grid>
              
              {/* Registration Deadline (only if registration is required) */}
              {formData.registrationRequired && (
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Registration Deadline"
                    value={formData.registrationDeadline}
                    onChange={(newValue) => handleDateChange('registrationDeadline', newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.registrationDeadline,
                        helperText: errors.registrationDeadline
                      }
                    }}
                  />
                </Grid>
              )}
              
              {/* Visibility */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="visibility-label">Visibility</InputLabel>
                  <Select
                    labelId="visibility-label"
                    id="visibility"
                    name="visibility"
                    value={formData.visibility}
                    label="Visibility"
                    onChange={handleChange}
                  >
                    <MenuItem value="public">Public</MenuItem>
                    <MenuItem value="private">Private</MenuItem>
                    <MenuItem value="restricted">Restricted</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Allowed Roles (only if visibility is restricted) */}
              {formData.visibility === 'restricted' && (
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!errors.allowedRoles}>
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
                            <Chip key={value} label={value} />
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
                  </FormControl>
                </Grid>
              )}
              
              {/* Tags */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TextField
                    fullWidth
                    id="tagInput"
                    label="Add Tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddTag}
                    sx={{ ml: 1, height: 56 }}
                  >
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {formData.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleDeleteTag(tag)}
                    />
                  ))}
                </Box>
              </Grid>
              
              {/* Image URL */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="image"
                  name="image"
                  label="Image URL"
                  value={formData.image}
                  onChange={handleChange}
                />
              </Grid>
              
              {/* Speakers */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Speakers
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      id="speakerName"
                      name="name"
                      label="Name"
                      value={speakerInput.name}
                      onChange={handleSpeakerInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      id="speakerTitle"
                      name="title"
                      label="Title"
                      value={speakerInput.title}
                      onChange={handleSpeakerInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      id="speakerOrganization"
                      name="organization"
                      label="Organization"
                      value={speakerInput.organization}
                      onChange={handleSpeakerInputChange}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleAddSpeaker}
                      sx={{ height: 56 }}
                    >
                      Add Speaker
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="speakerBio"
                      name="bio"
                      label="Bio"
                      multiline
                      rows={2}
                      value={speakerInput.bio}
                      onChange={handleSpeakerInputChange}
                    />
                  </Grid>
                </Grid>
                
                {formData.speakers.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Added Speakers:
                    </Typography>
                    {formData.speakers.map((speaker, index) => (
                      <Box key={index} sx={{ mb: 1, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1">
                            <strong>{speaker.name}</strong> {speaker.title && `- ${speaker.title}`} {speaker.organization && `(${speaker.organization})`}
                          </Typography>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleDeleteSpeaker(index)}
                          >
                            Remove
                          </Button>
                        </Box>
                        {speaker.bio && (
                          <Typography variant="body2" color="text.secondary">
                            {speaker.bio}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Grid>
              
              {/* Submit Button */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="button"
                    variant="outlined"
                    sx={{ mr: 1 }}
                    onClick={() => navigate('/events')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <CircularProgress size={24} />
                    ) : isEditing ? (
                      'Update Event'
                    ) : (
                      'Create Event'
                    )}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default EventForm; 