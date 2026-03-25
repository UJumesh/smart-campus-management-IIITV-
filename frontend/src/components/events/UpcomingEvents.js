import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Event as EventIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { getUpcomingEvents } from "../../services/slices/eventSlice";
import { formatDate } from "../../utils/dateUtils";

const UpcomingEvents = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    upcomingEvents = [],
    isLoading,
    isError,
    message,
  } = useSelector((state) => state.events);

  useEffect(() => {
    dispatch(getUpcomingEvents());
  }, [dispatch]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {message || "Failed to load upcoming events"}
      </Alert>
    );
  }

  if (!upcomingEvents || upcomingEvents.length === 0) {
    return (
      <Box sx={{ textAlign: "center", p: 2 }}>
        <Typography variant="body1" color="text.secondary">
          No upcoming events found
        </Typography>
      </Box>
    );
  }

  return (
    <Card elevation={2} sx={{ height: "100%" }}>
      <CardContent>
        <Typography
          variant="h6"
          sx={{ mb: 2, display: "flex", alignItems: "center" }}
        >
          <EventIcon sx={{ mr: 1, color: "primary.main" }} />
          Upcoming Events
        </Typography>
        <List>
          {upcomingEvents.map((event) => (
            <ListItem
              key={event.id || event._id}
              sx={{
                mb: 1.5,
                borderRadius: 2,
                backgroundColor: "rgba(0,0,0,0.02)",
                transition: "all 0.2s",
                "&:hover": {
                  transform: "translateY(-3px)",
                  backgroundColor: "rgba(0,0,0,0.04)",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                },
              }}
              onClick={() => navigate(`/events/${event.id || event._id}`)}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <CalendarIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {event.title}
                  </Typography>
                }
                secondary={
                  <Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", mt: 0.5 }}
                    >
                      <CalendarIcon
                        sx={{ fontSize: 14, mr: 0.5, color: "text.secondary" }}
                      />
                      <Typography variant="body2" component="span">
                        {formatDate(event.startDate || event.date)}
                      </Typography>
                    </Box>
                    {event.location && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", mt: 0.5 }}
                      >
                        <LocationIcon
                          sx={{
                            fontSize: 14,
                            mr: 0.5,
                            color: "text.secondary",
                          }}
                        />
                        <Typography variant="body2" component="span">
                          {event.location}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                }
              />
              {event.capacity && (
                <Chip
                  size="small"
                  label={`${event.attendees?.length || 0}/${event.capacity}`}
                  color="primary"
                  variant="outlined"
                />
              )}
            </ListItem>
          ))}
        </List>
      </CardContent>
      <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
        <Button
          size="small"
          onClick={() => navigate("/events")}
          variant="outlined"
          endIcon={<EventIcon />}
        >
          View All Events
        </Button>
      </CardActions>
    </Card>
  );
};

export default UpcomingEvents;
