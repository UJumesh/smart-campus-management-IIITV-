import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Tooltip,
  FormControlLabel,
  Switch,
  InputAdornment,
  Divider,
  AlertTitle,
  Stack,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ViewModule as GridViewIcon,
  ViewList as ListViewIcon,
  CalendarMonth as CalendarViewIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
  Category as CategoryIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  HowToReg as HowToRegIcon,
  Visibility as VisibilityIcon,
  Group as GroupIcon,
  Search as SearchIcon,
  Cancel as CancelIcon,
  CalendarToday as CalendarIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { addToCalendar, isInLocalCalendar } from "../utils/calendarUtils";
import {
  registerForEvent,
  getEvent,
  getUserRegistrations,
} from "../services/slices/eventSlice";
import Pagination from "@mui/material/Pagination";

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const EVENT_CATEGORIES = [
  "Academic",
  "Workshop",
  "Seminar",
  "Club",
  "Sports",
  "Social",
];
const TARGET_AUDIENCES = ["Students", "Lecturers", "All"];

const EventPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Directly from auth state
  const { user } = useSelector((state) => state.auth);

  // Verify authentication
  useEffect(() => {
    // Check if user is authenticated
    if (!user || !user.token) {
      console.log("User not authenticated or missing token");
    } else {
      console.log("User authenticated:", user.name || user.email);
      console.log("Token available:", !!user.token);
    }
  }, [user]);

  const isAdmin = user?.role === "admin";
  const isLecturer = user?.role === "lecturer";
  const isStudent = user?.role === "student";
  const canManageEvents = isAdmin || isLecturer;

  // Additional logging for debugging
  console.log("Current user:", user);
  console.log("Is Admin:", isAdmin);
  console.log("Is Lecturer:", isLecturer);
  console.log("Is Student:", isStudent);
  console.log("Can Manage Events:", canManageEvents);

  // Get auth token
  const getAuthToken = () => {
    const token =
      localStorage.getItem("token") ||
      (user && user.token) ||
      localStorage.getItem("authToken");
    console.log(
      "Auth token being used:",
      token ? "Token exists" : "No token found"
    );
    return token;
  };

  // Create axios instance with auth headers
  const createAuthenticatedRequest = () => {
    const token = getAuthToken();
    return axios.create({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  // Use empty array as initial state
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Department data state
  const [departmentData, setDepartmentData] = useState({});
  const [departmentLoading, setDepartmentLoading] = useState(false);

  const [viewMode, setViewMode] = useState("grid");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    department: "",
    startDate: null,
    endDate: null,
    audience: "", // Add audience filter
    availableOnly: false, // Add filter for events user can register for
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: null,
    endDate: null,
    venue: "",
    department: "",
    subDepartment: "",
    category: "",
    targetAudience: "",
    capacity: "",
    isFeatured: false,
  });

  // Track registered events
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [registrationDialog, setRegistrationDialog] = useState({
    open: false,
    event: null,
  });

  // Add state for details dialog
  const [detailsDialog, setDetailsDialog] = useState({
    open: false,
    event: null,
  });

  // Add a state to track view mode for registered events
  const [showRegisteredOnly, setShowRegisteredOnly] = useState(false);

  // Remove localStorage initialization and use empty array
  const [registeredEventIds, setRegisteredEventIds] = useState([]);

  // Add isLoadingRegistrations to the state declarations near the top of the component
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);

  // Add a state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter events based on registration status
  const getFilteredEvents = () => {
    // Start with basic filtering logic
    let filteredEvents = events;

    // First apply the registered filter if enabled
    if (showRegisteredOnly) {
      console.log("Filtering events to show registered only...");
      console.log("Registered events array:", registeredEvents);
      console.log("Registered event IDs:", registeredEventIds);

      // Use both methods to ensure we catch all registered events
      filteredEvents = events.filter((event) => {
        const isRegistered = isRegisteredForEvent(event._id);
        if (isRegistered) {
          console.log("Including registered event:", event.title);
        }
        return isRegistered;
      });
    }

    // Then apply audience filter if set
    if (filters.audience) {
      filteredEvents = filteredEvents.filter(
        (event) => event.targetAudience === filters.audience
      );
    }

    // Apply available only filter if enabled
    if (filters.availableOnly && (isStudent || isLecturer)) {
      filteredEvents = filteredEvents.filter((event) =>
        canRegisterForEvent(event)
      );
    }

    return filteredEvents;
  };

  // Fetch department data
  const fetchDepartments = async () => {
    try {
      setDepartmentLoading(true);
      const response = await axios.get("/api/departments");
      console.log("Departments response:", response.data);
      if (response.data.success) {
        setDepartmentData(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
      toast.error("Failed to fetch departments");
    } finally {
      setDepartmentLoading(false);
    }
  };

  // Ensure all events are retrieved from MongoDB
  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching events with params:", { searchQuery, ...filters });

      // Get events from MongoDB API only
      const params = {
        search: searchQuery,
        ...filters,
      };
      const authRequest = createAuthenticatedRequest();
      const response = await authRequest.get("/api/events", { params });
      console.log("Events API response:", response.data);

      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        setEvents(response.data.data);
      } else {
        setEvents([]);
      }

      setError(null);
      return response; // Return the response for proper promise chaining
    } catch (err) {
      console.error("Error fetching events from API:", err);
      setError(
        "Failed to fetch events: " +
          (err.response?.data?.message || err.message)
      );
      toast.error("Error loading events from database");
      setEvents([]);
      throw err; // Rethrow to allow proper handling in the caller
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchDepartments(); // Fetch departments when component mounts
  }, [searchQuery, filters]);

  // Handle department change
  const handleDepartmentChange = (e) => {
    const mainDept = e.target.value;
    setFormData({
      ...formData,
      department: mainDept,
      subDepartment: "", // Reset sub-department when main department changes
    });
  };

  // Update handleSubmit to use authenticated requests
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true); // Set submitting state to true while submitting the form

      // Create a copy of the form data with proper date handling
      const eventData = {
        ...formData,
        // Ensure dates are properly formatted
        startDate:
          formData.startDate instanceof Date ? formData.startDate : new Date(),
        endDate:
          formData.endDate instanceof Date ? formData.endDate : new Date(),
        createdBy: user?.id, // Add createdBy if it's required
        // If organizer is required and not already included, add it
        organizer: user?.id,
        // Convert capacity to a number
        capacity: parseInt(formData.capacity) || 0,
        // Ensure subDepartment is a string
        subDepartment: formData.subDepartment || "",
        // Ensure department is a string
        department: formData.department || "",
        // Ensure category is a valid value
        category: formData.category || "Academic",
        // Ensure targetAudience is a valid value
        targetAudience: formData.targetAudience || "All",
        // Map venue to location for the backend
        location: formData.venue,
      };

      // DETAILED DEBUGGING
      console.log("DETAILED EVENT DATA:", JSON.stringify(eventData, null, 2));
      console.log("Required fields check:");
      console.log("- title:", !!eventData.title);
      console.log("- description:", !!eventData.description);
      console.log("- startDate:", !!eventData.startDate);
      console.log("- endDate:", !!eventData.endDate);
      console.log("- venue:", !!eventData.venue);
      console.log("- department:", !!eventData.department);
      console.log("- category:", !!eventData.category);
      console.log("- targetAudience:", !!eventData.targetAudience);
      console.log("- capacity:", !!eventData.capacity);
      console.log("- createdBy:", !!eventData.createdBy);
      console.log("- organizer:", !!eventData.organizer);

      console.log("Submitting event data to MongoDB:", eventData);

      // Validate departments
      if (!eventData.department) {
        toast.error("Please select a department");
        setIsLoading(false);
        return;
      }

      if (!eventData.subDepartment) {
        toast.error("Please select a sub-department");
        setIsLoading(false);
        return;
      }

      // Check all required fields are filled
      if (
        !eventData.title ||
        !eventData.description ||
        !eventData.venue ||
        !eventData.department ||
        !eventData.category ||
        !eventData.targetAudience ||
        !eventData.capacity
      ) {
        toast.error("Please fill in all required fields");
        setIsLoading(false);
        return;
      }

      // Create authenticated request
      const authRequest = createAuthenticatedRequest();

      if (selectedEvent) {
        // Update existing event in MongoDB with auth
        const response = await authRequest.put(
          `/api/events/${selectedEvent._id}`,
          eventData
        );
        console.log("Event updated in MongoDB:", response.data);

        // Refresh events from server
        await fetchEvents();
        toast.success("Event updated successfully in database");
      } else {
        // Create new event in MongoDB with auth
        const response = await authRequest.post("/api/events", eventData);
        console.log("New event created in MongoDB:", response.data);

        // Refresh events from server and wait for completion
        await fetchEvents();
        toast.success("Event created successfully in database");
      }

      // Close the dialog after events have been refreshed
      handleCloseDialog();
    } catch (err) {
      console.error("Error saving event to MongoDB:", err);

      // More detailed error logging
      if (err.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);

        // Log the full error array if it exists
        if (
          err.response.data &&
          err.response.data.error &&
          Array.isArray(err.response.data.error)
        ) {
          console.error("Validation errors:", err.response.data.error);
          toast.error(`Error: ${err.response.data.error.join(", ")}`);
        }
        // Show more specific error message
        else if (err.response.data && err.response.data.error) {
          toast.error(`Error: ${err.response.data.error}`);
        } else if (err.response.data && err.response.data.message) {
          toast.error(`Error: ${err.response.data.message}`);
        } else {
          toast.error(`Error saving event: ${err.message}`);
        }
      } else {
        toast.error(
          "Error saving event to database: " +
            (err.response?.data?.message || err.message)
        );
      }
    } finally {
      setIsLoading(false);
      setIsSubmitting(false); // Reset submitting state after form submission
    }
  };

  // Update handleDelete to use authenticated requests
  const handleDelete = async (eventId) => {
    try {
      setIsLoading(true);

      // Delete from MongoDB with auth
      const authRequest = createAuthenticatedRequest();
      const response = await authRequest.delete(`/api/events/${eventId}`);
      console.log("Event deleted from MongoDB:", response.data);

      // Refresh events from server
      fetchEvents();
      toast.success("Event deleted successfully from database");
    } catch (err) {
      console.error("Error deleting event from MongoDB:", err);
      toast.error(
        "Error deleting event from database: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Update handleToggleFeatured to use authenticated requests
  const handleToggleFeatured = async (event) => {
    try {
      setIsLoading(true);

      // Toggle featured status in MongoDB with auth
      const authRequest = createAuthenticatedRequest();
      const response = await authRequest.patch(
        `/api/events/${event._id}/featured`
      );
      console.log("Event featured status updated in MongoDB:", response.data);

      // Refresh events from server
      fetchEvents();
      toast.success(
        `Event ${
          event.isFeatured ? "removed from" : "marked as"
        } featured in database`
      );
    } catch (err) {
      console.error("Error updating event featured status in MongoDB:", err);
      toast.error(
        "Error updating event in database: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Dialog handlers
  const handleOpenDialog = (event = null) => {
    // Only admins and lecturers should be able to open this dialog
    if (!canManageEvents) {
      toast.error("You don't have permission to edit events");
      return;
    }

    setSelectedEvent(event);
    if (event) {
      // Populate form with event data
      setFormData({
        title: event.title || "",
        description: event.description || "",
        startDate: event.startDate ? new Date(event.startDate) : new Date(),
        endDate: event.endDate ? new Date(event.endDate) : new Date(),
        venue: event.venue || "",
        category: event.category || "",
        targetAudience: event.targetAudience || "",
        department: event.department || "",
        subDepartment: event.subDepartment || "",
        isFeatured: !!event.isFeatured,
        capacity: event.capacity || 0,
      });
    } else {
      // Reset form for new event
      setFormData({
        title: "",
        description: "",
        startDate: new Date(),
        endDate: new Date(new Date().getTime() + 3600000), // Add 1 hour from now
        venue: "",
        category: "Academic", // Default category
        targetAudience: "All", // Default target audience
        department: "",
        subDepartment: "",
        isFeatured: false,
        capacity: "50", // Default capacity as string (will be parsed to number later)
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedEvent(null);
    setFormData({
      title: "",
      description: "",
      startDate: null,
      endDate: null,
      venue: "",
      department: "",
      subDepartment: "",
      category: "",
      targetAudience: "",
      capacity: "",
      isFeatured: false,
    });
  };

  // Update fetchRegisteredEvents to only use MongoDB
  const fetchRegisteredEvents = async () => {
    try {
      setIsLoadingRegistrations(true);

      // Use the new action for getting user registrations
      const result = await dispatch(getUserRegistrations()).unwrap();

      if (result && result.eventIds) {
        setRegisteredEventIds(result.eventIds);
        console.log("Registered event IDs:", result.eventIds);
      } else {
        console.log("No registered events found");
        setRegisteredEventIds([]);
      }

      setIsLoadingRegistrations(false);
    } catch (error) {
      console.error("Error fetching registered events:", error);
      setIsLoadingRegistrations(false);
      setRegisteredEventIds([]);
    }
  };

  // Update isRegisteredForEvent to only use MongoDB data
  const isRegisteredForEvent = (eventId) => {
    return registeredEventIds.includes(eventId);
  };

  // Check if user can register for event based on audience type
  const canRegisterForEvent = (event) => {
    // First check if already registered
    if (isRegisteredForEvent(event._id)) {
      return false;
    }

    // Handle audience type authorization
    const audience = event.targetAudience || "All";

    if (isStudent) {
      return audience === "Students" || audience === "All";
    } else if (isLecturer) {
      return audience === "Lecturers" || audience === "All";
    }

    return false;
  };

  // Function to handle event registration
  const handleRegisterForEvent = async (event) => {
    // Check if user is authenticated
    if (!user || !user.id) {
      toast.error("Please log in to register for events");
      // Redirect to login page
      navigate("/login", {
        state: { from: window.location.pathname, eventId: event._id },
      });
      return;
    }

    // Check audience type authorization
    if (!canRegisterForEvent(event)) {
      toast.error(
        `This event is not available for ${
          isStudent ? "students" : "lecturers"
        }`
      );
      return;
    }

    setRegistrationDialog({
      ...registrationDialog,
      loading: true,
      error: null,
    });

    try {
      console.log("Registering for event:", event._id);
      console.log("User ID:", user.id);

      // Create custom axios instance with auth token
      const authRequest = createAuthenticatedRequest();

      // Include userId in the request body
      const response = await authRequest.post(
        `/api/events/${event._id}/register`,
        {
          userId: user.id,
          registeredAt: new Date(),
        }
      );

      console.log("Registration response:", response);

      if (response.data && response.status === 200) {
        // Add event to calendar after successful registration
        if (response.data.data) {
          addToCalendar(response.data.data);
        } else {
          addToCalendar(event);
        }

        setRegistrationDialog({
          ...registrationDialog,
          loading: false,
          success: true,
          open: true,
        });

        // Refresh event data and registrations after registration
        setTimeout(() => {
          fetchRegisteredEvents();
          fetchEvents();
          setRegistrationDialog({
            event: null,
            open: false,
            loading: false,
            error: null,
            success: false,
          });
        }, 2000);
      }
    } catch (error) {
      console.error("Registration error:", error);
      // Log the full error response for debugging
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
      }

      setRegistrationDialog({
        ...registrationDialog,
        loading: false,
        error:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Registration failed",
        open: true,
      });
    }
  };

  // Handle closing details dialog
  const handleCloseDetailsDialog = () => {
    setDetailsDialog({
      open: false,
      event: null,
    });
  };

  // Add unregister functionality that stores in MongoDB
  const handleUnregisterFromEvent = async (event) => {
    try {
      setIsLoading(true);
      console.log("Unregistering from event in MongoDB:", event._id);

      const authRequest = createAuthenticatedRequest();

      // Unregister in MongoDB
      const response = await authRequest.delete(
        `/api/events/${event._id}/register`
      );

      console.log("Event unregistration response from MongoDB:", response.data);

      if (response.data && (response.data.success || response.status === 200)) {
        // Update local state by removing the registration
        setRegisteredEventIds((prev) => prev.filter((id) => id !== event._id));
        setRegisteredEvents((prev) => prev.filter((e) => e._id !== event._id));

        // Show success message
        toast.success("Successfully unregistered from event");

        // Close dialog if open
        if (detailsDialog.open) {
          setDetailsDialog({ open: false, event: null });
        }

        // Refresh registrations from MongoDB
        setTimeout(() => {
          fetchRegisteredEvents();
        }, 1000);
      } else {
        throw new Error(
          response.data?.message ||
            response.data?.error ||
            "Unregistration failed"
        );
      }
    } catch (err) {
      console.error("Error unregistering from event in MongoDB:", err);
      toast.error(
        `Unregistration failed: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Update the registration dialog open function to check audience type
  const handleOpenRegistrationDialog = (event) => {
    // Don't allow opening the dialog if user can't register for this event
    if (!canRegisterForEvent(event)) {
      toast.error(
        `This event is not available for ${
          isStudent ? "students" : "lecturers"
        }`
      );
      return;
    }

    setRegistrationDialog({ open: true, event });
  };

  const handleCloseRegistrationDialog = () => {
    setRegistrationDialog({ open: false, event: null });
  };

  // Open details dialog
  const handleOpenDetailsDialog = (event) => {
    setDetailsDialog({
      open: true,
      event: event,
    });
  };

  // Render event form
  const renderEventForm = () => (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="Start Date & Time"
              value={formData.startDate}
              onChange={(date) => setFormData({ ...formData, startDate: date })}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DateTimePicker
              label="End Date & Time"
              value={formData.endDate}
              onChange={(date) => setFormData({ ...formData, endDate: date })}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Venue"
            name="venue"
            value={formData.venue}
            onChange={(e) =>
              setFormData({ ...formData, venue: e.target.value })
            }
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Main Department</InputLabel>
            <Select
              value={formData.department}
              onChange={handleDepartmentChange}
            >
              <MenuItem value="">Select Department</MenuItem>
              {Object.keys(departmentData).map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required disabled={!formData.department}>
            <InputLabel>Sub Department</InputLabel>
            <Select
              value={formData.subDepartment}
              onChange={(e) =>
                setFormData({ ...formData, subDepartment: e.target.value })
              }
            >
              <MenuItem value="">Select Sub Department</MenuItem>
              {formData.department &&
                departmentData[formData.department]?.map((subDept) => (
                  <MenuItem key={subDept} value={subDept}>
                    {subDept}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              {EVENT_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Target Audience</InputLabel>
            <Select
              value={formData.targetAudience}
              onChange={(e) =>
                setFormData({ ...formData, targetAudience: e.target.value })
              }
            >
              {TARGET_AUDIENCES.map((audience) => (
                <MenuItem key={audience} value={audience}>
                  {audience} {audience === "All" && "(Students & Lecturers)"}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              * 'Students' = only students can register * 'Lecturers' = only
              lecturers can register * 'All' = both students and lecturers can
              register
            </Typography>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Capacity"
            name="capacity"
            type="number"
            value={formData.capacity}
            onChange={(e) =>
              setFormData({ ...formData, capacity: e.target.value })
            }
            required
          />
        </Grid>
        {isAdmin && (
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Featured Event</InputLabel>
              <Select
                value={formData.isFeatured}
                onChange={(e) =>
                  setFormData({ ...formData, isFeatured: e.target.value })
                }
              >
                <MenuItem value={false}>No</MenuItem>
                <MenuItem value={true}>Yes</MenuItem>
              </Select>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ mt: 1 }}
              >
                * Only admins can mark events as featured
              </Typography>
            </FormControl>
          </Grid>
        )}
      </Grid>
    </form>
  );

  // Render grid view with enhanced styling
  const renderGridView = () => {
    console.log("Rendering grid view with events:", events);

    if (!events || !Array.isArray(events)) {
      console.error("Events is not an array:", events);
      return (
        <Alert severity="error" sx={{ my: 2 }}>
          Error loading events: Events data is not in the expected format.
        </Alert>
      );
    }

    // Get filtered events based on registration status
    const displayEvents = getFilteredEvents();

    // Filter out invalid events and log warning for debugging
    const validEvents = displayEvents.filter((event) => {
      if (!event || !event._id || !event.title) {
        console.warn("Invalid event data skipped:", event);
        return false;
      }
      return true;
    });

    if (validEvents.length === 0) {
      return (
        <Box
          sx={{
            my: 3,
            textAlign: "center",
            p: 4,
            borderRadius: 2,
            bgcolor: "#f5f5f5",
            border: "1px dashed #ccc",
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {showRegisteredOnly
              ? "You haven't registered for any events yet"
              : "No events match your search criteria"}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: "500px", mx: "auto" }}
          >
            {showRegisteredOnly
              ? "Browse and register for upcoming events to see them here."
              : "Try adjusting your filters or search terms."}
          </Typography>
          {showRegisteredOnly && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowRegisteredOnly(false)}
              startIcon={<SearchIcon />}
            >
              Browse All Events
            </Button>
          )}
        </Box>
      );
    }

    return (
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {validEvents.map((event, index) => (
          <Grid item xs={12} sm={6} md={4} key={event._id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                borderRadius: 2,
                overflow: "hidden",
                boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
                transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                animation: `fadeInUp 0.5s ease-out forwards ${index * 0.1}s`,
                opacity: 0,
                transform: "translateY(20px)",
                "@keyframes fadeInUp": {
                  "0%": { opacity: 0, transform: "translateY(20px)" },
                  "100%": { opacity: 1, transform: "translateY(0)" },
                },
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: "0 14px 30px rgba(0,0,0,0.15)",
                },
              }}
            >
              {event.isFeatured && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 20,
                    right: 0,
                    zIndex: 2,
                    bgcolor: "secondary.main",
                    color: "white",
                    py: 0.5,
                    px: 2,
                    borderTopLeftRadius: 20,
                    borderBottomLeftRadius: 20,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <StarIcon fontSize="small" />
                  <Typography variant="body2" fontWeight="bold">
                    Featured
                  </Typography>
                </Box>
              )}
              <Box sx={{ position: "relative" }}>
                <Box
                  sx={{
                    height: "100px",
                    bgcolor:
                      event.category === "Academic"
                        ? "info.main"
                        : event.category === "Workshop"
                        ? "success.main"
                        : event.category === "Seminar"
                        ? "warning.main"
                        : event.category === "Club"
                        ? "secondary.main"
                        : event.category === "Sports"
                        ? "error.main"
                        : "primary.main",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderTopLeftRadius: "4px",
                    borderTopRightRadius: "4px",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    color="white"
                    fontWeight="bold"
                    sx={{
                      px: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {event.category === "Academic" ? (
                      <SchoolIcon />
                    ) : event.category === "Workshop" ? (
                      <PeopleIcon />
                    ) : event.category === "Seminar" ? (
                      <EventIcon />
                    ) : event.category === "Club" ? (
                      <GroupIcon />
                    ) : event.category === "Sports" ? (
                      <AccessTimeIcon />
                    ) : (
                      <CategoryIcon />
                    )}
                    {event.category || "Event"}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: -2,
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleOpenDetailsDialog(event)}
                    sx={{
                      borderRadius: 6,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      px: 2,
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </Box>

              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                  sx={{
                    fontWeight: "bold",
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {event.title}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    height: "2.5rem",
                  }}
                >
                  {event.description}
                </Typography>

                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      color: "primary.main",
                      mb: 1,
                      fontWeight: "medium",
                    }}
                  >
                    <EventIcon fontSize="small" sx={{ mr: 1 }} />
                    {format(new Date(event.startDate), "PPP")}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      color: "text.secondary",
                      mb: 1,
                    }}
                  >
                    <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                    {format(new Date(event.startDate), "p")} -{" "}
                    {format(new Date(event.endDate), "p")}
                  </Typography>

                  {event.venue && (
                    <Typography
                      variant="body2"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        color: "text.secondary",
                        mb: 1,
                      }}
                    >
                      <LocationOnIcon fontSize="small" sx={{ mr: 1 }} />
                      {event.venue}
                    </Typography>
                  )}
                </Box>

                <Box
                  sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mt: 2 }}
                >
                  <Chip
                    size="small"
                    label={event.category || "Uncategorized"}
                    sx={{
                      bgcolor: "rgba(33, 150, 243, 0.1)",
                      color: "primary.main",
                      fontWeight: "medium",
                      "&:hover": { bgcolor: "rgba(33, 150, 243, 0.2)" },
                    }}
                  />

                  <Chip
                    size="small"
                    label={event.targetAudience || "All"}
                    icon={<PeopleIcon />}
                    sx={{
                      bgcolor:
                        event.targetAudience === "Students"
                          ? "rgba(25, 118, 210, 0.1)"
                          : event.targetAudience === "Lecturers"
                          ? "rgba(156, 39, 176, 0.1)"
                          : "rgba(76, 175, 80, 0.1)",
                      color:
                        event.targetAudience === "Students"
                          ? "primary.dark"
                          : event.targetAudience === "Lecturers"
                          ? "secondary.dark"
                          : "success.dark",
                      fontWeight: "medium",
                      "&:hover": {
                        bgcolor:
                          event.targetAudience === "Students"
                            ? "rgba(25, 118, 210, 0.2)"
                            : event.targetAudience === "Lecturers"
                            ? "rgba(156, 39, 176, 0.2)"
                            : "rgba(76, 175, 80, 0.2)",
                      },
                    }}
                  />

                  {event.department && (
                    <Chip
                      size="small"
                      label={event.department}
                      sx={{
                        bgcolor: "rgba(156, 39, 176, 0.1)",
                        color: "secondary.dark",
                        fontWeight: "medium",
                        "&:hover": { bgcolor: "rgba(156, 39, 176, 0.2)" },
                      }}
                    />
                  )}
                </Box>
              </CardContent>

              <CardActions
                sx={{
                  p: 2,
                  pt: 0,
                  borderTop: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <Button
                    size="small"
                    onClick={() => handleOpenDetailsDialog(event)}
                    variant="text"
                    startIcon={<VisibilityIcon fontSize="small" />}
                    sx={{
                      fontWeight: "medium",
                      color: "primary.main",
                      borderRadius: 6,
                      "&:hover": {
                        bgcolor: "rgba(25, 118, 210, 0.08)",
                      },
                    }}
                  >
                    Details
                  </Button>

                  {(isStudent || isLecturer) &&
                    (isRegisteredForEvent(event._id) ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        disabled
                        startIcon={<CheckCircleIcon fontSize="small" />}
                        sx={{
                          fontWeight: "medium",
                          borderRadius: 6,
                          boxShadow: "none",
                          "&.Mui-disabled": {
                            bgcolor: "success.light",
                            color: "white",
                          },
                        }}
                      >
                        Registered
                      </Button>
                    ) : canRegisterForEvent(event) ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<HowToRegIcon fontSize="small" />}
                        onClick={() => handleOpenRegistrationDialog(event)}
                        sx={{
                          fontWeight: "medium",
                          borderRadius: 6,
                          boxShadow: "0 3px 5px rgba(0,0,0,0.2)",
                          "&:hover": {
                            boxShadow: "0 5px 10px rgba(0,0,0,0.3)",
                          },
                        }}
                      >
                        Register
                      </Button>
                    ) : (
                      <Tooltip
                        title={`This event is not available for ${
                          isStudent ? "students" : "lecturers"
                        }`}
                      >
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            disabled
                            startIcon={<HowToRegIcon fontSize="small" />}
                          >
                            Not Available
                          </Button>
                        </span>
                      </Tooltip>
                    ))}

                  {canManageEvents && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenDialog(event)}
                          sx={{ bgcolor: "rgba(25, 118, 210, 0.08)" }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {isAdmin && (
                        <Tooltip
                          title={
                            event.isFeatured
                              ? "Remove from Featured"
                              : "Mark as Featured"
                          }
                        >
                          <IconButton
                            size="small"
                            color={event.isFeatured ? "secondary" : "default"}
                            onClick={() => handleToggleFeatured(event)}
                            sx={{
                              bgcolor: event.isFeatured
                                ? "rgba(156, 39, 176, 0.08)"
                                : "rgba(0, 0, 0, 0.04)",
                            }}
                          >
                            <StarIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(event._id)}
                          sx={{ bgcolor: "rgba(211, 47, 47, 0.08)" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCalendar(event);
                        }}
                        title="Add to calendar"
                      >
                        <CalendarIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Render list view
  const renderListView = () => {
    console.log("Rendering list view with events:", events);

    if (!events || !Array.isArray(events)) {
      console.error("Events is not an array:", events);
      return (
        <Alert severity="error" sx={{ my: 2 }}>
          Error loading events: Events data is not in the expected format.
        </Alert>
      );
    }

    // Get filtered events based on registration status
    const displayEvents = getFilteredEvents();

    // Filter out invalid events and log warning for debugging
    const validEvents = displayEvents.filter((event) => {
      if (!event || !event._id || !event.title) {
        console.warn("Invalid event data skipped:", event);
        return false;
      }
      return true;
    });

    if (validEvents.length === 0) {
      return (
        <Box sx={{ my: 2, textAlign: "center" }}>
          {showRegisteredOnly
            ? "You haven't registered for any events yet."
            : "No events found."}
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Found {validEvents.length} {showRegisteredOnly ? "registered " : ""}
          event{validEvents.length !== 1 ? "s" : ""}
        </Typography>
        <List>
          {validEvents.map((event) => (
            <Paper key={event._id} sx={{ mb: 2 }}>
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  canManageEvents && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="Edit">
                        <IconButton
                          edge="end"
                          color="primary"
                          onClick={() => handleOpenDialog(event)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip
                        title={
                          event.isFeatured
                            ? "Remove from Featured"
                            : "Mark as Featured"
                        }
                      >
                        <IconButton
                          edge="end"
                          color={event.isFeatured ? "secondary" : "default"}
                          onClick={() => handleToggleFeatured(event)}
                        >
                          <StarIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleDelete(event._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )
                }
                sx={{
                  borderLeft: event.isFeatured ? "4px solid" : "none",
                  borderColor: "secondary.main",
                  pl: event.isFeatured ? 2 : 3,
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    alt={event.title}
                    sx={{
                      bgcolor:
                        event.category === "Academic"
                          ? "info.main"
                          : event.category === "Workshop"
                          ? "success.main"
                          : event.category === "Seminar"
                          ? "warning.main"
                          : event.category === "Club"
                          ? "secondary.main"
                          : event.category === "Sports"
                          ? "error.main"
                          : "primary.main",
                    }}
                  >
                    {event.title.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="h6" component="span">
                        {event.title}
                      </Typography>
                      {event.isFeatured && (
                        <Chip
                          label="Featured"
                          color="secondary"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        sx={{ display: "block" }}
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {format(new Date(event.startDate), "PPP")} •{" "}
                        {format(new Date(event.startDate), "p")} -{" "}
                        {format(new Date(event.endDate), "p")}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
                        {event.description}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.5,
                          mt: 1,
                        }}
                      >
                        {event.venue && (
                          <Chip
                            size="small"
                            icon={<LocationOnIcon fontSize="small" />}
                            label={event.venue}
                          />
                        )}
                        <Chip
                          size="small"
                          icon={<CategoryIcon fontSize="small" />}
                          label={event.category || "Uncategorized"}
                        />
                        <Chip
                          size="small"
                          icon={<PeopleIcon fontSize="small" />}
                          label={event.targetAudience || "All"}
                          sx={{
                            bgcolor:
                              event.targetAudience === "Students"
                                ? "rgba(25, 118, 210, 0.1)"
                                : event.targetAudience === "Lecturers"
                                ? "rgba(156, 39, 176, 0.1)"
                                : "rgba(76, 175, 80, 0.1)",
                            color:
                              event.targetAudience === "Students"
                                ? "primary.dark"
                                : event.targetAudience === "Lecturers"
                                ? "secondary.dark"
                                : "success.dark",
                          }}
                        />
                        {(event.department || event.subDepartment) && (
                          <Chip
                            size="small"
                            icon={<SchoolIcon fontSize="small" />}
                            label={`${event.department || "All"} / ${
                              event.subDepartment || "All"
                            }`}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: "flex", mt: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleOpenDetailsDialog(event)}
                          sx={{ mr: 1 }}
                        >
                          View Details
                        </Button>

                        {(isStudent || isLecturer) &&
                          (isRegisteredForEvent(event._id) ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              disabled
                              startIcon={<CheckCircleIcon />}
                            >
                              Registered
                            </Button>
                          ) : canRegisterForEvent(event) ? (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<HowToRegIcon />}
                              onClick={() =>
                                handleOpenRegistrationDialog(event)
                              }
                            >
                              Register
                            </Button>
                          ) : (
                            <Tooltip
                              title={`This event is not available for ${
                                isStudent ? "students" : "lecturers"
                              }`}
                            >
                              <span>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  disabled
                                  startIcon={<HowToRegIcon />}
                                >
                                  Not Available
                                </Button>
                              </span>
                            </Tooltip>
                          ))}
                      </Box>
                    </React.Fragment>
                  }
                />
              </ListItem>
            </Paper>
          ))}
        </List>
      </Box>
    );
  };

  // Add this new function to render admin dashboard
  const renderAdminDashboard = () => {
    if (!isAdmin) return null;

    return (
      <Box mb={4}>
        <Paper sx={{ p: 2, mb: 2 }}>
          {/* Top row with title/actions */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" component="div">
              Event Dashboard
            </Typography>
            <Box>
              {canManageEvents && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                  sx={{ mr: 2 }}
                >
                  Create Event
                </Button>
              )}

              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="grid">
                  <GridViewIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="list">
                  <ListViewIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {/* Filters */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Search Events"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {EVENT_CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={filters.department}
                  label="Department"
                  onChange={handleDepartmentChange}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {Object.keys(departmentData).map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={filters.startDate}
                  onChange={(date) =>
                    setFilters({ ...filters, startDate: date })
                  }
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="medium">
                <InputLabel>Audience</InputLabel>
                <Select
                  value={filters.audience}
                  label="Audience"
                  onChange={(e) =>
                    setFilters({ ...filters, audience: e.target.value })
                  }
                  sx={{ borderRadius: 1.5 }}
                >
                  <MenuItem value="">All Audiences</MenuItem>
                  {TARGET_AUDIENCES.map((audience) => (
                    <MenuItem key={audience} value={audience}>
                      {audience}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.availableOnly}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        availableOnly: e.target.checked,
                      })
                    }
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    Show only events{" "}
                    {isStudent || isLecturer
                      ? "you can register for"
                      : "available to all"}
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  };

  // Add a useEffect to monitor the events array
  useEffect(() => {
    console.log("Current events:", events);
  }, [events]);

  // Update renderDebugInfo to focus on MongoDB operations
  const renderDebugInfo = () => (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        bgcolor: "#f5f5f5",
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Typography variant="subtitle2">MongoDB Events Debug</Typography>
      <Typography variant="body2">
        Events Count: {events ? events.length : 0}
      </Typography>
      <Box display="flex" gap={1}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            console.log("Current events from MongoDB:", events);
            toast.info(
              `Events count in MongoDB: ${events ? events.length : 0}`
            );
          }}
        >
          Log Events
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="primary"
          onClick={() => {
            fetchEvents();
            toast.info("Refreshed events from MongoDB");
          }}
        >
          Refresh from DB
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="success"
          onClick={async () => {
            try {
              const testEvent = {
                title: "Test Event",
                description: "This is a test event created directly in MongoDB",
                startDate: new Date(),
                endDate: new Date(Date.now() + 3600000),
                venue: "Test Venue",
                department: Object.keys(departmentData)[0] || "Test Department",
                subDepartment:
                  departmentData[Object.keys(departmentData)[0]]?.[0] ||
                  "Test Sub-Department",
                category: "Academic",
                targetAudience: "All",
                capacity: 50,
                isFeatured: false,
              };

              const response = await axios.post("/api/events", testEvent);
              console.log("Test event added to MongoDB:", response.data);

              // Refresh events from server
              fetchEvents();
              toast.success("Test event added to MongoDB");
            } catch (error) {
              console.error("Error adding test event to MongoDB:", error);
              toast.error("Error adding test event to database");
            }
          }}
        >
          Add Test Event to DB
        </Button>
      </Box>
    </Paper>
  );

  // Add registration confirmation dialog
  const renderRegistrationDialog = () => (
    <Dialog
      open={registrationDialog.open}
      onClose={handleCloseRegistrationDialog}
      aria-labelledby="register-dialog-title"
    >
      <DialogTitle id="register-dialog-title">Register for Event</DialogTitle>
      <DialogContent>
        {registrationDialog.event && (
          <>
            <Typography variant="h6">
              {registrationDialog.event.title}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Date:</strong>{" "}
              {format(new Date(registrationDialog.event.startDate), "PPP")}
            </Typography>
            <Typography variant="body2">
              <strong>Time:</strong>{" "}
              {format(new Date(registrationDialog.event.startDate), "p")} -{" "}
              {format(new Date(registrationDialog.event.endDate), "p")}
            </Typography>
            {registrationDialog.event.venue && (
              <Typography variant="body2">
                <strong>Venue:</strong> {registrationDialog.event.venue}
              </Typography>
            )}
            <Typography variant="body2">
              <strong>Audience:</strong>{" "}
              {registrationDialog.event.targetAudience || "All"}
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Do you want to register for this event? It will be added to your
              calendar.
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseRegistrationDialog}>Cancel</Button>
        <Button
          onClick={() => handleRegisterForEvent(registrationDialog.event)}
          variant="contained"
          color="primary"
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : "Register"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Update renderEventDetailsDialog with better styling
  const renderEventDetailsDialog = () => {
    const event = detailsDialog.event;
    if (!event) return null;

    return (
      <Dialog
        open={detailsDialog.open}
        onClose={handleCloseDetailsDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          },
        }}
      >
        {/* Header with background image */}
        <Box
          sx={{
            bgcolor:
              event.category === "Academic"
                ? "info.main"
                : event.category === "Workshop"
                ? "success.main"
                : event.category === "Seminar"
                ? "warning.main"
                : event.category === "Club"
                ? "secondary.main"
                : event.category === "Sports"
                ? "error.main"
                : "primary.main",
            p: 3,
            position: "relative",
            color: "white",
          }}
        >
          <Box sx={{ position: "absolute", top: 8, right: 8 }}>
            <IconButton onClick={handleCloseDetailsDialog}>
              <CancelIcon />
            </IconButton>
          </Box>

          <Typography variant="h4" fontWeight="bold">
            {event.title}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
              mt: 2,
            }}
          >
            {event.isFeatured && (
              <Chip
                label="Featured Event"
                color="secondary"
                size="small"
                icon={<StarIcon />}
                sx={{ fontWeight: "bold" }}
              />
            )}
            <Chip
              label={event.category || "Uncategorized"}
              size="small"
              icon={<CategoryIcon />}
            />
            <Chip
              label={`For ${event.targetAudience || "All"}`}
              size="small"
              icon={<PeopleIcon />}
            />
          </Box>
        </Box>

        <DialogContent dividers>
          {/* Main Content */}
          <Grid container>
            <Grid item xs={12} md={8} sx={{ p: 3 }}>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                paragraph
                sx={{ display: "flex", alignItems: "center" }}
              >
                <EventIcon
                  sx={{ mr: 1, color: "primary.main" }}
                  fontSize="small"
                />
                <strong>When:</strong>&nbsp;
                {format(new Date(event.startDate), "PPP")} |{" "}
                {format(new Date(event.startDate), "p")} -{" "}
                {format(new Date(event.endDate), "p")}
              </Typography>

              {event.venue && (
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  paragraph
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <LocationOnIcon
                    sx={{ mr: 1, color: "primary.main" }}
                    fontSize="small"
                  />
                  <strong>Where:</strong>&nbsp;{event.venue}
                </Typography>
              )}

              {(event.department || event.subDepartment) && (
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  paragraph
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <SchoolIcon
                    sx={{ mr: 1, color: "primary.main" }}
                    fontSize="small"
                  />
                  <strong>Department:</strong>&nbsp;{event.department}
                  {event.subDepartment ? ` / ${event.subDepartment}` : ""}
                </Typography>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" fontWeight="bold" gutterBottom>
                About This Event
              </Typography>

              <Typography
                variant="body1"
                paragraph
                sx={{ whiteSpace: "pre-line" }}
              >
                {event.description}
              </Typography>

              {event.capacity && (
                <Box sx={{ mt: 3, p: 2, bgcolor: "#f8f9fa", borderRadius: 2 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <GroupIcon
                      sx={{ mr: 1, color: "primary.main" }}
                      fontSize="small"
                    />
                    Event Capacity
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This event can accommodate up to{" "}
                    <strong>{event.capacity}</strong> attendees.
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Registration/Action Sidebar */}
            <Grid item xs={12} md={4} sx={{ bgcolor: "#f8f9fa", p: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  position: "sticky",
                  top: 16,
                }}
              >
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {isStudent ? "Registration" : "Event Actions"}
                </Typography>

                {isStudent && (
                  <>
                    {isRegisteredForEvent(event._id) ? (
                      <>
                        <Alert severity="success" sx={{ mb: 2 }}>
                          <AlertTitle>Registered</AlertTitle>
                          You are registered for this event!
                        </Alert>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          This event has been added to your calendar.
                        </Typography>
                        <Button
                          variant="outlined"
                          color="error"
                          fullWidth
                          startIcon={<CancelIcon />}
                          onClick={() => handleUnregisterFromEvent(event)}
                          sx={{
                            borderRadius: 6,
                            py: 1.2,
                            fontWeight: "medium",
                            borderWidth: 2,
                            "&:hover": {
                              borderWidth: 2,
                            },
                          }}
                        >
                          Unregister
                        </Button>
                      </>
                    ) : canRegisterForEvent(event) ? (
                      <>
                        <Typography variant="body2" paragraph>
                          Would you like to register for this event? It will be
                          added to your calendar.
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          startIcon={<HowToRegIcon />}
                          onClick={() => {
                            handleCloseDetailsDialog();
                            handleOpenRegistrationDialog(event);
                          }}
                          sx={{
                            borderRadius: 6,
                            py: 1.2,
                            fontWeight: "medium",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            "&:hover": {
                              boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                              transform: "translateY(-2px)",
                            },
                            transition: "all 0.2s ease",
                          }}
                        >
                          Register Now
                        </Button>
                      </>
                    ) : (
                      <>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <AlertTitle>Not Available</AlertTitle>
                          This event is not available for{" "}
                          {isStudent ? "students" : "lecturers"}.
                        </Alert>
                        <Typography variant="body2" color="text.secondary">
                          This event is intended for{" "}
                          {event.targetAudience === "Students"
                            ? "students only"
                            : event.targetAudience === "Lecturers"
                            ? "lecturers only"
                            : "all campus members"}
                          .
                        </Typography>
                      </>
                    )}
                  </>
                )}

                {canManageEvents && (
                  <Box sx={{ mt: isStudent ? 3 : 0 }}>
                    {isStudent && <Divider sx={{ my: 3 }} />}
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Management Options
                    </Typography>
                    <Stack spacing={2}>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          handleCloseDetailsDialog();
                          handleOpenDialog(event);
                        }}
                        fullWidth
                        sx={{ borderRadius: 6 }}
                      >
                        Edit Event
                      </Button>

                      {isAdmin && (
                        <Button
                          variant="outlined"
                          color="secondary"
                          startIcon={
                            event.isFeatured ? <StarBorderIcon /> : <StarIcon />
                          }
                          onClick={() => {
                            handleToggleFeatured(event);
                            handleCloseDetailsDialog();
                          }}
                          fullWidth
                          sx={{ borderRadius: 6 }}
                        >
                          {event.isFeatured
                            ? "Remove Featured"
                            : "Mark as Featured"}
                        </Button>
                      )}

                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                          handleDelete(event._id);
                          handleCloseDetailsDialog();
                        }}
                        fullWidth
                        sx={{ borderRadius: 6 }}
                      >
                        Delete Event
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    );
  };

  // Add the missing renderEventDialog function with enhanced styling
  const renderEventDialog = () => (
    <Dialog
      open={openDialog}
      onClose={handleCloseDialog}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 3,
          bgcolor: selectedEvent ? "primary.main" : "secondary.main",
          color: "white",
          fontWeight: "bold",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {selectedEvent ? <EditIcon /> : <AddIcon />}
          <Typography variant="h5">
            {selectedEvent ? "Edit Event" : "Create New Event"}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" color="text.secondary">
            {selectedEvent
              ? "Update the details for this event below."
              : "Fill in the details for your new event."}
          </Typography>
        </Box>
        {renderEventForm()}
      </DialogContent>
      <DialogActions
        sx={{ px: 3, py: 2, borderTop: "1px solid rgba(0,0,0,0.12)" }}
      >
        <Button
          onClick={handleCloseDialog}
          sx={{
            fontWeight: "medium",
            borderRadius: 6,
            px: 3,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={selectedEvent ? "primary" : "secondary"}
          disabled={isSubmitting}
          sx={{
            fontWeight: "medium",
            borderRadius: 6,
            px: 4,
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            "&:hover": {
              boxShadow: "0 6px 15px rgba(0,0,0,0.2)",
            },
          }}
        >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : selectedEvent ? (
            "Update Event"
          ) : (
            "Create Event"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Force-refresh registered events when toggle is turned on
  useEffect(() => {
    if (showRegisteredOnly && isStudent) {
      console.log("Toggle turned on, refreshing registered events...");
      fetchRegisteredEvents();
    }
  }, [showRegisteredOnly]);

  // Add the addToCalendar function
  const addToCalendar = (event) => {
    try {
      // Create calendar event object
      const calendarEvent = {
        title: event.title,
        description: event.description,
        location: event.venue,
        start: new Date(event.startDate),
        end: new Date(event.endDate),
        eventId: event._id,
      };

      // Check if browser supports calendar integration
      if (window.isSecureContext && "scheduling" in navigator) {
        // Modern browsers with Scheduling API
        try {
          navigator.scheduling
            .createEvent(calendarEvent)
            .then(() => toast.success("Event added to your calendar"))
            .catch((err) => console.log("Calendar API error:", err));
        } catch (calendarErr) {
          console.log("Error adding to calendar:", calendarErr);
          // Fallback to storing in localStorage
          addToLocalCalendar(calendarEvent);
        }
      } else {
        // Fallback to storing in localStorage
        addToLocalCalendar(calendarEvent);
      }
    } catch (error) {
      console.error("Calendar integration error:", error);
      toast.error("Could not add to calendar");
    }
  };

  // Add function to store in localStorage
  const addToLocalCalendar = (calendarEvent) => {
    try {
      const storedEvents = JSON.parse(
        localStorage.getItem("registeredEvents") || "[]"
      );
      if (!storedEvents.some((e) => e.eventId === calendarEvent.eventId)) {
        storedEvents.push({
          ...calendarEvent,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem("registeredEvents", JSON.stringify(storedEvents));
        toast.success("Event added to your calendar");
      } else {
        toast.info("Event already in your calendar");
      }
    } catch (error) {
      console.error("Error storing event in local calendar:", error);
      toast.error("Could not add to calendar");
    }
  };

  // Add renderEventDetails function
  const renderEventDetails = (event) => {
  return (
      <Box sx={{ mb: 4 }}>
        <Paper elevation={3} sx={{ 
          p: 4, 
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          position: "relative",
          overflow: "hidden"
        }}>
          <Box sx={{ 
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
            height: 8, 
            bgcolor: event.category === "Academic"
                ? "info.main"
                : event.category === "Workshop"
                ? "success.main"
                : event.category === "Seminar"
                ? "warning.main"
                : event.category === "Club"
                ? "secondary.main"
                : event.category === "Sports"
                ? "error.main"
                : "primary.main",
          }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {event.title}
            </Typography>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Chip 
                  icon={<CategoryIcon />} 
                  label={event.category} 
                  size="small" 
                  sx={{ mr: 1 }}
                  color={
                    event.category === "Academic"
                      ? "info"
                      : event.category === "Workshop"
                      ? "success"
                      : event.category === "Seminar"
                      ? "warning"
                      : event.category === "Club"
                      ? "secondary"
                      : event.category === "Sports"
                      ? "error"
                      : "primary"
                  }
                />
                
                {event.featured && (
                  <Chip 
                    icon={<StarIcon />} 
                    label="Featured" 
                    size="small"
                color="secondary"
                  />
            )}
          </Box>
              
              <Typography variant="body1" paragraph>
                {event.description}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <AccessTimeIcon sx={{ mr: 1, color: "text.secondary" }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Start Time
                      </Typography>
                      <Typography variant="body1">
                        {new Date(event.startDate).toLocaleString()}
                      </Typography>
        </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <AccessTimeIcon sx={{ mr: 1, color: "text.secondary" }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        End Time
                      </Typography>
                      <Typography variant="body1">
                        {new Date(event.endDate).toLocaleString()}
                </Typography>
              </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <LocationOnIcon sx={{ mr: 1, color: "text.secondary" }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Location
                  </Typography>
                      <Typography variant="body1">
                        {event.venue}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <SchoolIcon sx={{ mr: 1, color: "text.secondary" }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Department
                      </Typography>
                      <Typography variant="body1">
                        {event.department}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper elevation={1} sx={{ p: 3, borderRadius: 2, bgcolor: "background.paper" }}>
                <Typography variant="h6" gutterBottom>
                  Event Details
                </Typography>
                
                <List>
                  <ListItem divider>
                    <ListItemText 
                      primary="Status" 
                      secondary={
                        new Date(event.startDate) > new Date() 
                          ? "Upcoming" 
                          : new Date(event.endDate) < new Date() 
                          ? "Completed" 
                          : "Ongoing"
                      } 
                    />
                  </ListItem>
                  
                  <ListItem divider>
                    <ListItemText 
                      primary="Available Spots" 
                      secondary={
                        event.capacity === -1 
                          ? "Unlimited" 
                          : `${event.capacity - (event.registeredCount || 0)} of ${event.capacity}`
                      } 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="Audience" 
                      secondary={event.audience || "Everyone"} 
                    />
                  </ListItem>
                </List>
                
                <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 1 }}>
                  {canRegisterForEvent(event) && (
                    <Button 
                      variant="contained" 
                      fullWidth
                      startIcon={<HowToRegIcon />}
                      onClick={() => handleOpenRegistrationDialog(event)}
                    >
                      Register for Event
                    </Button>
                  )}
                  
                  {isRegisteredForEvent(event._id) && (
                    <Button 
                      variant="outlined" 
                      color="error"
                      fullWidth
                      startIcon={<CancelIcon />}
                      onClick={() => handleUnregisterFromEvent(event)}
                    >
                      Cancel Registration
                    </Button>
                  )}
                  
                <Button
                  variant="outlined"
                    fullWidth
                    startIcon={<CalendarIcon />}
                    onClick={() => addToCalendar(event)}
                  >
                    Add to Calendar
                  </Button>
                  
                  <Button 
                    variant="text"
                    fullWidth
                    startIcon={<ShareIcon />}
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: event.title,
                          text: `Check out this event: ${event.title}`,
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Link copied to clipboard");
                      }
                    }}
                  >
                    Share Event
                </Button>
              </Box>
          </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Render event details if a specific event is selected */}
      {selectedEvent ? renderEventDetails(selectedEvent) : null}

      {/* Event listing */}
      {!selectedEvent && (
        <>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1">
              Campus Events
            </Typography>
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={Link}
                to="/events/create"
              >
                Create Event
              </Button>
            )}
          </Box>

          {/* Filter controls */}
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="medium"
                label="Search Events"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 1.5 },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.5,
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="medium">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                  sx={{ borderRadius: 1.5 }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {EVENT_CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="medium">
                <InputLabel>Department</InputLabel>
                <Select
                  value={filters.department}
                  label="Department"
                  onChange={handleDepartmentChange}
                  sx={{ borderRadius: 1.5 }}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  {Object.keys(departmentData).map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={filters.startDate}
                  onChange={(date) =>
                    setFilters({ ...filters, startDate: date })
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "medium",
                      sx: {
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 1.5,
                        },
                      },
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </Paper>

        {/* Event form dialog - for editing/creating (admins only) */}
        {renderEventDialog()}

        {/* Event details dialog - for viewing (all users) */}
        {renderEventDetailsDialog()}

        {/* Registration confirmation dialog */}
        {renderRegistrationDialog()}

        {/* Events display with improved styling */}
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 300,
              flexDirection: "column",
              gap: 2,
            }}
          >
            <CircularProgress size={60} thickness={4} />
            <Typography variant="body1" color="text.secondary">
              Loading events...
            </Typography>
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            sx={{
              my: 3,
              borderRadius: 2,
              fontSize: "1rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}
            action={
              <Button
                color="inherit"
                onClick={fetchEvents}
                size="small"
                sx={{ fontWeight: "bold" }}
              >
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        ) : viewMode === "grid" ? (
          renderGridView()
        ) : (
          renderListView()
        )}
        </>
      )}
    </Container>
  );
};

export default EventPage;
