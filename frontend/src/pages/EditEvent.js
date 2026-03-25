import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Typography, Box, Breadcrumbs, Link, CircularProgress } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import EventForm from '../components/EventForm';
import { getEvent, clearEvent } from '../services/slices/eventSlice';

const EditEvent = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { event, isLoading, isError } = useSelector(state => state.events);
  
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
          <Typography color="text.primary">Edit Event</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Event: {event.title}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Update the event details below. Changes will be automatically reflected in the campus schedule.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <EventForm event={event} isEditing={true} />
        </Box>
      </Box>
    </Container>
  );
};

export default EditEvent; 