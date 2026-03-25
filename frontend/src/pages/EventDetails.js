import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Avatar,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Breadcrumbs,
  Link,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarTodayIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getEvent, deleteEvent, registerForEvent, unregisterFromEvent, clearEvent } from '../services/slices/eventSlice';
import { toast } from 'react-toastify';
import { addEventToCalendar } from '../utils/calendarUtils';

const EventDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { event, isLoading, isError } = useSelector(state => state.events);
  const { user } = useSelector(state => state.auth);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unregisterDialogOpen, setUnregisterDialogOpen] = useState(false);
  const [calendarSnackbarOpen, setCalendarSnackbarOpen] = useState(false);
  const [calendarSnackbarMessage, setCalendarSnackbarMessage] = useState('');
  
  useEffect(() => {
    dispatch(getEvent(id));
    
    return () => {
      dispatch(clearEvent());
    };
  }, [dispatch, id]);
  
  useEffect(() => {
    if (isError) {
      navigate('/events');
    }
  }, [isError, navigate]);
  
  const handleEditEvent = () => {
    navigate(`/events/edit/${id}`);
  };
  
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    dispatch(deleteEvent(id));
    setDeleteDialogOpen(false);
    navigate('/events');
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };
  
  const addToCalendar = (eventData) => {
    try {
      // Create calendar event object for our utility function
      const calendarEvent = {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        start: eventData.startDate,
        end: eventData.endDate,
        eventId: eventData._id
      };
      
      // Use our calendar utility
      const success = addEventToCalendar(calendarEvent);
      
      if (success) {
        setCalendarSnackbarMessage('Event added to your calendar');
        setCalendarSnackbarOpen(true);
      }
      
      return success;
    } catch (error) {
      console.error('Calendar integration error:', error);
      return false;
    }
  };

  const handleAddToCalendar = () => {
    if (event) {
      addToCalendar(event);
    }
  };
  
  const handleRegister = async () => {
    try {
      console.log("Registering for event:", id);
      const resultAction = await dispatch(registerForEvent(id)).unwrap();
      
      // Refresh event data after registration
      console.log("Registration successful, refreshing event data");
      dispatch(getEvent(id));
      
      // Add to calendar
      if (resultAction) {
        if (addToCalendar(resultAction)) {
          toast.success('Registration successful. Event added to your calendar.');
        } else {
          toast.success('Registration successful.');
        }
      }
      
      // Also update localStorage to track this registration immediately
      const storedEvents = JSON.parse(localStorage.getItem('registeredEvents') || '[]');
      if (!storedEvents.some(e => e.eventId === id)) {
        storedEvents.push({
          eventId: id,
          title: event.title,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('registeredEvents', JSON.stringify(storedEvents));
        console.log("Updated localStorage with new registration");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error(`Registration failed: ${error.message || 'Please try again later'}`);
    }
  };

  const handleUnregisterClick = () => {
    setUnregisterDialogOpen(true);
  };

  const handleUnregisterConfirm = async () => {
    try {
      await dispatch(unregisterFromEvent(id)).unwrap();
      
      // Refresh event data after unregistration
      dispatch(getEvent(id));
      
      // Remove from localStorage
      const storedEvents = JSON.parse(localStorage.getItem('registeredEvents') || '[]');
      const updatedEvents = storedEvents.filter(e => e.eventId !== id);
      localStorage.setItem('registeredEvents', JSON.stringify(updatedEvents));
      
      setUnregisterDialogOpen(false);
      toast.success('Successfully unregistered from event');
    } catch (error) {
      console.error("Unregistration failed:", error);
      toast.error(`Unregistration failed: ${error.message || 'Please try again later'}`);
      setUnregisterDialogOpen(false);
    }
  };

  const handleUnregisterCancel = () => {
    setUnregisterDialogOpen(false);
  };

  const handleCalendarSnackbarClose = () => {
    setCalendarSnackbarOpen(false);
  };
  
  // Check if user can edit/delete the event
  const canModifyEvent = () => {
    return user && (user.role === 'admin' || (event?.organizer && event.organizer._id === user._id));
  };
  
  // Check if user is already registered
  const isUserRegistered = () => {
    if (!event || !user) return false;
    
    console.log("Checking registration status for user:", user._id);
    console.log("Event attendees:", event.attendees);
    
    // Handle both cases: when attendees is an array of IDs or an array of objects
    return event.attendees?.some(attendee => {
      // If attendee is an object with user property
      if (typeof attendee === 'object' && attendee.user) {
        const attendeeId = typeof attendee.user === 'object' ? attendee.user._id : attendee.user;
        return attendeeId.toString() === user._id.toString();
      }
      // If attendee is directly the user ID
      return attendee.toString() === user._id.toString();
    });
  };
  
  if (isLoading || !event) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/" color="inherit">
            Dashboard
          </Link>
          <Link component={RouterLink} to="/events" color="inherit">
            Events
          </Link>
          <Typography color="text.primary">{event.title}</Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/events')}
          >
            Back to Events
          </Button>
          <Box>
            {canModifyEvent() && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEditEvent}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteClick}
                >
                  Delete
                </Button>
              </>
            )}
          </Box>
        </Box>
        
        <Card>
          {event.image ? (
            <CardMedia
              component="img"
              height="300"
              image={event.image}
              alt={event.title}
            />
          ) : (
            <Box
              sx={{
                height: 300,
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <EventIcon sx={{ fontSize: 100, color: 'white' }} />
            </Box>
          )}
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom>
              {event.title}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              <Chip
                label={event.type.replace('_', ' ')}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={event.status || 'draft'}
                color={
                  event.status === 'published' ? 'success' :
                  event.status === 'cancelled' ? 'error' :
                  event.status === 'completed' ? 'info' : 'default'
                }
                variant="outlined"
              />
              <Chip
                label={`Visibility: ${event.visibility}`}
                variant="outlined"
              />
              {event.registrationRequired && (
                <Chip
                  label="Registration Required"
                  color="secondary"
                  variant="outlined"
                />
              )}
              {event.tags?.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  variant="outlined"
                />
              ))}
            </Box>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {event.description}
                </Typography>
                
                {event.speakers && event.speakers.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Speakers
                    </Typography>
                    <List>
                      {event.speakers.map((speaker, index) => (
                        <ListItem key={index} alignItems="flex-start">
                          <ListItemAvatar>
                            <Avatar>{speaker.name.charAt(0)}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1">
                                {speaker.name} {speaker.title && `- ${speaker.title}`}
                              </Typography>
                            }
                            secondary={
                              <>
                                {speaker.organization && (
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.primary"
                                  >
                                    {speaker.organization}
                                  </Typography>
                                )}
                                {speaker.bio && (
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    display="block"
                                  >
                                    {speaker.bio}
                                  </Typography>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Event Details
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Start:
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')}
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(event.startDate), 'h:mm a')}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          End:
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(event.endDate), 'EEEE, MMMM d, yyyy')}
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(event.endDate), 'h:mm a')}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Location:
                        </Typography>
                        <Typography variant="body1">
                          {event.location}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {event.organizer && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Organizer:
                          </Typography>
                          <Typography variant="body1">
                            {`${event.organizer.firstName} ${event.organizer.lastName}`}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <GroupIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Capacity:
                        </Typography>
                        <Typography variant="body1">
                          {event.attendees?.length || 0} / {event.capacity}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {event.registrationRequired && event.registrationDeadline && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Registration Deadline:
                          </Typography>
                          <Typography variant="body1">
                            {format(new Date(event.registrationDeadline), 'MMMM d, yyyy')}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    
                    {event.registrationRequired && (
                      <Box sx={{ mt: 2 }}>
                        {isUserRegistered() ? (
                          <>
                            <Button
                              fullWidth
                              variant="outlined"
                              color="secondary"
                              onClick={handleUnregisterClick}
                              sx={{ mb: 1 }}
                            >
                              Unregister
                            </Button>
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={<CalendarTodayIcon />}
                              onClick={handleAddToCalendar}
                            >
                              Add to Calendar
                            </Button>
                          </>
                        ) : (
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={handleRegister}
                            disabled={event.attendees?.length >= event.capacity}
                        >
                            Register Now
                        </Button>
                        )}
                        
                        {event.attendees?.length >= event.capacity && (
                          <Typography variant="body2" color="error" align="center" sx={{ mt: 1 }}>
                            This event is at full capacity
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the event "{event.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unregister Confirmation Dialog */}
      <Dialog
        open={unregisterDialogOpen}
        onClose={handleUnregisterCancel}
      >
        <DialogTitle>Unregister from Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to unregister from "{event.title}"? You will lose your spot and may not be able to register again if the event reaches capacity.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUnregisterCancel}>Cancel</Button>
          <Button onClick={handleUnregisterConfirm} color="error" autoFocus>
            Unregister
          </Button>
        </DialogActions>
      </Dialog>

      {/* Calendar Snackbar */}
      <Snackbar
        open={calendarSnackbarOpen}
        autoHideDuration={6000}
        onClose={handleCalendarSnackbarClose}
      >
        <Alert onClose={handleCalendarSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {calendarSnackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EventDetails; 