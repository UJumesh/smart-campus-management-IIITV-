import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getEvents, deleteEvent, reset } from '../services/slices/eventSlice';

const Events = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { events, isLoading } = useSelector(state => state.events);
  const { user } = useSelector(state => state.auth);
  
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    visibility: ''
  });
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  
  useEffect(() => {
    dispatch(getEvents());
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSearch = () => {
    dispatch(getEvents(filters));
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleCreateEvent = () => {
    navigate('/events/create');
  };
  
  const handleEditEvent = (id) => {
    navigate(`/events/edit/${id}`);
  };
  
  const handleDeleteClick = (event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    if (eventToDelete) {
      dispatch(deleteEvent(eventToDelete._id));
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setEventToDelete(null);
  };
  
  const handleViewEvent = (id) => {
    navigate(`/events/${id}`);
  };
  
  // Filter events based on search term locally
  const filteredEvents = events.filter(event => {
    const searchMatch = !filters.search || 
      event.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.location.toLowerCase().includes(filters.search.toLowerCase());
    
    const typeMatch = !filters.type || event.type === filters.type;
    const statusMatch = !filters.status || event.status === filters.status;
    const visibilityMatch = !filters.visibility || event.visibility === filters.visibility;
    
    return searchMatch && typeMatch && statusMatch && visibilityMatch;
  });
  
  // Check if user can edit/delete an event
  const canModifyEvent = (event) => {
    return user && (user.role === 'admin' || (event.organizer && event.organizer._id === user._id));
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Events
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateEvent}
          >
            Create Event
          </Button>
        </Box>
        
        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  name="search"
                  label="Search Events"
                  value={filters.search}
                  onChange={handleFilterChange}
                  onKeyPress={handleKeyPress}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleSearch}>
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel id="type-filter-label">Type</InputLabel>
                  <Select
                    labelId="type-filter-label"
                    id="type-filter"
                    name="type"
                    value={filters.type}
                    label="Type"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="seminar">Seminar</MenuItem>
                    <MenuItem value="workshop">Workshop</MenuItem>
                    <MenuItem value="conference">Conference</MenuItem>
                    <MenuItem value="guest_lecture">Guest Lecture</MenuItem>
                    <MenuItem value="social">Social Event</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    id="status-filter"
                    name="status"
                    value={filters.status}
                    label="Status"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel id="visibility-filter-label">Visibility</InputLabel>
                  <Select
                    labelId="visibility-filter-label"
                    id="visibility-filter"
                    name="visibility"
                    value={filters.visibility}
                    label="Visibility"
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="">All Visibilities</MenuItem>
                    <MenuItem value="public">Public</MenuItem>
                    <MenuItem value="private">Private</MenuItem>
                    <MenuItem value="restricted">Restricted</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSearch}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {/* Events List */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredEvents.length === 0 ? (
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No events found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Try adjusting your filters or create a new event
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredEvents.map(event => (
              <Grid item xs={12} md={6} lg={4} key={event._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {event.image ? (
                    <CardMedia
                      component="img"
                      height="140"
                      image={event.image}
                      alt={event.title}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 140,
                        bgcolor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <EventIcon sx={{ fontSize: 60, color: 'white' }} />
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="div" noWrap>
                      {event.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(event.startDate), 'MMM d, yyyy • h:mm a')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {event.location}
                      </Typography>
                    </Box>
                    
                    {event.organizer && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {`${event.organizer.firstName} ${event.organizer.lastName}`}
                        </Typography>
                      </Box>
                    )}
                    
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        mb: 2
                      }}
                    >
                      {event.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      <Chip
                        label={event.type.replace('_', ' ')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={event.status || 'draft'}
                        size="small"
                        color={
                          event.status === 'published' ? 'success' :
                          event.status === 'cancelled' ? 'error' :
                          event.status === 'completed' ? 'info' : 'default'
                        }
                        variant="outlined"
                      />
                      {event.registrationRequired && (
                        <Chip
                          label="Registration Required"
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                  <Divider />
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      size="small"
                      onClick={() => handleViewEvent(event._id)}
                    >
                      View Details
                    </Button>
                    <Box>
                      {canModifyEvent(event) && (
                        <>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditEvent(event._id)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(event)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the event "{eventToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Events; 