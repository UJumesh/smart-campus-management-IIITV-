import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Typography, Box, Paper, Grid, Button, IconButton, Chip } from '@mui/material';
import { 
  CalendarMonth as CalendarIcon,
  Today as TodayIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  addMonths, subMonths, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { getEvents } from '../services/slices/eventSlice';

const MyCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [registeredEvents, setRegisteredEvents] = useState([]);
  
  const dispatch = useDispatch();
  const { events, isLoading, isError, message } = useSelector(state => state.events);
  const { user } = useSelector(state => state.auth);
  
  // Load events from API and local storage
  useEffect(() => {
    dispatch(getEvents());
    
    // Load locally stored registered events as fallback
    const storedEvents = JSON.parse(localStorage.getItem('registeredEvents') || '[]');
    setRegisteredEvents(storedEvents);
  }, [dispatch]);
  
  // Filter to get only events the user is registered for
  const myEvents = events.filter(event => {
    // Check if user is in attendees list
    return event.attendees && event.attendees.some(attendee => 
      attendee.userId === user?.id || attendee.email === user?.email
    );
  });
  
  // Merge API events with locally stored ones for complete view
  const allRegisteredEvents = [
    ...myEvents,
    ...registeredEvents.filter(localEvent => 
      !myEvents.some(apiEvent => apiEvent._id === localEvent.eventId)
    )
  ];
  
  const renderHeader = () => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h4" component="h1">
            My Calendar
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={prevMonth}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" sx={{ mx: 2 }}>
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={nextMonth}>
            <ChevronRightIcon />
          </IconButton>
          <Button 
            variant="outlined" 
            startIcon={<TodayIcon />}
            onClick={() => setCurrentMonth(new Date())}
            sx={{ ml: 2 }}
          >
            Today
          </Button>
        </Box>
      </Box>
    );
  };
  
  const renderDays = () => {
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      days.push(
        <Box key={i} sx={{ flex: 1, textAlign: 'center', padding: 1, 
          fontWeight: 'bold', bgcolor: 'primary.light', color: 'white',
          borderRadius: '4px', mx: 0.5 }}>
          {weekDays[i]}
        </Box>
      );
    }
    
    return <Box sx={{ display: 'flex', mb: 1 }}>{days}</Box>;
  };
  
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const rows = [];
    let days = [];
    let day = startDate;
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(day, monthStart);
        
        // Get events for this day
        const dayEvents = allRegisteredEvents.filter(event => {
          // Check if event is on this day
          const eventStart = event.startDate ? parseISO(event.startDate) : parseISO(event.start);
          return isSameDay(eventStart, day);
        });
        
        days.push(
          <Box
            key={day.toString()}
            sx={{
              flex: 1,
              height: 120,
              border: '1px solid #ddd',
              borderRadius: 1,
              padding: 1,
              backgroundColor: !isCurrentMonth 
                ? '#f5f5f5'
                : isSameDay(day, selectedDate) 
                  ? 'rgba(25, 118, 210, 0.1)'
                  : 'white',
              color: !isCurrentMonth ? '#aaa' : 'inherit',
              overflow: 'hidden',
              mx: 0.5,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.05)',
              }
            }}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: isSameDay(day, new Date()) ? 'bold' : 'normal',
                color: isSameDay(day, new Date()) ? 'primary.main' : 'inherit',
                mb: 1
              }}
            >
              {formattedDate}
            </Typography>
            
            <Box sx={{ maxHeight: 85, overflowY: 'auto' }}>
              {dayEvents.map((event, idx) => (
                <Chip
                  key={idx}
                  label={event.title}
                  size="small"
                  icon={<EventIcon />}
                  sx={{ 
                    mb: 0.5, 
                    width: '100%',
                    backgroundColor: 'primary.light',
                    color: 'white',
                    '& .MuiChip-icon': {
                      color: 'white',
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        );
        
        day = addDays(day, 1);
      }
      
      rows.push(
        <Box key={day.toString()} sx={{ display: 'flex', mb: 1 }}>
          {days}
        </Box>
      );
      days = [];
    }
    
    return <Box>{rows}</Box>;
  };
  
  const renderEventDetails = () => {
    // Get events for selected date
    const selectedEvents = allRegisteredEvents.filter(event => {
      const eventStart = event.startDate ? parseISO(event.startDate) : parseISO(event.start);
      return isSameDay(eventStart, selectedDate);
    });
    
    return (
      <Paper sx={{ p: 3, mt: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EventIcon sx={{ mr: 1 }} color="primary" />
          Events on {format(selectedDate, 'MMMM d, yyyy')}
        </Typography>
        
        {selectedEvents.length === 0 ? (
          <Typography variant="body1" color="textSecondary">
            No events scheduled for this day.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {selectedEvents.map((event, idx) => (
              <Grid item xs={12} key={idx}>
                <Paper elevation={1} sx={{ p: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                  <Typography variant="h6">{event.title}</Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {format(parseISO(event.startDate || event.start), 'h:mm a')} - 
                      {format(parseISO(event.endDate || event.end), 'h:mm a')}
                    </Typography>
                  </Box>
                  
                  {event.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {event.location}
                      </Typography>
                    </Box>
                  )}
                  
                  {event.description && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {event.description}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    );
  };
  
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  return (
    <Container>
      {renderHeader()}
      {renderDays()}
      {renderCells()}
      {renderEventDetails()}
    </Container>
  );
};

export default MyCalendar; 