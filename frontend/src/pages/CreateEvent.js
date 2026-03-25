import React from 'react';
import { Container, Typography, Box, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import EventForm from '../components/EventForm';

const CreateEvent = () => {
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
          <Typography color="text.primary">Create Event</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Event
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Fill in the details below to create a new event. All events will be automatically added to the campus schedule.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <EventForm />
        </Box>
      </Box>
    </Container>
  );
};

export default CreateEvent; 