import React from 'react';
import { Container, Typography, Box, Breadcrumbs, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ResourceForm from '../../components/ResourceForm';

const CreateResource = () => {
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
          <Typography color="text.primary">Add Resource</Typography>
        </Breadcrumbs>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Add New Resource
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Fill in the details below to add a new resource to the campus management system.
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <ResourceForm />
        </Box>
      </Box>
    </Container>
  );
};

export default CreateResource; 