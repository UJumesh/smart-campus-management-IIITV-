import React, { useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Typography, Box, Breadcrumbs, Link, CircularProgress, Alert, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ResourceForm from '../../components/ResourceForm';
import { getResourceById } from '../../services/slices/resourceSlice';

const EditResource = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const resourceState = useSelector(state => state.resources || {});
  const { resource, isLoading = false, isError = false, message = '' } = resourceState;
  const { user } = useSelector(state => state.auth || {});
  
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/resources');
      return;
    }
    
    if (id) {
      dispatch(getResourceById(id));
    }
  }, [id, dispatch, navigate, user]);
  
  if (isLoading || !resource) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (isError) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">
            Error: {message || 'Failed to load resource details'}
          </Alert>
          <Button 
            component={RouterLink} 
            to="/resources" 
            startIcon={<ArrowBackIcon />}
            sx={{ mt: 2 }}
          >
            Back to Resources
          </Button>
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
          <Link component={RouterLink} to="/resources" color="inherit">
            Resources
          </Link>
          <Link 
            component={RouterLink} 
            to={`/resources/${id}`} 
            color="inherit"
          >
            {resource.name}
          </Link>
          <Typography color="text.primary">Edit</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Resource: {resource.name}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Update the resource information below.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <ResourceForm resource={resource} isEditing={true} />
        </Box>
      </Box>
    </Container>
  );
};

export default EditResource; 