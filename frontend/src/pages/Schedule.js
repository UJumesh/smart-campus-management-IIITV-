import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { toast } from "react-toastify";
import "../styles/Schedule.css";
import {
  Container,
  Paper,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
  Drawer,
  Tabs,
  Tab,
  Autocomplete,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  FormHelperText,
} from "@mui/material";
import {
  Add as AddIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Assessment as AssessmentIcon,
  Notes as NotesIcon,
  Group as GroupIcon,
  ViewModule,
  ViewWeek,
  ViewDay,
  ViewList,
  People as PeopleIcon,
} from "@mui/icons-material";
import {
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
  updateAttendanceStatus,
  checkConflicts,
  generateReport,
  bulkUpdateSchedules,
} from "../services/slices/scheduleSlice";
import { getEvents as getEventPageEvents } from "../services/slices/eventSlice";
import { format } from "date-fns";

const Schedule = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const {
    isLoading = false,
    refreshNeeded = false,
    refreshParams = null,
  } = useSelector((state) => state.schedule || {});
  const { events: eventPageEvents = [] } = useSelector((state) => state.events || {});

  const [events, setEvents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(),
    location: "",
    type: "other",
    color: "#3788d8",
    targetAudience: "All",
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({
    eventTypes: [],
    status: [],
    department: user?.role === "admin" ? "" : user?.mainDepartment || "",
    showMyEvents: false,
  });
  const [view, setView] = useState("dayGridMonth");
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState("");
  const [attendeesDialogOpen, setAttendeesDialogOpen] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    inApp: true,
    reminderTime: 30,
  });
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [reportOptions, setReportOptions] = useState({
    type: "utilization",
    format: "pdf",
  });
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [rosterDialogOpen, setRosterDialogOpen] = useState(false);

  useEffect(() => {
    // Initial fetch of events from both schedule and events system
    dispatch(getEventPageEvents());
  }, [dispatch]);

  const loadEvents = useCallback(
    async (info) => {
      try {
        // Handle both FullCalendar info objects and our custom refreshParams
        const startDate = info.startStr || info.startDate;
        const endDate = info.endStr || info.endDate;

        if (!startDate || !endDate) {
          console.error("Missing date parameters for loadEvents", info);
          return;
        }

        const response = await dispatch(
          getSchedules({
            startDate,
            endDate,
          })
        ).unwrap();

        // Format schedule events
        const scheduledEvents = response.data.map((event) => ({
          id: event._id,
          title: event.title,
          start: event.startDate,
          end: event.endDate,
          description: event.description,
          location: event.location,
          type: event.type,
          color: event.color,
          extendedProps: {
            createdBy: event.createdBy,
            attendees: event.attendees,
            targetAudience: event.targetAudience || "All",
            source: "schedule",
          },
        }));

        // Format event page events with eye-catching colors
        const formattedEventPageEvents = eventPageEvents.map((event) => ({
          id: `event-${event._id}`,
          title: event.title,
          start: event.startDate,
          end: event.endDate,
          description: event.description,
          location: event.venue,
          type: "event",
          color: "#FF1493", // Hot pink color like in the image
          textColor: "#FFFFFF", // White text for better contrast
          display: 'block', // Make events appear as blocks in month view
          extendedProps: {
            createdBy: event.createdBy,
            attendees: event.attendees || [],
            targetAudience: "All",
            source: "eventpage",
            status: event.status,
            venue: event.venue,
            eventType: event.eventType
          },
        }));

        // Combine both types of events
        const combinedEvents = [...scheduledEvents, ...formattedEventPageEvents];
        setEvents(combinedEvents);
      } catch (error) {
        toast.error("Failed to load events");
      }
    },
    [dispatch, eventPageEvents]
  );

  // Define enhanced role-based permissions for scheduling actions
  const schedulePermissions = useMemo(() => {
    const role = user?.role || "student";

    return {
      // Admin permissions
      canCreateAnySchedule: role === "admin",
      canModifyAnySchedule: role === "admin",
      canDeleteAnySchedule: role === "admin",
      canManageResources: role === "admin",
      canViewAllSchedules: role === "admin",
      canAssignLecturers: role === "admin",
      canApproveRequests: role === "admin",
      canGenerateReports: role === "admin",

      // Lecturer permissions
      canViewOwnSchedule: ["admin", "lecturer", "student"].includes(role),
      canCreateOwnSchedule: ["admin", "lecturer"].includes(role),
      canModifyOwnSchedule: ["admin", "lecturer"].includes(role),
      canCancelOwnSchedule: ["admin", "lecturer"].includes(role),
      canRequestRoom: ["admin", "lecturer"].includes(role),
      canRequestTimeOff: ["admin", "lecturer"].includes(role),
      canViewStudentSchedules: ["admin", "lecturer"].includes(role),
      canNotifyStudents: ["admin", "lecturer"].includes(role),

      // Student permissions
      canRegisterForClasses: ["admin", "student"].includes(role),
      canRequestStudyRoom: ["admin", "student"].includes(role),

      // General permissions
      canViewCampusEvents: true,
      canAccessAcademicCalendar: true,
    };
  }, [user?.role]);

  // Refs for focus management
  const lastFocusedElement = React.useRef();
  const dialogTitleRef = React.useRef();
  const notesTitleRef = React.useRef();
  const attendeesTitleRef = React.useRef();

  // Define event colors based on type and role
  const eventColors = useMemo(
    () => ({
      class: "#4CAF50", // Green
      lecture: "#2196F3", // Blue
      exam: "#F44336", // Red
      workshop: "#9C27B0", // Purple
      meeting: "#FF9800", // Orange
      office_hours: "#607D8B", // Blue Grey
      event: "#3F51B5", // Indigo
      study_group: "#8BC34A", // Light Green
      reservation: "#795548", // Brown
      other: "#9E9E9E", // Grey
    }),
    []
  );

  // Color events based on type, creator, and status
  const getEventColor = useCallback(
    (event) => {
      // Cancelled events are grey
      if (event.extendedProps?.status === "cancelled") {
        return "#9E9E9E";
      }

      // Color based on event type
      const type = event.extendedProps?.type || "other";
      const baseColor = eventColors[type] || "#9E9E9E";

      // Admin events are darker
      if (
        event.extendedProps?.createdBy &&
        event.extendedProps?.creatorRole === "admin"
      ) {
        return adjustColor(baseColor, -20); // Darken
      }

      // Events created by the current user are bolder
      if (event.extendedProps?.createdBy === user?.id) {
        return baseColor;
      }

      // Events the user is registered for have a slight opacity change
      if (event.extendedProps?.attendees?.some((a) => a.id === user?.id)) {
        return baseColor;
      }

      // Other events have less saturation
      return adjustColor(baseColor, 0, -15); // Less saturation
    },
    [eventColors, user?.id]
  );

  // Helper function to adjust color brightness
  const adjustColor = (color, brightness = 0, saturation = 0) => {
    // Convert hex to RGB
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);

    // Convert RGB to HSL
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // Achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
        default:
          h = 0;
      }

      h /= 6;
    }

    // Adjust brightness and saturation
    l = Math.max(0, Math.min(1, l + brightness / 100));
    s = Math.max(0, Math.min(1, s + saturation / 100));

    // Convert back to RGB
    let r2, g2, b2;

    if (s === 0) {
      r2 = g2 = b2 = l; // Achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r2 = hue2rgb(p, q, h + 1 / 3);
      g2 = hue2rgb(p, q, h);
      b2 = hue2rgb(p, q, h - 1 / 3);
    }

    // Convert to hex
    const toHex = (x) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
  };

  // Effect to handle refreshing events when an event is created in the Events page
  useEffect(() => {
    if (refreshNeeded && refreshParams) {
      // Load events with the refresh parameters
      loadEvents(refreshParams);

      // Reset the refresh flag
      dispatch({ type: "schedule/reset" });
    }
  }, [refreshNeeded, refreshParams, dispatch, loadEvents]);

  const handleDateSelect = (selectInfo) => {
    // Do nothing when a date is clicked - this removes the "Create New Event" functionality
    // Just deselect the date to avoid visual selection indicators
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo) => {
    const event = events.find((e) => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
      setFormData({
        title: event.title,
        description: event.description,
        startDate: new Date(event.start),
        endDate: new Date(event.end),
        location: event.location,
        type: event.type,
        color: event.color,
        targetAudience: event.extendedProps?.targetAudience || "All",
      });
      setOpenDialog(true);
    }

    // Set editMode based on user role instead of using schedulePermissions
    const isCreator = event?.extendedProps?.createdBy === user?.id;
    const role = user?.role || "student";
    const canModifyAny = role === "admin";
    const canModifyOwn = ["admin", "lecturer"].includes(role);

    if (canModifyAny || (canModifyOwn && isCreator)) {
      setEditMode(true);
    } else {
      setEditMode(false);
    }
  };

  // Focus management handlers
  const handleDialogOpen = () => {
    lastFocusedElement.current = document.activeElement;
    setOpenDialog(true);
    setTimeout(() => {
      dialogTitleRef.current?.focus();
    }, 0);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    lastFocusedElement.current?.focus();
    setSelectedEvent(null);
    setFormData({
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(),
      location: "",
      type: "other",
      color: "#3788d8",
    });
  };

  const handleSubmit = async () => {
    try {
      // Validate form data
      if (!formData.title) {
        toast.error("Title is required");
        return;
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location,
        type: formData.type,
        color: formData.color,
        status: formData.status || "scheduled",
        targetAudience: formData.targetAudience || "All",
        notificationPreferences: notificationPreferences,
      };

      // Check for scheduling conflicts first
      const conflictResult = await handleCheckConflicts(eventData);
      if (conflictResult.hasConflicts) {
        if (
          window.confirm(
            "There are scheduling conflicts. Do you want to proceed anyway?"
          )
        ) {
          // Proceed with conflicts
        } else {
          return; // User chose not to proceed with conflicts
        }
      }

      let result;
      if (selectedEvent) {
        // Check if user has permission to update this event
        const isCreator = selectedEvent.extendedProps?.createdBy === user?.id;
        const role = user?.role || "student";
        const canModifyAny = role === "admin";
        const canModifyOwn = ["admin", "lecturer"].includes(role);
        
        if (!canModifyAny && !(canModifyOwn && isCreator)) {
          toast.error("You don't have permission to modify this event");
          return;
        }

        // Update existing event
        result = await dispatch(
          updateSchedule({
            id: selectedEvent.id,
            ...eventData,
          })
        ).unwrap();
        toast.success("Event updated successfully");
      } else {
        // Creating a new event
        const role = user?.role || "student";
        const canCreateAny = role === "admin";
        const canCreateOwn = ["admin", "lecturer"].includes(role);
        
        if (!canCreateAny && !canCreateOwn) {
          toast.error("You don't have permission to create new events");
          return;
        }

        // Create new event
        result = await dispatch(createSchedule(eventData)).unwrap();
        toast.success("Event created successfully");
      }

      handleDialogClose();
      return result;
    } catch (error) {
      toast.error(error.message || "Failed to save event");
    }
  };

  const handleDelete = async () => {
    try {
      if (!selectedEvent) return;

      // Check if user has permission to delete this event
      const isCreator = selectedEvent.extendedProps?.createdBy === user?.id;
      const role = user?.role || "student";
      const canDeleteAny = role === "admin";
      const canDeleteOwn = ["admin", "lecturer"].includes(role);
      
      if (!canDeleteAny && !(canDeleteOwn && isCreator)) {
        toast.error("You don't have permission to delete this event");
        return;
      }

      // Ask for confirmation before deleting
      if (window.confirm("Are you sure you want to delete this event?")) {
        await dispatch(deleteSchedule(selectedEvent.id)).unwrap();
        toast.success("Event deleted successfully");
        handleDialogClose();
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete event");
    }
  };

  const handleRefresh = () => {
    const calendarApi = document.querySelector(".fc").getApi();
    loadEvents({
      startStr: calendarApi.view.activeStart.toISOString(),
      endStr: calendarApi.view.activeEnd.toISOString(),
    });
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleNotificationPreferenceChange = async (type, value) => {
    if (!selectedEvent) return;

    try {
      const updatedPreferences = {
        ...notificationPreferences,
        [type]: value,
      };

      await dispatch(
        updateSchedule({
          id: selectedEvent.id,
          attendees: selectedEvent.attendees.map((attendee) =>
            attendee.user._id === user._id
              ? {
                  ...attendee,
                  notificationPreferences: updatedPreferences,
                }
              : attendee
          ),
        })
      ).unwrap();

      setNotificationPreferences(updatedPreferences);
      toast.success("Notification preferences updated");
    } catch (error) {
      toast.error("Failed to update notification preferences");
    }
  };

  const handleAddNote = async () => {
    if (!selectedEvent || !selectedNote.trim()) return;

    try {
      await dispatch(
        updateSchedule({
          id: selectedEvent.id,
          notes: [
            ...(selectedEvent.notes || []),
            {
              content: selectedNote,
              user: user._id,
            },
          ],
        })
      ).unwrap();

      setSelectedNote("");
      setNotesDialogOpen(false);
      toast.success("Note added successfully");
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  const handleAttendeeStatusChange = async (attendeeId, status) => {
    try {
      await dispatch(
        updateAttendanceStatus({
          scheduleId: selectedEvent.id,
          attendeeId,
          status,
        })
      ).unwrap();
      toast.success("Attendance status updated");
    } catch (error) {
      toast.error("Failed to update attendance status");
    }
  };

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Type filter
      if (
        filters.eventTypes.length > 0 &&
        !filters.eventTypes.includes(event.type)
      ) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(event.status)) {
        return false;
      }

      // Department filter (for admins)
      if (filters.department && event.department !== filters.department) {
        return false;
      }

      // Show only my events filter
      if (filters.showMyEvents && event.extendedProps?.createdBy !== user?.id) {
        return false;
      }

      // Role-based filtering
      if (event.extendedProps?.targetAudience) {
        const targetAudience = event.extendedProps.targetAudience;
        if (
          targetAudience !== "All" &&
          ((user?.role === "student" && targetAudience !== "Students") ||
            (user?.role === "lecturer" && targetAudience !== "Lecturers"))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [events, filters, user?.id, user?.role]);

  // Format events with proper styling based on type and status
  const formattedEvents = useMemo(() => {
    return filteredEvents.map((event) => ({
      ...event,
      backgroundColor: getEventColor(event),
      classNames: [
        `event-type-${event.type}`,
        `event-status-${event.status || "scheduled"}`,
        event.extendedProps?.createdBy === user?.id ? "event-own" : "",
        event.extendedProps?.attendees?.some((a) => a.id === user?.id)
          ? "event-attending"
          : "",
        `audience-${
          event.extendedProps?.targetAudience?.toLowerCase() || "all"
        }`,
      ].filter(Boolean),
    }));
  }, [filteredEvents, user?.id]);

  const handleBulkEdit = async (updates) => {
    try {
      await dispatch(
        bulkUpdateSchedules({
          eventIds: selectedEvents.map((e) => e.id),
          updates,
        })
      ).unwrap();
      toast.success("Events updated successfully");
      setSelectedEvents([]);
      setBulkEditMode(false);
      handleRefresh();
    } catch (error) {
      toast.error("Failed to update events");
    }
  };

  const handleCheckConflicts = async (eventData) => {
    try {
      const result = await dispatch(
        checkConflicts({
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          location: eventData.location,
          resources: eventData.resources,
          excludeId: selectedEvent?.id,
        })
      ).unwrap();

      setConflicts(result.data);
      if (result.data.length > 0) {
        toast.warning("Scheduling conflicts detected!");
        return { hasConflicts: true, conflicts: result.data };
      }
      return { hasConflicts: false, conflicts: [] };
    } catch (error) {
      toast.error("Failed to check conflicts");
      return { hasConflicts: false, conflicts: [] };
    }
  };

  const handleGenerateReport = async () => {
    if (user?.role !== "admin") {
      toast.error("You don't have permission to generate reports");
      return;
    }

    try {
      const result = await dispatch(
        generateReport({
          type: reportOptions.type,
          format: reportOptions.format,
          startDate: new Date().toISOString(),
          endDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // 30 days from now
        })
      ).unwrap();

      // Download the report if available
      if (result.data?.reportUrl) {
        const link = document.createElement("a");
        link.href = result.data.reportUrl;
        link.download = `schedule-report-${new Date()
          .toISOString()
          .slice(0, 10)}.${reportOptions.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success("Report generated successfully");
      setReportDialogOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to generate report");
    }
  };

  const handleRegisterForClass = async (eventId) => {
    if (!["admin", "student"].includes(user?.role)) {
      toast.error("You don't have permission to register for classes");
      return;
    }

    try {
      // Assuming there's an API endpoint for class registration
      await dispatch(
        updateSchedule({
          id: eventId,
          action: "register",
          studentId: user?.id,
        })
      ).unwrap();

      toast.success("Successfully registered for this class");
      handleRefresh();
    } catch (error) {
      toast.error(error.message || "Failed to register for class");
    }
  };

  const renderStudentActions = () => {
    if (!selectedEvent || !["admin", "student"].includes(user?.role)) {
      return null;
    }

    // Only show registration button for class/lecture/workshop events
    const eventType = selectedEvent.extendedProps?.type;
    const registrableTypes = ["class", "lecture", "workshop", "exam"];

    if (!registrableTypes.includes(eventType)) {
      return null;
    }

    // Check if student is already registered (would come from event.extendedProps.attendees)
    const isRegistered = selectedEvent.extendedProps?.attendees?.some(
      (attendee) => attendee.id === user?.id
    );

    return (
      <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
        <Button
          variant={isRegistered ? "outlined" : "contained"}
          color={isRegistered ? "secondary" : "primary"}
          onClick={() => handleRegisterForClass(selectedEvent.id)}
          disabled={isRegistered}
        >
          {isRegistered ? "Already Registered" : "Register for this Class"}
        </Button>
      </Box>
    );
  };

  const handleNotifyStudents = async (eventId, message) => {
    if (!["admin", "lecturer"].includes(user?.role)) {
      toast.error("You don't have permission to notify students");
      return;
    }

    try {
      // Assuming there's an API endpoint for sending notifications
      await dispatch(
        updateSchedule({
          id: eventId,
          action: "notify",
          message: message,
        })
      ).unwrap();

      toast.success("Notification sent to all registered students");
    } catch (error) {
      toast.error(error.message || "Failed to send notification");
    }
  };

  const renderLecturerActions = () => {
    if (!selectedEvent || !["admin", "lecturer"].includes(user?.role)) {
      return null;
    }

    // Only show actions if this is lecturer's own event
    const isCreator = selectedEvent.extendedProps?.createdBy === user?.id;
    const canModifyAny = user?.role === "admin";
    if (!isCreator && !canModifyAny) {
      return null;
    }

    // Only show roster for class/lecture type events
    const canViewRoster = ["class", "lecture", "workshop", "exam"].includes(
      selectedEvent.extendedProps?.type
    );

    return (
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setNotifyDialogOpen(true)}
              fullWidth
            >
              Notify Students
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                // Update event status to cancelled but don't delete it
                dispatch(
                  updateSchedule({
                    id: selectedEvent.id,
                    status: "cancelled",
                  })
                )
                  .unwrap()
                  .then(() => {
                    toast.success("Class cancelled successfully");
                    handleDialogClose();
                  })
                  .catch((error) => {
                    toast.error(error.message || "Failed to cancel class");
                  });
              }}
              fullWidth
            >
              Cancel Class
            </Button>
          </Grid>

          {canViewRoster && (
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setRosterDialogOpen(true)}
                fullWidth
                startIcon={<PeopleIcon />}
              >
                View Class Roster
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  // Notification dialog
  const renderNotifyDialog = () => {
    return (
      <Dialog
        open={notifyDialogOpen}
        onClose={() => setNotifyDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Notify Registered Students</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Notification Message"
            multiline
            rows={4}
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            placeholder="Enter your notification message here..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotifyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (!notificationMessage.trim()) {
                toast.error("Please enter a notification message");
                return;
              }

              handleNotifyStudents(selectedEvent.id, notificationMessage);
              setNotifyDialogOpen(false);
              setNotificationMessage("");
            }}
            color="primary"
            variant="contained"
          >
            Send Notification
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Report dialog
  const renderReportDialog = () => {
    return (
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Generate Schedule Report</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportOptions.type}
                  onChange={(e) =>
                    setReportOptions({ ...reportOptions, type: e.target.value })
                  }
                >
                  <MenuItem value="utilization">Room Utilization</MenuItem>
                  <MenuItem value="class_schedule">Class Schedule</MenuItem>
                  <MenuItem value="lecturer_schedule">
                    Lecturer Schedule
                  </MenuItem>
                  <MenuItem value="event_summary">Event Summary</MenuItem>
                  <MenuItem value="conflicts">Scheduling Conflicts</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Report Format</InputLabel>
                <Select
                  value={reportOptions.format}
                  onChange={(e) =>
                    setReportOptions({
                      ...reportOptions,
                      format: e.target.value,
                    })
                  }
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleGenerateReport}
            color="primary"
            variant="contained"
          >
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Add roster view for lecturers to see enrolled students
  const renderRosterDialog = () => {
    if (!selectedEvent) return null;

    // Mock data - would come from API based on selected event
    const mockStudents = [
      {
        id: 1,
        name: "John Smith",
        status: "present",
        email: "john.smith@example.com",
      },
      {
        id: 2,
        name: "Jane Doe",
        status: "absent",
        email: "jane.doe@example.com",
      },
      {
        id: 3,
        name: "Alice Johnson",
        status: "present",
        email: "alice.johnson@example.com",
      },
      {
        id: 4,
        name: "Bob Brown",
        status: "excused",
        email: "bob.brown@example.com",
      },
      {
        id: 5,
        name: "Emma Wilson",
        status: "present",
        email: "emma.wilson@example.com",
      },
    ];

    return (
      <Dialog
        open={rosterDialogOpen}
        onClose={() => setRosterDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Class Roster: {selectedEvent?.title}</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">
              {format(new Date(selectedEvent.start), "EEEE, MMMM d, yyyy")} at{" "}
              {format(new Date(selectedEvent.start), "h:mm a")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Location: {selectedEvent.location || "Not specified"}
            </Typography>
          </Box>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Attendance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={student.status}
                        color={
                          student.status === "present"
                            ? "success"
                            : student.status === "absent"
                            ? "error"
                            : "warning"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={student.status}
                        size="small"
                        onChange={(e) => {
                          // Would update attendance status via API
                          console.log(
                            `Updating student ${student.id} status to ${e.target.value}`
                          );
                          toast.success(
                            `Updated ${student.name}'s attendance status`
                          );
                        }}
                      >
                        <MenuItem value="present">Present</MenuItem>
                        <MenuItem value="absent">Absent</MenuItem>
                        <MenuItem value="excused">Excused</MenuItem>
                        <MenuItem value="late">Late</MenuItem>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRosterDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // Would save attendance via API
              toast.success("Attendance record saved");
              setRosterDialogOpen(false);
            }}
          >
            Save Attendance
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Add departments list (for admins to filter by)
  const departments = useMemo(
    () => [
      "School of Engineering",
      "School of Business",
      "School of Science",
      "School of Humanities",
      "School of Medicine",
      "School of Law",
      "Administration",
    ],
    []
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      eventTypes: [],
      status: [],
      department: user?.role === "admin" ? "" : user?.mainDepartment || "",
      showMyEvents: false,
    });
    setFilterDrawerOpen(false);
  }, [user?.role, user?.mainDepartment]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h5">Schedule Management</Typography>
          <Box>
            {/* Admin-specific actions */}
            {user?.role === "admin" && (
              <Button
                variant="outlined"
                startIcon={<AssessmentIcon />}
                onClick={() => setReportDialogOpen(true)}
                sx={{ mr: 1 }}
              >
                Generate Reports
              </Button>
            )}

            {/* Admin and Lecturer actions */}
            {(user?.role === "admin" || ["admin", "lecturer"].includes(user?.role)) && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedEvent(null);
                  setFormData({
                    title: "",
                    description: "",
                    startDate: new Date(),
                    endDate: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour later
                    location: "",
                    type: "class",
                    color: "#3788d8",
                  });
                  handleDialogOpen();
                }}
                sx={{ mr: 1 }}
              >
                {user?.role === "admin"
                  ? "Create Schedule"
                  : "Request Class Schedule"}
              </Button>
            )}

            {/* Room reservation for lecturers and students */}
            {(["admin", "lecturer"].includes(user?.role) || ["admin", "student"].includes(user?.role)) && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<EventIcon />}
                onClick={() => {
                  setSelectedEvent(null);
                  setFormData({
                    title: "Room Reservation",
                    description: "",
                    startDate: new Date(),
                    endDate: new Date(new Date().getTime() + 60 * 60 * 1000),
                    location: "",
                    type: "reservation",
                    color: "#f5b041",
                  });
                  handleDialogOpen();
                }}
                sx={{ mr: 1 }}
              >
                Reserve Room
              </Button>
            )}

            {/* Universal refresh button */}
            <IconButton onClick={handleRefresh} color="primary" sx={{ ml: 1 }}>
              <RefreshIcon />
            </IconButton>

            {/* Filter button */}
            <IconButton
              onClick={() => setFilterDrawerOpen(true)}
              color="primary"
            >
              <FilterIcon />
            </IconButton>
          </Box>
        </Box>

        <Box mb={2}>
          <Tabs
            value={view}
            onChange={(e, newValue) => handleViewChange(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<ViewModule />} label="Month" value="dayGridMonth" />
            <Tab icon={<ViewWeek />} label="Week" value="timeGridWeek" />
            <Tab icon={<ViewDay />} label="Day" value="timeGridDay" />
            <Tab icon={<ViewList />} label="List" value="listWeek" />
          </Tabs>
        </Box>

        {/* Active Filter Chips */}
        {(filters.eventTypes.length > 0 ||
          filters.status.length > 0 ||
          filters.department ||
          filters.showMyEvents) && (
          <Box sx={{ px: 2, py: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
            {filters.eventTypes.map((type) => (
              <Chip
                key={type}
                label={`${
                  type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")
                }`}
                onDelete={() => {
                  setFilters((prev) => ({
                    ...prev,
                    eventTypes: prev.eventTypes.filter((t) => t !== type),
                  }));
                }}
                sx={{ bgcolor: eventColors[type], color: "white" }}
              />
            ))}
            {filters.status.map((status) => (
              <Chip
                key={status}
                label={`${status.charAt(0).toUpperCase() + status.slice(1)}`}
                onDelete={() => {
                  setFilters((prev) => ({
                    ...prev,
                    status: prev.status.filter((s) => s !== status),
                  }));
                }}
              />
            ))}
            {filters.department && (
              <Chip
                label={`Department: ${filters.department}`}
                onDelete={() => {
                  setFilters((prev) => ({
                    ...prev,
                    department: "",
                  }));
                }}
              />
            )}
            {filters.showMyEvents && (
              <Chip
                label="My Events Only"
                onDelete={() => {
                  setFilters((prev) => ({
                    ...prev,
                    showMyEvents: false,
                  }));
                }}
              />
            )}
            <Chip
              label="Clear All"
              onClick={() => {
                setFilters({
                  eventTypes: [],
                  status: [],
                  department:
                    user?.role === "admin" ? "" : user?.mainDepartment || "",
                  showMyEvents: false,
                });
              }}
              color="primary"
              variant="outlined"
            />
          </Box>
        )}

        <Box sx={{ height: "calc(100vh - 250px)", position: "relative" }}>
          {isLoading && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                zIndex: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <FullCalendar
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              listPlugin,
            ]}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
            initialView={view}
            editable={
              user?.role === "admin" || // canModifyAnySchedule
              (["admin", "lecturer"].includes(user?.role)) // canModifyOwnSchedule
            }
            selectable={
              user?.role === "admin" || // canCreateAnySchedule
              (["admin", "lecturer"].includes(user?.role)) // canCreateOwnSchedule
            }
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            events={formattedEvents}
            eventColor={(eventInfo) => getEventColor(eventInfo)}
            eventDidMount={(info) => {
              // Add data attribute for CSS targeting based on source
              if (info.event.extendedProps.source) {
                info.el.setAttribute('data-source', info.event.extendedProps.source);
              }
              
              // Add tooltips to events
              const tooltip = document.createElement("div");
              tooltip.className = "event-tooltip";
              tooltip.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 4px;">${
                  info.event.title
                }</div>
                <div style="margin-bottom: 2px;">${
                  info.event.extendedProps.type
                    ? `Type: ${
                        info.event.extendedProps.type.charAt(0).toUpperCase() +
                        info.event.extendedProps.type.slice(1).replace("_", " ")
                      }`
                    : ""
                }</div>
                <div style="margin-bottom: 2px;">${
                  info.event.start
                    ? `Start: ${format(
                        info.event.start,
                        "MMM dd, yyyy h:mm a"
                      )}`
                    : ""
                }</div>
                <div style="margin-bottom: 2px;">${
                  info.event.end
                    ? `End: ${format(info.event.end, "MMM dd, yyyy h:mm a")}`
                    : ""
                }</div>
                ${
                  info.event.extendedProps.location || info.event.extendedProps.venue
                    ? `<div style="margin-bottom: 2px;">Location: ${info.event.extendedProps.location || info.event.extendedProps.venue}</div>`
                    : ""
                }
                ${
                  info.event.extendedProps.department
                    ? `<div style="margin-bottom: 2px;">Department: ${info.event.extendedProps.department}</div>`
                    : ""
                }
                ${
                  info.event.extendedProps.status
                    ? `<div style="margin-bottom: 2px;">Status: ${
                        info.event.extendedProps.status
                          .charAt(0)
                          .toUpperCase() +
                        info.event.extendedProps.status.slice(1)
                      }</div>`
                    : ""
                }
                ${
                  info.event.extendedProps.targetAudience
                    ? `<div style="margin-bottom: 2px;">Audience: ${info.event.extendedProps.targetAudience}</div>`
                    : ""
                }
                ${
                  info.event.extendedProps.source === "eventpage" && info.event.extendedProps.eventType
                    ? `<div style="margin-bottom: 2px;">Event Type: ${info.event.extendedProps.eventType}</div>`
                    : ""
                }
                ${
                  info.event.extendedProps.createdBy
                    ? `<div style="margin-bottom: 2px;">Created by: ${
                        info.event.extendedProps.creatorName ||
                        info.event.extendedProps.createdBy
                      }</div>`
                    : ""
                }
                ${
                  info.event.extendedProps.attendees?.length > 0
                    ? `<div>Attendees: ${info.event.extendedProps.attendees.length}</div>`
                    : ""
                }
              `;

              // Add hover effect
              const handleMouseEnter = () => {
                tooltip.style.display = "block";
                document.body.appendChild(tooltip);

                const rect = info.el.getBoundingClientRect();
                tooltip.style.position = "absolute";
                tooltip.style.zIndex = 10000;
                tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
                tooltip.style.left = `${rect.left + window.scrollX}px`;
                tooltip.style.backgroundColor = "white";
                tooltip.style.border = "1px solid #ccc";
                tooltip.style.padding = "8px";
                tooltip.style.borderRadius = "4px";
                tooltip.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
                tooltip.style.maxWidth = "300px";
                tooltip.style.fontSize = "12px";
              };

              const handleMouseLeave = () => {
                if (document.body.contains(tooltip)) {
                  document.body.removeChild(tooltip);
                }
              };

              info.el.addEventListener("mouseenter", handleMouseEnter);
              info.el.addEventListener("mouseleave", handleMouseLeave);
            }}
            eventContent={(eventInfo) => {
              // Check if this is an event from the event system
              const isEventPage = eventInfo.event.extendedProps.source === "eventpage";
              
              return {
                html: `
                  <div class="fc-event-main-content" style="${isEventPage ? 'padding: 2px; text-align: center;' : ''}">
                    <div class="fc-event-title" style="${isEventPage ? 'font-weight: bold; text-transform: uppercase;' : ''}">
                      ${eventInfo.event.title}
                      ${
                        eventInfo.event.extendedProps.status === "cancelled"
                          ? " (Cancelled)"
                          : ""
                      }
                    </div>
                    ${
                      eventInfo.event.extendedProps.location
                        ? `
                      <div class="fc-event-location">
                        <small>📍 ${eventInfo.event.extendedProps.location || eventInfo.event.extendedProps.venue || ''}</small>
                      </div>
                    `
                        : ""
                    }
                    ${
                      user?.role === "admin" && !isEventPage
                        ? `<div class="fc-event-creator">
                        <small>👤 ${
                          eventInfo.event.extendedProps.createdBy || "System"
                        }</small>
                      </div>`
                        : ""
                    }
                  </div>
                `,
              }
            }}
            eventClick={handleEventClick}
            select={handleDateSelect}
            datesSet={loadEvents}
            eventDrop={(info) => {
              // Handle event drag-and-drop (reschedule)
              const role = user?.role || "student";
              const canModifyAny = role === "admin";
              const canModifyOwn = ["admin", "lecturer"].includes(role);
              const isCreator = info.event.extendedProps.createdBy === user?.id;
              
              if (!canModifyAny && !(canModifyOwn && isCreator)) {
                info.revert();
                toast.error("You don't have permission to reschedule this event");
                return;
              }

              // Update the event with new dates
              const updatedEvent = {
                id: info.event.id,
                startDate: info.event.start,
                endDate: info.event.end || info.event.start,
              };

              // Confirm the change with the user
              if (window.confirm("Are you sure you want to reschedule this event?")) {
                dispatch(updateSchedule(updatedEvent))
                  .unwrap()
                  .then(() => {
                    toast.success("Event rescheduled successfully");
                  })
                  .catch((error) => {
                    info.revert();
                    toast.error("Failed to reschedule event: " + error.message);
                  });
              } else {
                info.revert();
              }
            }}
            eventSelect={(info) => {
              if (bulkEditMode) {
                setSelectedEvents((prev) => {
                  const eventId = info.event.id;
                  if (prev.includes(eventId)) {
                    return prev.filter((id) => id !== eventId);
                  }
                  return [...prev, eventId];
                });
              }
            }}
            eventClassNames={(arg) =>
              [
                `event-type-${arg.event.extendedProps.type || "other"}`,
                selectedEvents.includes(arg.event.id) && "selected-event",
                arg.event.extendedProps.createdBy === user?.id && "own-event",
              ].filter(Boolean)
            }
          />
        </Box>

        {/* Filter Drawer */}
        <Drawer
          anchor="right"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          ModalProps={{
            keepMounted: false,
            disablePortal: false,
          }}
          PaperProps={{
            sx: { width: 320, p: 2 },
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6">Filter Options</Typography>
            <Divider sx={{ my: 1 }} />
          </Box>

          {/* Event Type Filter */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Event Type</InputLabel>
            <Select
              multiple
              value={filters.eventTypes}
              onChange={(e) => handleFilterChange("eventTypes", e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 240,
                  },
                },
              }}
            >
              <MenuItem value="class">Class</MenuItem>
              <MenuItem value="lecture">Lecture</MenuItem>
              <MenuItem value="exam">Exam</MenuItem>
              <MenuItem value="workshop">Workshop</MenuItem>
              <MenuItem value="meeting">Meeting</MenuItem>
              <MenuItem value="office_hours">Office Hours</MenuItem>
              <MenuItem value="event">Campus Event</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          {/* Status Filter */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              multiple
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={value}
                      size="small"
                      color={
                        value === "cancelled"
                          ? "error"
                          : value === "scheduled"
                          ? "success"
                          : "default"
                      }
                    />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>

          {/* Department Filter - Only for Admins */}
          {user?.role === "admin" && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                onChange={(e) =>
                  handleFilterChange("department", e.target.value)
                }
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Show only my events option */}
          <FormControlLabel
            control={
              <Switch
                checked={filters.showMyEvents}
                onChange={(e) =>
                  handleFilterChange("showMyEvents", e.target.checked)
                }
              />
            }
            label="Show only my events"
            sx={{ mt: 2 }}
          />

          {/* Filter Chips */}
          <Box sx={{ p: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
            {filters.eventTypes.map((type) => (
              <Chip
                key={type}
                label={`${
                  type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")
                }`}
                onDelete={() => {
                  setFilters((prev) => ({
                    ...prev,
                    eventTypes: prev.eventTypes.filter((t) => t !== type),
                  }));
                }}
                sx={{ bgcolor: eventColors[type], color: "white" }}
              />
            ))}
            {filters.status.map((status) => (
              <Chip
                key={status}
                label={`${status.charAt(0).toUpperCase() + status.slice(1)}`}
                onDelete={() => {
                  setFilters((prev) => ({
                    ...prev,
                    status: prev.status.filter((s) => s !== status),
                  }));
                }}
              />
            ))}
            {filters.department && (
              <Chip
                label={`Department: ${filters.department}`}
                onDelete={() => {
                  setFilters((prev) => ({
                    ...prev,
                    department: "",
                  }));
                }}
              />
            )}
            {filters.showMyEvents && (
              <Chip
                label="My Events Only"
                onDelete={() => {
                  setFilters((prev) => ({
                    ...prev,
                    showMyEvents: false,
                  }));
                }}
              />
            )}
            {(filters.eventTypes.length > 0 ||
              filters.status.length > 0 ||
              filters.department ||
              filters.showMyEvents) && (
              <Chip
                label="Clear All"
                onClick={resetFilters}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </Drawer>

        {/* Event Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleDialogClose}
          maxWidth="md"
          fullWidth
          aria-labelledby="event-dialog-title"
          keepMounted={false}
          disablePortal={false}
        >
          <DialogTitle
            id="event-dialog-title"
            ref={dialogTitleRef}
            tabIndex={-1}
          >
            {selectedEvent
              ? editMode
                ? "Edit Event"
                : "View Event"
              : "Create New Event"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  disabled={selectedEvent && !editMode}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  multiline
                  rows={3}
                  required
                  disabled={selectedEvent && !editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  disabled={selectedEvent && !editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Event Type</InputLabel>
                  <Select
                    name="type"
                    value={formData.type || "other"}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    disabled={selectedEvent && !editMode}
                  >
                    {/* Admin can create any type of events */}
                    {user?.role === "admin" && (
                      <>
                        <MenuItem value="class">Class</MenuItem>
                        <MenuItem value="lecture">Lecture</MenuItem>
                        <MenuItem value="exam">Exam</MenuItem>
                        <MenuItem value="workshop">Workshop</MenuItem>
                        <MenuItem value="meeting">Meeting</MenuItem>
                        <MenuItem value="office_hours">Office Hours</MenuItem>
                        <MenuItem value="event">Campus Event</MenuItem>
                        <MenuItem value="maintenance">Maintenance</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </>
                    )}

                    {/* Lecturers can create their classes, office hours, etc. */}
                    {user?.role !== "admin" && ["admin", "lecturer"].includes(user?.role) && (
                      <>
                        <MenuItem value="class">Class</MenuItem>
                        <MenuItem value="office_hours">Office Hours</MenuItem>
                        <MenuItem value="meeting">Meeting</MenuItem>
                        <MenuItem value="consultation">
                          Student Consultation
                        </MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </>
                    )}

                    {/* Students can only create study sessions or request rooms */}
                    {user?.role !== "admin" && !["admin", "lecturer"].includes(user?.role) && ["admin", "student"].includes(user?.role) && (
                      <>
                        <MenuItem value="study_group">Study Group</MenuItem>
                        <MenuItem value="reservation">
                          Room Reservation
                        </MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Target Audience</InputLabel>
                  <Select
                    name="targetAudience"
                    value={formData.targetAudience || "All"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetAudience: e.target.value,
                      })
                    }
                    disabled={selectedEvent && !editMode}
                  >
                    <MenuItem value="All">Everyone</MenuItem>
                    <MenuItem value="Students">Students Only</MenuItem>
                    <MenuItem value="Lecturers">Lecturers Only</MenuItem>
                  </Select>
                  <FormHelperText>
                    Controls who can see this event in their calendar
                  </FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={
                    formData.startDate instanceof Date &&
                    !isNaN(formData.startDate)
                      ? new Date(
                          formData.startDate.getTime() -
                            formData.startDate.getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      try {
                        setFormData({
                          ...formData,
                          startDate: new Date(e.target.value),
                        });
                      } catch (error) {
                        console.error("Invalid date format:", error);
                      }
                    }
                  }}
                  disabled={selectedEvent && !editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={
                    formData.endDate instanceof Date && !isNaN(formData.endDate)
                      ? new Date(
                          formData.endDate.getTime() -
                            formData.endDate.getTimezoneOffset() * 60000
                        )
                          .toISOString()
                          .slice(0, 16)
                      : ""
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      try {
                        setFormData({
                          ...formData,
                          endDate: new Date(e.target.value),
                        });
                      } catch (error) {
                        console.error("Invalid date format:", error);
                      }
                    }
                  }}
                  disabled={selectedEvent && !editMode}
                />
              </Grid>
              {["admin", "lecturer"].includes(user?.role) && (
                <>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={formData.status || "scheduled"}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        label="Status"
                      >
                        <MenuItem value="scheduled">Scheduled</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="rescheduled">Rescheduled</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isRecurring || false}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isRecurring: e.target.checked,
                            })
                          }
                        />
                      }
                      label="Recurring Event"
                    />
                  </Grid>
                  {formData.isRecurring && (
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Frequency</InputLabel>
                        <Select
                          value={formData.recurrence?.frequency || "none"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              recurrence: {
                                ...formData.recurrence,
                                frequency: e.target.value,
                              },
                            })
                          }
                          label="Frequency"
                        >
                          <MenuItem value="daily">Daily</MenuItem>
                          <MenuItem value="weekly">Weekly</MenuItem>
                          <MenuItem value="monthly">Monthly</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </>
              )}
              <Grid item xs={12}>
                <Box className="notification-preferences">
                  <Typography variant="subtitle1" gutterBottom>
                    Notification Preferences
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationPreferences.email}
                        onChange={(e) =>
                          handleNotificationPreferenceChange(
                            "email",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Email Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationPreferences.inApp}
                        onChange={(e) =>
                          handleNotificationPreferenceChange(
                            "inApp",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="In-App Notifications"
                  />
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Reminder Time</InputLabel>
                    <Select
                      value={notificationPreferences.reminderTime}
                      onChange={(e) =>
                        handleNotificationPreferenceChange(
                          "reminderTime",
                          e.target.value
                        )
                      }
                      label="Reminder Time"
                    >
                      <MenuItem value={5}>5 minutes before</MenuItem>
                      <MenuItem value={15}>15 minutes before</MenuItem>
                      <MenuItem value={30}>30 minutes before</MenuItem>
                      <MenuItem value={60}>1 hour before</MenuItem>
                      <MenuItem value={1440}>1 day before</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            {selectedEvent && (
              <>
                <Button
                  startIcon={<NotesIcon />}
                  onClick={() => setNotesDialogOpen(true)}
                >
                  Notes
                </Button>
                <Button
                  startIcon={<GroupIcon />}
                  onClick={() => setAttendeesDialogOpen(true)}
                >
                  Attendees
                </Button>
                {renderStudentActions()}
                {renderLecturerActions()}
                {editMode && (
                  <Button onClick={handleDelete} color="error">
                    Delete
                  </Button>
                )}
              </>
            )}
            <Button onClick={handleDialogClose}>Cancel</Button>
            {(editMode || !selectedEvent) && (
              <Button
                onClick={handleSubmit}
                variant="contained"
                color="primary"
              >
                {selectedEvent ? "Update" : "Create"}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Notes Dialog */}
        <Dialog
          open={notesDialogOpen}
          onClose={() => setNotesDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          aria-labelledby="notes-dialog-title"
          keepMounted={false}
          disablePortal={false}
        >
          <DialogTitle
            id="notes-dialog-title"
            ref={notesTitleRef}
            tabIndex={-1}
          >
            Event Notes
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              {selectedEvent?.notes?.map((note, index) => (
                <Box
                  key={index}
                  sx={{ mb: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}
                >
                  <Typography variant="body2" color="textSecondary">
                    {format(new Date(note.createdAt), "PPpp")}
                  </Typography>
                  <Typography>{note.content}</Typography>
                </Box>
              ))}
            </Box>
            <TextField
              fullWidth
              label="Add a note"
              multiline
              rows={3}
              value={selectedNote}
              onChange={(e) => setSelectedNote(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNotesDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNote} variant="contained" color="primary">
              Add Note
            </Button>
          </DialogActions>
        </Dialog>

        {/* Attendees Dialog */}
        <Dialog
          open={attendeesDialogOpen}
          onClose={() => setAttendeesDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          aria-labelledby="attendees-dialog-title"
          keepMounted={false}
          disablePortal={false}
        >
          <DialogTitle
            id="attendees-dialog-title"
            ref={attendeesTitleRef}
            tabIndex={-1}
          >
            Manage Attendees
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              {selectedEvent?.attendees?.map((attendee) => (
                <Box
                  key={attendee.user._id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography>
                    {attendee.user.firstName} {attendee.user.lastName}
                  </Typography>
                  <FormControl size="small">
                    <Select
                      value={attendee.status}
                      onChange={(e) =>
                        handleAttendeeStatusChange(
                          attendee.user._id,
                          e.target.value
                        )
                      }
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="accepted">Accepted</MenuItem>
                      <MenuItem value="declined">Declined</MenuItem>
                      <MenuItem value="waitlisted">Waitlisted</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              ))}
            </Box>
            {["admin", "lecturer"].includes(user?.role) && (
              <Autocomplete
                multiple
                options={[]} // This would be populated with available users
                getOptionLabel={(option) =>
                  `${option.firstName} ${option.lastName}`
                }
                value={selectedAttendees}
                onChange={(event, newValue) => setSelectedAttendees(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Add Attendees"
                    placeholder="Search users..."
                  />
                )}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAttendeesDialogOpen(false)}>Close</Button>
            {["admin", "lecturer"].includes(user?.role) && (
              <Button
                onClick={() => {
                  // Handle adding new attendees
                  setAttendeesDialogOpen(false);
                }}
                variant="contained"
                color="primary"
              >
                Update Attendees
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Bulk Edit Dialog */}
        <Dialog
          open={bulkEditMode && selectedEvents.length > 0}
          onClose={() => setBulkEditMode(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Bulk Edit Events</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Selected Events: {selectedEvents.length}
            </Typography>
            {/* Add form fields for bulk updates */}
            {/* ... */}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkEditMode(false)}>Cancel</Button>
            <Button
              onClick={handleBulkEdit}
              variant="contained"
              color="primary"
            >
              Update All
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notify Dialog */}
        {renderNotifyDialog()}

        {/* Report Dialog */}
        {renderReportDialog()}

        {/* Roster Dialog */}
        {renderRosterDialog()}
      </Paper>
    </Container>
  );
};

export default Schedule;
