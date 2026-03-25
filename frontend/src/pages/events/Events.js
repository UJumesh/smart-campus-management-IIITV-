import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Badge,
} from "@mui/material";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Event as EventIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterListIcon,
  PeopleAlt as PeopleAltIcon,
  AssessmentOutlined as AssessmentIcon,
  NotificationsActive as NotificationsIcon,
} from "@mui/icons-material";
import useAuth from "../../hooks/useAuth";
import { getPermissions } from "../../utils/permissions";
import { getEvents, reset, createEvent, registerForEvent, getUserRegistrations, unregisterFromEvent } from "../../services/slices/eventSlice";
import { toast } from "react-toastify";
import { addEventToCalendar, downloadICSFile, formatDateForICS } from '../../utils/calendarUtils';

const Events = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useAuth({
    redirectIfNotAuth: true,
    redirectTo: "/login",
  });

  const permissions = getPermissions(user?.role || "student");
  
  const eventState = useSelector((state) => state.event) || {};
  const { events = [], isLoading = false, isError = false, message = '', registeredEventIds: storeRegisteredEventIds = [] } = eventState;

  // Add local state to track registered events immediately
  const [registeredEventIds, setRegisteredEventIds] = useState([]);
  
  // Also fetch user registrations from API on component mount
  useEffect(() => {
    if (user && user.id) {
      dispatch(getUserRegistrations());
    }
  }, [dispatch, user]);
  
  // Update local state when Redux store updates
  useEffect(() => {
    if (storeRegisteredEventIds && storeRegisteredEventIds.length > 0) {
      setRegisteredEventIds(prev => 
        [...new Set([...prev, ...storeRegisteredEventIds])]
      );
    }
  }, [storeRegisteredEventIds]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newEventData, setNewEventData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    type: "workshop",
    capacity: 50,
  });

  useEffect(() => {
    dispatch(getEvents());

    // Initialize registered events from localStorage
    try {
      const storedEvents = JSON.parse(localStorage.getItem('registeredEvents') || '[]');
      const eventIds = storedEvents.map(event => event.eventId);
      setRegisteredEventIds(eventIds);
    } catch (error) {
      console.error("Error loading registered events from localStorage:", error);
    }

    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  // Mock data fallback in case the API isn't ready
  const mockEvents = [
    {
      id: 1,
      title: "Tech Conference 2024",
      description: "Annual technology conference featuring industry experts.",
      date: "2024-04-15",
      time: "09:00 AM",
      location: "Main Auditorium",
      organizer: "IT Department",
      type: "conference",
      status: "upcoming",
      capacity: 200,
      registered: 150,
    },
    {
      id: 2,
      title: "Career Fair",
      description: "Meet potential employers and explore career opportunities.",
      date: "2024-04-20",
      time: "10:00 AM",
      location: "Student Center",
      organizer: "Career Services",
      type: "fair",
      status: "upcoming",
      capacity: 500,
      registered: 300,
    },
  ];

  // Use actual events from Redux or fall back to mock data if needed
  const displayEvents = events && events.length > 0 ? events : mockEvents;

  const filteredEvents = displayEvents.filter((event) => {
    const matchesSearch =
      event.title?.toLowerCase().includes(search.toLowerCase()) ||
      event.description?.toLowerCase().includes(search.toLowerCase()) ||
      event.location?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filter === "all" || event.status === filter;
    const matchesType = typeFilter === "all" || event.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreateEvent = () => {
    // Check permissions
    if (!permissions.canCreateEvents && user?.role !== "admin") {
      toast.error("You don't have permission to create events");
      return;
    }
    
    // Validate form
    if (!newEventData.title || !newEventData.date || !newEventData.time) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Format the data for the API
    const eventData = {
      ...newEventData,
      // Convert date and time to ISO format for the API
      startDate: new Date(`${newEventData.date}T${newEventData.time}`).toISOString(),
      // Set default values
      status: "upcoming",
      createdBy: user?.id,
      creatorRole: user?.role,
    };

    // Dispatch the createEvent action
    dispatch(createEvent(eventData))
      .unwrap()
      .then(() => {
        toast.success("Event created successfully");
        setOpenCreateDialog(false);
        
        // Reset form
        setNewEventData({
          title: "",
          description: "",
          date: "",
          time: "",
          location: "",
          type: "workshop",
          capacity: 50,
        });
      })
      .catch((error) => {
        toast.error(error || "Failed to create event");
      });
  };

  const formatDate = (date, time) => {
    if (!date) return "Date not specified";
    return new Date(`${date} ${time || "00:00"}`).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  // Role-based action buttons for event cards
  const renderActionButtons = (event) => {
    // Check if the user is registered for this event
    const isUserRegistered = () => {
      const eventId = event.id || event._id;
      
      // First check our local registeredEventIds state (fastest)
      if (registeredEventIds.includes(eventId)) {
        return true;
      }
      
      // Then check localStorage as backup
      try {
        const storedEvents = JSON.parse(localStorage.getItem('registeredEvents') || '[]');
        if (storedEvents.some(e => e.eventId === eventId)) {
          return true;
        }
      } catch (error) {
        console.error("Error checking localStorage:", error);
      }
      
      // Finally check the attendees array
      if (event.attendees && Array.isArray(event.attendees)) {
        // Convert user ID to string for comparison
        const userId = (user?._id || user?.id || '').toString();
        
        return event.attendees.some(attendeeId => {
          // Convert attendee ID to string for comparison
          const attendeeIdStr = (attendeeId?._id || attendeeId?.user || attendeeId || '').toString();
          return userId === attendeeIdStr;
        });
      }
      
      return false;
    };

    // Handle adding event to calendar
    const handleAddToCalendar = (e) => {
      e.stopPropagation(); // Prevent click from propagating to parent card
      
      try {
        // Create calendar event object
        const calendarEvent = {
          title: event.title,
          description: event.description || '',
          location: event.location || '',
          start: event.startDate || event.date,
          end: event.endDate || event.date,
          eventId: event.id || event._id
        };
        
        // Use our calendar utility
        addEventToCalendar(calendarEvent);
      } catch (error) {
        console.error('Calendar integration error:', error);
        toast.error('Failed to add event to calendar');
      }
    };
    
    // Handle unregistration
    const handleUnregister = (e) => {
      e.stopPropagation(); // Prevent click from propagating to parent card
      
      const eventId = event.id || event._id;
      
      // Immediately update local state for UI feedback
      setRegisteredEventIds(prev => prev.filter(id => id !== eventId));
      
      // Update localStorage immediately
      try {
        const storedEvents = JSON.parse(localStorage.getItem('registeredEvents') || '[]');
        localStorage.setItem('registeredEvents', 
          JSON.stringify(storedEvents.filter(e => e.eventId !== eventId))
        );
      } catch (error) {
        console.error("Error updating localStorage:", error);
      }
      
      dispatch(unregisterFromEvent(eventId))
        .unwrap()
        .then(() => {
          toast.success("Successfully unregistered from event");
          // Refresh events list to update UI
          dispatch(getEvents());
        })
        .catch((error) => {
          // If unregistration fails, revert our local state
          setRegisteredEventIds(prev => [...prev, eventId]);
          
          // Also revert localStorage
          try {
            const storedEvents = JSON.parse(localStorage.getItem('registeredEvents') || '[]');
            if (!storedEvents.some(e => e.eventId === eventId)) {
              storedEvents.push({
                eventId,
                title: event.title,
                timestamp: new Date().toISOString()
              });
              localStorage.setItem('registeredEvents', JSON.stringify(storedEvents));
            }
          } catch (err) {
            console.error("Error reverting localStorage:", err);
          }
          
          toast.error(error || "Failed to unregister from event");
        });
    };

    return (
      <>
        <Button
          size="small"
          onClick={() => navigate(`/events/${event.id || event._id}`)}
        >
          View Details
        </Button>
        
        {/* Student actions */}
        {user?.role === "student" && permissions.canRegisterForEvents && event.status === "upcoming" && (
          isUserRegistered() ? (
            <>
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                onClick={handleUnregister}
              >
                Unregister
              </Button>
              <IconButton 
                size="small" 
                color="primary" 
                onClick={handleAddToCalendar}
                title="Add to Calendar"
              >
                <CalendarIcon fontSize="small" />
              </IconButton>
            </>
          ) : (
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => {
                const eventId = event.id || event._id;
                
                // Immediately update local state for UI feedback
                setRegisteredEventIds(prev => [...prev, eventId]);
                
                // Update localStorage immediately
                try {
                  const storedEvents = JSON.parse(localStorage.getItem('registeredEvents') || '[]');
                  if (!storedEvents.some(e => e.eventId === eventId)) {
                    storedEvents.push({
                      eventId,
                      title: event.title,
                      timestamp: new Date().toISOString()
                    });
                    localStorage.setItem('registeredEvents', JSON.stringify(storedEvents));
                  }
                } catch (error) {
                  console.error("Error updating localStorage:", error);
                }
                
                dispatch(registerForEvent(eventId))
                  .unwrap()
                  .then((updatedEvent) => {
                    toast.success("Successfully registered for event");
                    
                    // Add to calendar
                    handleAddToCalendar({
                      stopPropagation: () => {} // Dummy function
                    });
                    
                    // Refresh events list to update UI
                    dispatch(getEvents());
                  })
                  .catch((error) => {
                    // If registration fails, revert our local state
                    setRegisteredEventIds(prev => prev.filter(id => id !== eventId));
                    
                    // Also revert localStorage
                    try {
                      const storedEvents = JSON.parse(localStorage.getItem('registeredEvents') || '[]');
                      localStorage.setItem('registeredEvents', 
                        JSON.stringify(storedEvents.filter(e => e.eventId !== eventId))
                      );
                    } catch (err) {
                      console.error("Error reverting localStorage:", err);
                    }
                    
                    toast.error(error || "Failed to register for event");
                  });
              }}
              disabled={isUserRegistered()}
            >
              Register
            </Button>
          )
        )}
        
        {/* Lecturer actions */}
        {user?.role === "lecturer" && permissions.canCreateEvents && (
          <Tooltip title="Manage Attendees">
            <IconButton 
              size="small"
              onClick={() => navigate(`/events/${event.id || event._id}/attendees`)}
            >
              <PeopleAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        
        {/* Admin actions */}
        {user?.role === "admin" && (
          <>
            <Tooltip title="View Analytics">
              <IconButton 
                size="small"
                onClick={() => navigate(`/events/${event.id || event._id}/analytics`)}
              >
                <AssessmentIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Send Notifications">
              <IconButton 
                size="small"
                onClick={() => navigate(`/events/${event.id || event._id}/notifications`)}
              >
                <NotificationsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Events</Typography>
        <Box>
          {/* Role-based actions in the header */}
          {(permissions.canCreateEvents || user?.role === "admin") && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
            >
              Create Event
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filter}
                label="Status"
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="workshop">Workshop</MenuItem>
                <MenuItem value="seminar">Seminar</MenuItem>
                <MenuItem value="conference">Conference</MenuItem>
                <MenuItem value="lecture">Guest Lecture</MenuItem>
                <MenuItem value="social">Social Event</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {message || "An error occurred while fetching events. Using mock data instead."}
        </Alert>
      )}

      {filteredEvents.length === 0 ? (
        <Alert severity="info">No events found matching your criteria.</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredEvents.map((event) => (
            <Grid item xs={12} md={6} lg={4} key={event.id || event._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <EventIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">{event.title}</Typography>
                  </Box>
                  <Typography color="textSecondary" gutterBottom>
                    {formatDate(event.date, event.time)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {event.description}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <CalendarIcon
                        fontSize="small"
                        sx={{ mr: 1, verticalAlign: "middle" }}
                      />
                      {event.location}
                    </Typography>
                    <Typography variant="body2">
                      Organizer: {event.organizer}
                    </Typography>
                    <Typography variant="body2">
                      Registered: {event.registered || 0}/{event.capacity || 'Unlimited'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Chip 
                      label={event.type} 
                      color="primary" 
                      size="small" 
                    />
                    <Chip
                      label={event.status}
                      color={
                        event.status === "upcoming"
                          ? "success"
                          : event.status === "cancelled"
                          ? "error"
                          : "default"
                      }
                      size="small"
                    />
                    {/* Show department badge for admin */}
                    {user?.role === "admin" && event.department && (
                      <Chip
                        label={event.department}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  {renderActionButtons(event)}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Event Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={() => setOpenCreateDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={newEventData.title}
                onChange={(e) => setNewEventData({ ...newEventData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={newEventData.description}
                onChange={(e) => setNewEventData({ ...newEventData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={newEventData.date}
                onChange={(e) => setNewEventData({ ...newEventData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Time"
                type="time"
                value={newEventData.time}
                onChange={(e) => setNewEventData({ ...newEventData, time: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={newEventData.location}
                onChange={(e) => setNewEventData({ ...newEventData, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newEventData.type}
                  label="Type"
                  onChange={(e) => setNewEventData({ ...newEventData, type: e.target.value })}
                >
                  <MenuItem value="workshop">Workshop</MenuItem>
                  <MenuItem value="seminar">Seminar</MenuItem>
                  <MenuItem value="conference">Conference</MenuItem>
                  <MenuItem value="lecture">Guest Lecture</MenuItem>
                  <MenuItem value="social">Social Event</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={newEventData.capacity}
                onChange={(e) => setNewEventData({ ...newEventData, capacity: e.target.value })}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            {/* Additional fields for admin */}
            {user?.role === "admin" && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={newEventData.department || ""}
                    label="Department"
                    onChange={(e) => setNewEventData({ ...newEventData, department: e.target.value })}
                  >
                    <MenuItem value="">Select Department</MenuItem>
                    <MenuItem value="School of Engineering">School of Engineering</MenuItem>
                    <MenuItem value="School of Business">School of Business</MenuItem>
                    <MenuItem value="School of Science">School of Science</MenuItem>
                    <MenuItem value="School of Humanities">School of Humanities</MenuItem>
                    <MenuItem value="Administration">Administration</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateEvent}
            variant="contained"
            disabled={!newEventData.title || !newEventData.date || !newEventData.time}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Events;
