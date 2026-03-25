import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  Group as GroupIcon,
  AssignmentInd as AssignmentIndIcon,
  Assessment as AssessmentIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import useAuth from "../../hooks/useAuth";
import { getPermissions } from "../../utils/permissions";
import { 
  getEventById, 
  updateEvent, 
  deleteEvent, 
  registerForEvent,
  assignEventCoordinator,
  getEventAnalytics,
  reset,
  getUserRegistrations,
} from "../../services/slices/eventSlice";
import { toast } from "react-toastify";
import { addEventToCalendar } from '../../utils/calendarUtils';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useAuth({
    redirectIfNotAuth: true,
    redirectTo: "/login",
  });

  const permissions = getPermissions(user?.role || "student");
  const { event, analytics, isLoading, isError, message, isSuccess, registeredEventIds = [] } = useSelector(
    (state) => state.event
  );

  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [openNotify, setOpenNotify] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    capacity: "",
    type: "",
    department: "",
  });
  const [notificationData, setNotificationData] = useState({
    subject: "",
    message: "",
    sendEmail: true,
    sendPush: true,
  });
  const [coordinatorData, setCoordinatorData] = useState({
    coordinatorId: "",
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);

  // Mock data for lecturers (would come from API)
  const lecturers = [
    { id: "1", name: "Dr. John Smith", department: "School of Engineering" },
    { id: "2", name: "Prof. Jane Doe", department: "School of Science" },
    { id: "3", name: "Dr. Robert Johnson", department: "School of Business" },
  ];

  useEffect(() => {
    dispatch(getEventById(id));
    
    if (user?.role === "admin") {
      dispatch(getEventAnalytics(id));
    }
    
    // Check if already registered (from localStorage)
    try {
      const storedEvents = JSON.parse(localStorage.getItem('registeredEvents') || '[]');
      if (storedEvents.some(e => e.eventId === id)) {
        setRegistered(true);
      }
    } catch (error) {
      console.error("Error checking localStorage for registration status:", error);
    }

    return () => {
      dispatch(reset());
    };
  }, [dispatch, id, user?.role]);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || "",
        description: event.description || "",
        date: event.date || "",
        time: event.time || "",
        location: event.location || "",
        capacity: event.capacity || "",
        type: event.type || "",
        department: event.department || "",
      });
    }
  }, [event]);

  // Also fetch user registrations when component mounts
  useEffect(() => {
    if (user && user.id) {
      dispatch(getUserRegistrations());
    }
  }, [dispatch, user]);
  
  // Update registration state from Redux
  useEffect(() => {
    if (registeredEventIds && registeredEventIds.includes(id)) {
      setRegistered(true);
    }
  }, [registeredEventIds, id]);

  const handleEdit = async () => {
    try {
      await dispatch(updateEvent({ 
        id, 
        eventData: formData 
      })).unwrap();
      
      setOpenEdit(false);
      toast.success("Event updated successfully");
    } catch (err) {
      toast.error(err || "Failed to update event");
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteEvent(id)).unwrap();
      toast.success("Event deleted successfully");
      navigate("/events");
    } catch (err) {
      toast.error(err || "Failed to delete event");
    }
  };

  // Check if user is already registered
  const isUserRegistered = () => {
    if (!event || !user) return false;
    
    // First check component's local state
    if (registered) return true;
    
    // Then check localStorage as backup
    try {
      const storedEvents = JSON.parse(localStorage.getItem('registeredEvents') || '[]');
      if (storedEvents.some(e => e.eventId === id)) {
        return true;
      }
    } catch (error) {
      console.error("Error checking localStorage:", error);
    }
    
    // Then check if user is in the attendees array
    if (event.attendees && Array.isArray(event.attendees)) {
      // Convert user ID to string for comparison
      const userId = (user._id || user.id || '').toString();
      
      return event.attendees.some(attendeeId => {
        // Convert attendee ID to string for comparison
        const attendeeIdStr = (attendeeId?._id || attendeeId?.user || attendeeId || '').toString();
        return userId === attendeeIdStr;
      });
    }
    
    return false;
  };

  const handleRegister = async () => {
    if (isUserRegistered()) return; // Prevent registering if already registered
    
    setIsRegistering(true);
    
    // Immediately update local state for UI feedback
    setRegistered(true);
    
    // Update localStorage immediately
    try {
      const storedEvents = JSON.parse(localStorage.getItem('registeredEvents') || '[]');
      if (!storedEvents.some(e => e.eventId === id)) {
        storedEvents.push({
          eventId: id,
          title: event.title,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('registeredEvents', JSON.stringify(storedEvents));
      }
    } catch (error) {
      console.error("Error updating localStorage:", error);
    }
    
    try {
      const registeredEvent = await dispatch(registerForEvent(id)).unwrap();
      
      // Add event to calendar if registration is successful
      if (registeredEvent) {
        addEventToCalendar(registeredEvent);
        setCalendarAdded(true);
      }
      
      toast.success('Successfully registered for this event!');
      
      // Reload event data to update UI with latest attendees list
      dispatch(getEventById(id));
    } catch (error) {
      // If registration fails, revert our local state
      setRegistered(false);
      
      // Also revert localStorage
      try {
        const storedEvents = JSON.parse(localStorage.getItem('registeredEvents') || '[]');
        localStorage.setItem('registeredEvents', 
          JSON.stringify(storedEvents.filter(e => e.eventId !== id))
        );
      } catch (err) {
        console.error("Error reverting localStorage:", err);
      }
      
      toast.error(`Failed to register: ${error}`);
    }
    setIsRegistering(false);
  };

  const handleAssignCoordinator = async () => {
    try {
      if (!coordinatorData.coordinatorId) {
        toast.error("Please select a coordinator");
        return;
      }
      
      await dispatch(assignEventCoordinator({
        eventId: id,
        coordinatorId: coordinatorData.coordinatorId
      })).unwrap();
      
      setOpenAssign(false);
      toast.success("Coordinator assigned successfully");
    } catch (err) {
      toast.error(err || "Failed to assign coordinator");
    }
  };

  const handleSendNotification = async () => {
    try {
      if (!notificationData.subject || !notificationData.message) {
        toast.error("Subject and message are required");
        return;
      }
      
      // TODO: Implement notification sending API
      console.log("Sending notification:", notificationData);
      
      setOpenNotify(false);
      toast.success("Notifications sent successfully");
    } catch (err) {
      toast.error("Failed to send notifications");
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Role-based action buttons
  const renderActionButtons = () => {
    if (!event) return null;
    
    return (
      <Box sx={{ display: "flex", gap: 1 }}>
        {/* Student actions */}
        {user?.role === "student" && permissions.canRegisterForEvents && 
          event.status === "upcoming" && (
          <Button
            variant={isUserRegistered() ? "outlined" : "contained"}
            color={isUserRegistered() ? "secondary" : "primary"}
            onClick={handleRegister}
            startIcon={isUserRegistered() ? <CheckCircleIcon /> : <CalendarIcon />}
            disabled={isRegistering || isUserRegistered()}
          >
            {isRegistering ? 'Registering...' : (isUserRegistered() ? 'Already Registered' : 'Register')}
          </Button>
        )}
        
        {/* Lecturer actions */}
        {user?.role === "lecturer" && permissions.canEditEvents && (
          <>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setOpenEdit(true)}
              startIcon={<EditIcon />}
            >
              Edit Event
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setOpenNotify(true)}
              startIcon={<NotificationsIcon />}
            >
              Notify Attendees
            </Button>
          </>
        )}
        
        {/* Admin actions */}
        {user?.role === "admin" && (
          <>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setOpenEdit(true)}
              startIcon={<EditIcon />}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setOpenAssign(true)}
              startIcon={<AssignmentIndIcon />}
            >
              Assign Coordinator
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setOpenNotify(true)}
              startIcon={<NotificationsIcon />}
            >
              Notify
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setOpenDelete(true)}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </>
        )}
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{message}</Alert>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Event not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4">{event.title}</Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
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
            {event.department && (
              <Chip
                label={event.department}
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        </Box>
        {renderActionButtons()}
      </Box>

      {/* Admin Analytics Tabs */}
      {user?.role === "admin" && (
        <Box sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Event Details" />
            <Tab label="Analytics" />
            <Tab label="Attendees" />
          </Tabs>
        </Box>
      )}

      {/* Tab Content */}
      <Box sx={{ display: tabValue === 0 || user?.role !== "admin" ? "block" : "none" }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Event Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Description</Typography>
                  <Typography>{event.description}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Date & Time</Typography>
                  <Typography>
                    {event.date && event.time ? 
                      new Date(`${event.date} ${event.time}`).toLocaleString() : 
                      "Date and time not specified"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Location</Typography>
                  <Typography>{event.location || "Location not specified"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Organizer</Typography>
                  <Typography>{event.organizer || "Not specified"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Capacity</Typography>
                  <Typography>{event.capacity || "Unlimited"}</Typography>
                </Grid>
                {event.coordinator && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Coordinator</Typography>
                    <Typography>{event.coordinator.name}</Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {event.schedule && event.schedule.length > 0 && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Event Schedule
                </Typography>
                <List>
                  {event.schedule.map((item) => (
                    <ListItem key={item.id || item._id}>
                      <ListItemAvatar>
                        <Avatar>
                          <EventIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={item.activity} secondary={item.time} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Registration Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Registered: {event.registered || 0}/{event.capacity || "Unlimited"}
                </Typography>
                <Typography variant="body2">
                  Available Slots: {event.capacity ? (event.capacity - (event.registered || 0)) : "Unlimited"}
                </Typography>
              </Box>
              {user?.role === "student" && permissions.canRegisterForEvents && event.status === "upcoming" && (
                <Button
                  variant={isUserRegistered() ? "outlined" : "contained"}
                  color={isUserRegistered() ? "secondary" : "primary"}
                  onClick={handleRegister}
                  startIcon={isUserRegistered() ? <CheckCircleIcon /> : <CalendarIcon />}
                  disabled={isRegistering || isUserRegistered()}
                >
                  {isRegistering ? 'Registering...' : (isUserRegistered() ? 'Already Registered' : 'Register')}
                </Button>
              )}
            </Paper>

            {event.attendees && event.attendees.length > 0 && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Attendees
                </Typography>
                <List>
                  {event.attendees.slice(0, 5).map((attendee) => (
                    <ListItem key={attendee.id || attendee._id}>
                      <ListItemAvatar>
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={attendee.name}
                        secondary={attendee.role}
                      />
                    </ListItem>
                  ))}
                  {event.attendees.length > 5 && (
                    <ListItem>
                      <ListItemText
                        primary={`+${event.attendees.length - 5} more attendees`}
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Analytics Tab Content */}
      {user?.role === "admin" && (
        <Box sx={{ display: tabValue === 1 ? "block" : "none" }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Registration Rate
                  </Typography>
                  <Typography variant="h4">
                    {analytics?.registrationRate || "0%"}
                  </Typography>
                  <Typography variant="body2">
                    {event.registered || 0} out of {event.capacity || "Unlimited"} spots
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Attendance Rate
                  </Typography>
                  <Typography variant="h4">
                    {analytics?.attendanceRate || "0%"}
                  </Typography>
                  <Typography variant="body2">
                    Based on check-ins
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Department Breakdown
                  </Typography>
                  <Typography variant="body2">
                    {analytics?.departmentBreakdown ? 
                      Object.entries(analytics.departmentBreakdown)
                        .map(([dept, count]) => `${dept}: ${count}`)
                        .join(", ") : 
                      "No data available"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Feedback Score
                  </Typography>
                  <Typography variant="h4">
                    {analytics?.feedbackScore || "N/A"}
                  </Typography>
                  <Typography variant="body2">
                    Based on {analytics?.feedbackCount || 0} responses
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Attendees Tab Content */}
      {user?.role === "admin" && (
        <Box sx={{ display: tabValue === 2 ? "block" : "none" }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              All Attendees
            </Typography>
            {event.attendees && event.attendees.length > 0 ? (
              <List>
                {event.attendees.map((attendee) => (
                  <ListItem key={attendee.id || attendee._id}>
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={attendee.name}
                      secondary={`${attendee.role} • ${attendee.email || "No email"}`}
                    />
                    <Chip 
                      label={attendee.status || "Registered"} 
                      color={
                        attendee.status === "attended" ? "success" : 
                        attendee.status === "cancelled" ? "error" : 
                        "default"
                      }
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>No attendees registered yet</Typography>
            )}
          </Paper>
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Event</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Type"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
            {user?.role === "admin" && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={formData.department}
                    label="Department"
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this event? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Coordinator Dialog */}
      <Dialog open={openAssign} onClose={() => setOpenAssign(false)} fullWidth>
        <DialogTitle>Assign Event Coordinator</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Coordinator</InputLabel>
            <Select
              value={coordinatorData.coordinatorId}
              label="Select Coordinator"
              onChange={(e) => setCoordinatorData({ ...coordinatorData, coordinatorId: e.target.value })}
            >
              {lecturers.map((lecturer) => (
                <MenuItem key={lecturer.id} value={lecturer.id}>
                  {lecturer.name} - {lecturer.department}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssign(false)}>Cancel</Button>
          <Button 
            onClick={handleAssignCoordinator} 
            variant="contained" 
            color="primary"
            disabled={!coordinatorData.coordinatorId}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={openNotify} onClose={() => setOpenNotify(false)} fullWidth>
        <DialogTitle>Send Notification to Attendees</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                value={notificationData.subject}
                onChange={(e) => setNotificationData({ ...notificationData, subject: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                value={notificationData.message}
                onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <Typography variant="subtitle2" gutterBottom>
                  Notification Methods
                </Typography>
                <Grid container>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={notificationData.sendEmail}
                          onChange={(e) => setNotificationData({ ...notificationData, sendEmail: e.target.checked })}
                        />
                      }
                      label="Email"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={notificationData.sendPush}
                          onChange={(e) => setNotificationData({ ...notificationData, sendPush: e.target.checked })}
                        />
                      }
                      label="Push Notification"
                    />
                  </Grid>
                </Grid>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNotify(false)}>Cancel</Button>
          <Button 
            onClick={handleSendNotification} 
            variant="contained" 
            color="primary"
            disabled={!notificationData.subject || !notificationData.message}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventDetails;
