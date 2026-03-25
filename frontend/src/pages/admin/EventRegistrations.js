import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  PersonOutline,
  Event,
  CalendarToday,
  Search as SearchIcon,
  CloudDownload as ExportIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import {
  getEvents,
  getUserRegistrations,
} from "../../services/slices/eventSlice";
import { format } from "date-fns";
import axios from "axios";

// Map event status to colors
const statusColors = {
  'upcoming': '#4caf50', // green
  'ongoing': '#2196f3', // blue
  'completed': '#9e9e9e', // grey
  'cancelled': '#f44336', // red
};

const EventRegistrations = () => {
  const dispatch = useDispatch();
  const { events: backendEvents, isLoading, isError, message } = useSelector(
    (state) => state.events
  );
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [directEvents, setDirectEvents] = useState([]); // Store directly fetched events
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("registrationsDesc");
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  
  // Use either redux events or directly fetched events
  const events = backendEvents?.length > 0 ? backendEvents : directEvents;

  // Define applyFiltersAndSort with useCallback to prevent recreation on every render
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...events].map(event => {
      // Use the event's attendees directly
      return {
        ...event,
        attendees: event.attendees || []
      };
    });

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter((event) => event.status === filter);
    }

    // Apply sorting
    switch (sortBy) {
      case "registrationsDesc":
        filtered.sort(
          (a, b) => (b.attendees?.length || 0) - (a.attendees?.length || 0)
        );
        break;
      case "registrationsAsc":
        filtered.sort(
          (a, b) => (a.attendees?.length || 0) - (b.attendees?.length || 0)
        );
        break;
      case "dateAsc":
        filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        break;
      case "dateDesc":
        filtered.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        break;
      case "titleAsc":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, filter, sortBy]); // Add all dependencies

  // Apply filters and sorting
  useEffect(() => {
    if (events && events.length > 0) {
      applyFiltersAndSort();
    } else {
      setFilteredEvents([]);
    }
  }, [events, applyFiltersAndSort]);

  // Fetch events from backend
  useEffect(() => {
    // Try both methods to ensure we get data
    fetchEventsDirectly(); // Force direct fetch first
    
    dispatch(getEvents())
      .unwrap()
      .then((response) => {
        // If response is empty but should have events, try direct API call
        if (!response || response.length === 0) {
          fetchEventsDirectly();
        }
      })
      .catch((error) => {
        // If Redux fails, try direct API call
        fetchEventsDirectly();
      });
    
    dispatch(getUserRegistrations())
      .unwrap()
      .catch(error => {
        // Silently handle error
      });
  }, [dispatch]);

  // Direct API call to fetch events if Redux fails
  const fetchEventsDirectly = async () => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5002";
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${baseUrl}/api/events`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.data) {
        const eventsData = response.data.data;
        
        // Store the events in local state
        setDirectEvents(eventsData);
        setFilteredEvents(eventsData);
        
        // No need to fetch attendees separately, we'll use the existing data
        setLoadingAttendees(false);
      } else {
        setLoadingAttendees(false);
      }
    } catch (error) {
      setLoadingAttendees(false);
    }
  };

  const exportToCsv = async () => {
    try {
      // Prepare CSV content
      const headers = [
        "Event Title",
        "Date",
        "Status",
        "Registrations",
        "Capacity",
        "Registered Users",
      ];
      const rows = filteredEvents.map((event) => {
        const attendees = event.attendees || [];
        const registeredUsers = attendees
          .map((attendee) => {
            let displayName = "Unknown User";

            if (typeof attendee === "object") {
              // Handle fully populated user object
              if (attendee.firstName && attendee.lastName) {
                displayName = `${attendee.firstName} ${attendee.lastName}`;
              }
              // Handle case where user object has email only
              else if (attendee.email) {
                displayName = attendee.email;
              }
              // Handle case where user is referenced by ID
              else if (attendee._id) {
                displayName = `User ID: ${attendee._id}`;
              }
            } else if (typeof attendee === "string") {
              // If it's just a string ID
              displayName = `User ID: ${attendee}`;
            }

            return displayName;
          })
          .join(", ");

        return [
          event.title,
          format(new Date(event.startDate), "MM/dd/yyyy"),
          event.status,
          attendees.length,
          event.capacity || "Unlimited",
          registeredUsers,
        ].join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "event_registrations.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
    }
  };

  // Calculate summary data with real attendee counts
  const totalEvents = events?.length || 0;
  const totalRegistrations = events?.reduce(
    (sum, event) => sum + (event.attendees?.length || 0), 0
  ) || 0;
  const upcomingEvents = events?.filter(
    (event) => event.status === "upcoming"
  ).length || 0;

  // Get top events by registration 
  const topEventsByRegistration = [...(events || [])]
    .sort((a, b) => (b.attendees?.length || 0) - (a.attendees?.length || 0))
    .slice(0, 3);

  // Update the attendee display in the table
  const renderAttendees = (event) => {
    // Use the attendees directly from the event object - don't rely on separate fetch
    const attendees = event.attendees || [];
    
    if (loadingAttendees) {
      return (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">Loading attendees...</Typography>
        </Box>
      );
    }
    
    if (!attendees || attendees.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No registrations
        </Typography>
      );
    }
    
    return (
      <Box sx={{ maxWidth: 300, maxHeight: 100, overflow: "auto" }}>
        {attendees.map((attendee, index) => {
          let displayName = "Unknown User";
          let email = "";
          
          if (typeof attendee === "object") {
            if (attendee.firstName && attendee.lastName) {
              displayName = `${attendee.firstName} ${attendee.lastName}`;
            } else if (attendee.email) {
              displayName = attendee.email;
            } else if (attendee._id) {
              displayName = `User ID: ${attendee._id}`;
            } else if (attendee.userId) {
              displayName = `User ID: ${attendee.userId}`;
            }
            if (attendee.email) {
              email = `(${attendee.email})`;
            }
          } else if (typeof attendee === "string") {
            displayName = `User ID: ${attendee}`;
          }
          
          return (
            <Typography 
              key={index} 
              variant="body2" 
              component="div"
              sx={{ 
                display: "flex", 
                alignItems: "center",
                mb: 0.5 
              }}
            >
              <PersonOutline 
                fontSize="small" 
                sx={{ mr: 0.5, color: "primary.main" }} 
              />
              {displayName} {email}
            </Typography>
          );
        })}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4" component="h1">
            Event Registrations
          </Typography>
            <Button
              startIcon={<ExportIcon />}
              onClick={exportToCsv}
          variant="outlined"
          color="primary"
          size="small"
          disabled={filteredEvents.length === 0}
        >
          Export to CSV
            </Button>
          </Box>

      {isError && (
        <Alert severity="error" sx={{ my: 2 }}>
          {message || "Error loading events. Please try again later."}
        </Alert>
      )}

      {isLoading && !isError && (
        <Alert severity="info" sx={{ my: 2 }}>
          Loading events from database...
        </Alert>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <Alert severity="warning" sx={{ my: 2 }}>
          No events found in the database. Try creating some events first.
          <Button 
            variant="outlined" 
            size="small" 
            onClick={fetchEventsDirectly}
            sx={{ ml: 2 }}
          >
            Retry Fetch
          </Button>
        </Alert>
      )}

      <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
          {loadingAttendees && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Fetching attendee information...
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search events..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon color="action" sx={{ mr: 1 }} fontSize="small" />
                ),
              }}
            />
          </Box>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Registration Summary
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Event color="primary" fontSize="small" sx={{ mr: 1 }} />
                <Typography>
                  Total Events: {isLoading ? "Loading..." : totalEvents}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <PersonOutline color="primary" fontSize="small" sx={{ mr: 1 }} />
                <Typography>
                  Total Registrations: {loadingAttendees ? "Loading..." : totalRegistrations}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CalendarToday color="primary" fontSize="small" sx={{ mr: 1 }} />
                <Typography>
                  Upcoming Events: {isLoading ? "Loading..." : upcomingEvents}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          </Grid>

        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel id="filter-label">Filter</InputLabel>
              <Select
                labelId="filter-label"
                value={filter}
                label="Filter"
                onChange={(e) => setFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="sort-label">Sort</InputLabel>
              <Select
                labelId="sort-label"
                value={sortBy}
                label="Sort"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="registrationsDesc">Most Registrations</MenuItem>
                <MenuItem value="registrationsAsc">Least Registrations</MenuItem>
                <MenuItem value="dateAsc">Date (Oldest First)</MenuItem>
                <MenuItem value="dateDesc">Date (Newest First)</MenuItem>
                <MenuItem value="titleAsc">Title (A-Z)</MenuItem>
              </Select>
            </FormControl>
                </Box>

          <Paper sx={{ mb: 4, p: 2 }}>
            <Typography variant="h6" gutterBottom>
                  Top Events by Registration
                </Typography>
                  <TableContainer>
              <Table size="small">
                      <TableHead>
                  <TableRow>
                          <TableCell>Event</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Status</TableCell>
                    <TableCell align="right">Registrations</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                  {topEventsByRegistration.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No events found
                              </TableCell>
                    </TableRow>
                  ) : (
                    topEventsByRegistration.map((event) => (
                      <TableRow key={event._id}>
                        <TableCell>{event.title}</TableCell>
                              <TableCell>
                          {format(new Date(event.startDate), "MM/dd/yyyy")}
                              </TableCell>
                              <TableCell>
                                <Chip
                            label={
                              event.status.charAt(0).toUpperCase() +
                              event.status.slice(1)
                            }
                                  size="small"
                                  sx={{
                              bgcolor: statusColors[event.status] || "grey",
                              color: "white",
                                  }}
                                />
                              </TableCell>
                        <TableCell align="right">
                          <Box
                                  sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              bgcolor: "primary.main",
                              color: "white",
                              fontWeight: "bold",
                              fontSize: "0.75rem",
                            }}
                          >
                            {event.attendees?.length || 0}
                          </Box>
                              </TableCell>
                            </TableRow>
                    ))
                  )}
                      </TableBody>
                    </Table>
                  </TableContainer>
          </Paper>
          </Grid>
        </Grid>

      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        {isLoading || loadingAttendees ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event Title</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Registrations</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Registered Users</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      {isLoading ? "Loading events..." : "No events found."}
                        </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event._id}>
                      <TableCell>{event.title}</TableCell>
                        <TableCell>
                          {format(new Date(event.startDate), "MM/dd/yyyy")}
                        </TableCell>
                        <TableCell>
                          <Chip
                          label={
                            event.status.charAt(0).toUpperCase() +
                            event.status.slice(1)
                          }
                            size="small"
                            sx={{
                            bgcolor: statusColors[event.status] || "grey",
                            color: "white",
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                        <Box
                            sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            bgcolor: "primary.main",
                            color: "white",
                            fontWeight: "bold",
                          }}
                        >
                          {event.attendees?.length || 0}
                            </Box>
                        </TableCell>
                      <TableCell>{event.capacity || "Unlimited"}</TableCell>
                      <TableCell>
                        {renderAttendees(event)}
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default EventRegistrations;
