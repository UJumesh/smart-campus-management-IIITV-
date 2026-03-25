  import React, { useState, useEffect } from 'react';
  import { useSelector } from 'react-redux';
  import { Box, Typography, Paper, IconButton, Collapse, Badge } from '@mui/material';
  import { 
    NotificationsActive as NotificationIcon,
    Close as CloseIcon,
    Event as EventIcon,
    CalendarToday as CalendarIcon
  } from '@mui/icons-material';
  import { parseISO, format, differenceInHours, differenceInDays } from 'date-fns';
  import { Link } from 'react-router-dom';

  const EventNotification = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const eventsState = useSelector(state => state.events);
    const events = eventsState?.events || [];
    const { user } = useSelector(state => state.auth);
    
    // Check for upcoming events on component mount and when events change
    useEffect(() => {
      if (!events || !events.length || !user) return;
      
      // Get registered events
      const registeredEvents = events.filter(event => 
        event.attendees && event.attendees.some(attendee => 
          attendee.userId === user.id || attendee.email === user.email
        )
      );
      
      // Load locally stored registered events as fallback
      const storedEvents = JSON.parse(localStorage.getItem('registeredEvents') || '[]');
      
      // Combine both sources
      const allEvents = [
        ...registeredEvents,
        ...storedEvents.filter(localEvent => 
          !registeredEvents.some(apiEvent => apiEvent._id === localEvent.eventId)
        )
      ];
      
      // Filter for upcoming events in the next 24 hours
      const now = new Date();
      const upcomingEvents = allEvents.filter(event => {
        const eventDate = parseISO(event.startDate || event.start);
        const hoursUntilEvent = differenceInHours(eventDate, now);
        const daysUntilEvent = differenceInDays(eventDate, now);
        
        // Include events happening today or tomorrow
        return hoursUntilEvent > 0 && daysUntilEvent < 2;
      });
      
      // Generate notifications
      const newNotifications = upcomingEvents.map(event => {
        const eventDate = parseISO(event.startDate || event.start);
        const hoursRemaining = differenceInHours(eventDate, now);
        
        let message = '';
        if (hoursRemaining < 1) {
          message = 'Starting in less than an hour!';
        } else if (hoursRemaining < 3) {
          message = `Starting in ${hoursRemaining} hours!`;
        } else {
          message = `Coming up on ${format(eventDate, 'MMM dd')} at ${format(eventDate, 'h:mm a')}`;
        }
        
        return {
          id: event._id || event.eventId,
          title: event.title,
          message,
          time: eventDate,
          priority: hoursRemaining < 3 ? 'high' : 'normal',
          seen: false
        };
      });
      
      if (newNotifications.length > 0) {
        setNotifications(newNotifications);
        // Auto-open notifications if there are high priority ones
        if (newNotifications.some(n => n.priority === 'high')) {
          setOpen(true);
        }
      }
    }, [events, user]);
    
    if (notifications.length === 0) return null;
    
    return (
      <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
        <Badge badgeContent={notifications.length} color="error">
          <IconButton 
            color="primary" 
            onClick={() => setOpen(!open)}
            sx={{ 
              backgroundColor: 'white', 
              boxShadow: 3,
              '&:hover': { backgroundColor: '#f5f5f5' }
            }}
          >
            <NotificationIcon />
          </IconButton>
        </Badge>
        
        <Collapse in={open}>
          <Paper 
            elevation={4}
            sx={{ 
              mt: 2, 
              width: 300, 
              maxHeight: 400, 
              overflow: 'auto',
              borderRadius: 2
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid #eee'
            }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon sx={{ mr: 1 }} />
                Upcoming Events
              </Typography>
              <IconButton size="small" onClick={() => setOpen(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            
            {notifications.map((notification) => (
              <Box 
                key={notification.id}
                sx={{ 
                  p: 2, 
                  borderBottom: '1px solid #eee',
                  backgroundColor: notification.priority === 'high' ? 'rgba(255, 0, 0, 0.05)' : 'transparent'
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  {notification.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {notification.message}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Link to="/calendar" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      <CalendarIcon fontSize="small" sx={{ mr: 0.5 }} />
                      View in Calendar
                    </Typography>
                  </Link>
                </Box>
              </Box>
            ))}
          </Paper>
        </Collapse>
      </Box>
    );
  };

  export default EventNotification; 