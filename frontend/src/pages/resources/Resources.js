import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Breadcrumbs,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import BookIcon from '@mui/icons-material/EventAvailable';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import ImageIcon from '@mui/icons-material/Image';
import { getAllResources, deleteResource, resetForceRefresh } from '../../services/slices/resourceSlice';
import { selectResources } from '../../selectors/resourceSelectors';
import ReservationForm from '../../components/ReservationForm';
import { toast } from 'react-hot-toast';

const Resources = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const resources = useSelector(selectResources) || [];  // Provide default empty array
  const { isLoading, isError, message, forceRefresh } = useSelector(state => state.resources || {});
  const { user } = useSelector(state => state.auth || {});
  const navigate = useNavigate();
  
  // Track if this is the initial mount
  const [isInitialMount, setIsInitialMount] = useState(true);
  
  // Add a state to track auth errors
  const [authError, setAuthError] = useState(false);
  
  // Add a local state to track force refresh
  const [localForceRefresh, setForceRefresh] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [reservationFormOpen, setReservationFormOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);

  // Process resources for display
  const resourcesArray = useMemo(() => {
    if (!resources || resources.length === 0) {
      return [];
    }

    // Ensure resources is an array
    const resourceList = Array.isArray(resources) ? resources : Object.values(resources);
    
    return resourceList.filter(resource => resource && resource._id);
  }, [resources]);
  
  // Component mounting
  useEffect(() => {
    // Check for auth token in localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const isUserAuthenticated = !!user;

    // Handle initial page load or refresh from create page
    if (forceRefresh || localForceRefresh || (location.state && location.state.refresh)) {
      dispatch(resetForceRefresh());
      setForceRefresh(false);
    dispatch(getAllResources())
      .unwrap()
        .then(() => {
          // Reset the forceRefresh
          setForceRefresh(false);
          
          // Clear the location state if it has refresh
          if (location.state && location.state.refresh) {
            navigate(location.pathname, { replace: true });
          }
        })
        .catch((error) => {
          // If unauthorized, check if token exists
          if (error === 'Unauthorized' && (!storedToken || !storedUser)) {
            // Clear invalid tokens
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          } else {
            toast.error(error || 'Error loading resources');
          }
        });
    } else if (!isUserAuthenticated && !storedToken) {
      // If no authentication, redirect to login
      navigate('/login');
    } else if (resources.length === 0 && !isLoading) {
      // Initial load of resources if none exist
      dispatch(getAllResources())
        .unwrap()
        .catch((error) => {
          if (error === 'Unauthorized') {
            navigate('/login');
          } else {
            toast.error(error || 'Error loading resources');
          }
        });
    }
  }, [navigate, dispatch, resources, location, forceRefresh, localForceRefresh, user, isLoading]);
  
  // Monitor resource changes
  useEffect(() => {
    console.log(`Resources array length updated: ${resourcesArray.length}`);
  }, [resourcesArray.length]);
  
  // Function to manually refresh resources
  const handleRefresh = () => {
    setForceRefresh(true);
    dispatch(getAllResources());
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTypeFilter = (e) => {
    setFilterType(e.target.value);
  };

  const toggleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleDeleteClick = (resource) => {
    setResourceToDelete(resource);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (resourceToDelete) {
      dispatch(deleteResource(resourceToDelete._id));
    }
    setDeleteDialogOpen(false);
    setResourceToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setResourceToDelete(null);
  };

  console.log('Resources from redux store (detailed):', JSON.stringify(resources, null, 2));
  console.log('Resources array to display:', resourcesArray);
  console.log('Resources array length:', resourcesArray.length);
  
  const filteredResources = resourcesArray.filter(resource => {
    // Only filter if resource is a valid object
    if (!resource || typeof resource !== 'object') {
      console.log('Invalid resource object rejected:', resource);
      return false;
    }
    
    // Log each resource to see what we're working with
    console.log('Processing resource:', resource._id, resource.name);
    
    // Safe checks for string properties
    const nameMatch = resource.name && typeof resource.name === 'string' && 
                     resource.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const descMatch = resource.description && typeof resource.description === 'string' && 
                     resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSearch = !searchTerm || nameMatch || descMatch;
    const matchesType = !filterType || resource.type === filterType;
    
    return matchesSearch && matchesType;
  });
  
  console.log('Filtered resources count:', filteredResources.length);

  const isAdmin = user?.role === 'admin';
  const isLecturer = user?.role === 'lecturer';
  const canBookResource = isAdmin || isLecturer;

  const handleOpenReservation = (resource) => {
    setSelectedResource(resource);
    setReservationFormOpen(true);
  };

  const handleCloseReservation = () => {
    setReservationFormOpen(false);
    // Refresh resources after reservation to get updated availability
    dispatch(getAllResources());
  };

  // Add a robust renderContent function
  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (isError) {
      return (
        <Alert severity="error" sx={{ my: 3 }}>
          Error: {message}
        </Alert>
      );
    }
    
    if (filteredResources.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Box 
            component="img" 
            src="/static/illustrations/no_data.svg" 
            alt="No resources found" 
            sx={{ 
              height: 180, 
              mb: 3,
              opacity: 0.8
            }} 
          />
          <Typography variant="h6" gutterBottom>
            No resources found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm 
              ? `No resources match "${searchTerm}"`
              : 'Try changing your search or filters'}
          </Typography>
        </Box>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {filteredResources.map((resource) => (
          <Grid item xs={12} sm={6} md={4} key={resource._id}>
            <Card 
              elevation={3} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 8
                },
                position: 'relative',
                borderRadius: 2
              }}
            >
              {resource.images && resource.images.length > 0 ? (
                <Box
                  sx={{
                    height: 160,
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <Box
                    component="img"
                    src={resource.images[0]}
                    alt={resource.name}
                    sx={{
                      height: '100%',
                      width: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 160,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.hover'
                  }}
                >
                  <ImageIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
                </Box>
              )}
              
              <Box
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  zIndex: 1
                }}
              >
                <Chip
                  label={resource.availability ? 'Available' : 'Unavailable'}
                  color={resource.availability ? 'success' : 'error'}
                  size="small"
                  sx={{ 
                    fontWeight: 'bold',
                    boxShadow: 2
                  }}
                  />
                </Box>
                
              <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                <Typography 
                  variant="subtitle1" 
                  component="h2" 
                  fontWeight="bold"
                  sx={{ mb: 1 }}
                >
                  {resource.name}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOnIcon 
                    fontSize="small" 
                    color="action" 
                    sx={{ mr: 0.5 }}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    noWrap
                  >
                    {resource.location.building}, Floor {resource.location.floor}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CategoryIcon 
                    fontSize="small" 
                    color="action" 
                    sx={{ mr: 0.5 }}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                  >
                    {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                  </Typography>
                </Box>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    height: 60, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {resource.description || 'No description available'}
                </Typography>
              </CardContent>
              
              <Divider />
              
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button 
                  component={Link} 
                  to={`/resources/${resource._id}`} 
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 'medium' }}
                >
                  View Details
                </Button>
                
                <Box sx={{ display: 'flex' }}>
                  {canBookResource && resource.availability && (
                    <Tooltip title="Reserve this resource">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenReservation(resource)}
                        sx={{ ml: 1 }}
                      >
                        <BookIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                
                {isAdmin && (
                  <>
                      <Tooltip title="Edit resource">
                        <IconButton
                      component={Link}
                      to={`/resources/edit/${resource._id}`}
                      size="small"
                          color="secondary"
                          sx={{ ml: 1 }}
                    >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    
                      <Tooltip title="Delete resource">
                        <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(resource)}
                          sx={{ ml: 1 }}
                    >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                  </>
                )}
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              Dashboard
            </Link>
            <Typography color="text.primary">Resources</Typography>
          </Breadcrumbs>
          
          <Box>
            <Button
              variant="outlined"
              onClick={handleRefresh}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            
            {isAdmin && (
              <Button
                component={Link}
                to="/resources/create"
                variant="contained"
                startIcon={<AddIcon />}
              >
                Add Resource
              </Button>
            )}
          </Box>
        </Box>

        <Typography variant="h4" gutterBottom>
          Campus Resources
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search Resources"
                variant="outlined"
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Grid>
            
            <Grid item xs={10} md={5}>
              {showFilter && (
                <FormControl fullWidth>
                  <InputLabel id="resource-type-label">Resource Type</InputLabel>
                  <Select
                    labelId="resource-type-label"
                    id="resource-type"
                    value={filterType}
                    label="Resource Type"
                    onChange={handleTypeFilter}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="classroom">Classroom</MenuItem>
                    <MenuItem value="laboratory">Laboratory</MenuItem>
                    <MenuItem value="equipment">Equipment</MenuItem>
                    <MenuItem value="facility">Facility</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Grid>
            
            <Grid item xs={2} md={1}>
              <Tooltip title="Toggle Filters">
                <IconButton onClick={toggleFilter} color={showFilter ? "primary" : "default"}>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Tooltip title="Refresh Resources">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {renderContent()}
      </Box>
      
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
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reservation Form Dialog */}
      {selectedResource && (
        <ReservationForm
          resource={selectedResource}
          open={reservationFormOpen}
          onClose={handleCloseReservation}
        />
      )}
    </Container>
  );
};

export default Resources;