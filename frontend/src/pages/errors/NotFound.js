import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { SentimentDissatisfied } from '@mui/icons-material';

const NotFound = () => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <SentimentDissatisfied sx={{ fontSize: 100, color: 'primary.main', mb: 2 }} />
          <Typography variant="h1" component="h1" gutterBottom>
            404
          </Typography>
          <Typography variant="h4" component="h2" gutterBottom>
            Page Not Found
          </Typography>
          <Typography variant="body1" paragraph>
            The page you are looking for does not exist or has been moved.
          </Typography>
          <Button
            component={Link}
            to="/"
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 2 }}
          >
            Go to Home
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFound; 