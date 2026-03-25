import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  Breadcrumbs,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Card,
  CardMedia,
  CardContent,
  Stack,
  IconButton,
  Tooltip,
  Badge,
  Avatar,
  Skeleton
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Group as GroupIcon,
  Image as ImageIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  EventAvailable as BookIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Approval as ApprovalIcon,
  SupervisorAccount as RolesIcon,
  Info as InfoIcon,
  Business as BusinessIcon,
  Apartment as ApartmentIcon,
  MeetingRoom as MeetingRoomIcon
} from '@mui/icons-material';
import { getResourceById, deleteResource } from '../../services/slices/resourceSlice';
import { getResourceReservations } from '../../services/slices/reservationSlice';
import ReservationForm from '../../components/ReservationForm';

const ResourceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const resourceState = useSelector(state => state.resources || {});
  const { resource, isLoading = false, isError = false, message = '' } = resourceState;
  const { user } = useSelector(state => state.auth || {});
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  
  useEffect(() => {
    if (id) {
      dispatch(getResourceById(id));
    }
  }, [id, dispatch]);
  
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    dispatch(deleteResource(id));
    setDeleteDialogOpen(false);
    navigate('/resources');
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleBookOpen = () => {
    setBookDialogOpen(true);
  };
  
  const handleBookClose = () => {
    setBookDialogOpen(false);
    dispatch(getResourceById(id));
  };
  
  const isAdmin = user?.role === 'admin';
  const isLecturer = user?.role === 'lecturer';
  const canBookResource = isAdmin || isLecturer;
  
  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Skeleton variant="text" width="30%" height={40} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
            <Skeleton variant="text" width="50%" height={60} />
            <Skeleton variant="rectangular" width={120} height={36} />
          </Box>
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" width="100%" height={300} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" width="100%" height={300} />
            </Grid>
          </Grid>
        </Box>
      </Container>
    );
  }
  
  if (isError) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error" variant="filled" sx={{ mb: 3 }}>
            Error: {message || 'Failed to load resource details'}
          </Alert>
          <Button 
            component={Link} 
            to="/resources" 
            startIcon={<ArrowBackIcon />}
            variant="contained"
            sx={{ mt: 2 }}
          >
            Back to Resources
          </Button>
        </Box>
      </Container>
    );
  }
  
  if (!resource) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="info">Loading resource details...</Alert>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Breadcrumbs and Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              Dashboard
            </Link>
            <Link to="/resources" style={{ textDecoration: 'none', color: 'inherit' }}>
              Resources
            </Link>
            <Typography color="text.primary">{resource.name}</Typography>
          </Breadcrumbs>
          
          <Stack direction="row" spacing={1}>
            <Button
              component={Link}
              to="/resources"
              startIcon={<ArrowBackIcon />}
              variant="outlined"
              onClick={() => {
                window.history.replaceState({}, document.title);
              }}
            >
              Back
            </Button>
            
            {canBookResource && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<BookIcon />}
                onClick={handleBookOpen}
                disabled={!resource.availability}
              >
                Book Resource
              </Button>
            )}
            
            {isAdmin && (
              <>
                <Button
                  component={Link}
                  to={`/resources/edit/${resource._id}`}
                  startIcon={<EditIcon />}
                  variant="outlined"
                  color="secondary"
                >
                  Edit
                </Button>
                
                <Button
                  startIcon={<DeleteIcon />}
                  variant="outlined"
                  color="error"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </>
            )}
          </Stack>
        </Box>
        
        {/* Resource Header */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {resource.name}
                </Typography>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)} • {resource.location.building}, Floor {resource.location.floor}{resource.location.roomNumber ? `, Room ${resource.location.roomNumber}` : ''}
              </Typography>
            </Box>
                
                <Chip 
                  icon={resource.availability ? <CheckCircleIcon /> : <CancelIcon />}
                  label={resource.availability ? "Available" : "Unavailable"}
                  color={resource.availability ? "success" : "error"}
                  size="medium"
              sx={{ fontWeight: 'bold', p: 0.5 }}
            />
          </Box>
        </Paper>
        
        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left Column - Details */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              {/* Description Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
                  <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                  About this Resource
                </Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {resource.description || 'No description available.'}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              {/* Features Section */}
              {resource.features && resource.features.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Features
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {resource.features.map((feature, index) => (
                      <Chip 
                        key={index} 
                        label={feature} 
                        color="primary" 
                        variant="outlined" 
                        size="medium" 
                      />
                    ))}
                  </Box>
                </Box>
              )}
              
              {/* Booking Information */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Booking Information
                </Typography>
                
                <Grid container spacing={2}>
                  {/* Capacity */}
                    {(resource.type === 'classroom' || resource.type === 'laboratory') && (
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                        <GroupIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Capacity
                          </Typography>
                          <Typography variant="h6">
                            {resource.capacity} {resource.capacity === 1 ? 'Person' : 'People'}
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  )}
                  
                  {/* Approval Required */}
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                      <InfoIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Approval Status
                        </Typography>
                        <Typography variant="body1">
                          {resource.reservationRequiresApproval 
                            ? 'Requires admin approval' 
                            : 'Automatically approved'}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                  
                  {/* Allowed Roles */}
                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <RolesIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                          Who can book this resource
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 1 }}>
                        {resource.allowedRoles.map((role, index) => (
                          <Chip 
                            key={index} 
                            label={role.charAt(0).toUpperCase() + role.slice(1)} 
                            color={role === 'admin' ? 'error' : role === 'lecturer' ? 'primary' : 'success'} 
                            size="small" 
                            variant="outlined"
                          />
                              ))}
                            </Box>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
                </Grid>
                
          {/* Right Column - Image and Location */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Image */}
              <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  {resource.images && resource.images.length > 0 ? (
                  <Card sx={{ height: '100%' }}>
                    <CardMedia
                      component="img"
                      height="250"
                      image={resource.images[0]}
                        alt={resource.name}
                      sx={{ objectFit: 'cover' }}
                      />
                  </Card>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'center', 
                      alignItems: 'center',
                    height: 250,
                    bgcolor: 'background.paper',
                      p: 3,
                    }}>
                    <ImageIcon sx={{ fontSize: 80, color: 'action.disabled', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                      No image available
                      </Typography>
                    </Box>
                  )}
              </Paper>
              
              {/* Location Details */}
              <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Location Details
                  </Typography>
                
                <List disablePadding>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <BusinessIcon color="action" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Building" 
                      secondary={resource.location.building} 
                    />
                  </ListItem>
                  
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <ApartmentIcon color="action" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Floor" 
                      secondary={resource.location.floor} 
                    />
                  </ListItem>
                  
                  {resource.location.roomNumber && (
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <MeetingRoomIcon color="action" />
                      </ListItemIcon>
                          <ListItemText 
                        primary="Room" 
                        secondary={resource.location.roomNumber} 
                          />
                        </ListItem>
                  )}
                    </List>
            </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Box>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this resource? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reservation Dialog */}
      {resource && (
        <ReservationForm 
          resource={resource} 
          open={bookDialogOpen} 
          onClose={handleBookClose} 
        />
      )}
    </Container>
  );
};

export default ResourceDetails; 