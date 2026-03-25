import api from './services/api';

// Get token from localStorage
const token = localStorage.getItem('token') || JSON.parse(localStorage.getItem('user'))?.token;

if (!token) {
  console.error('No authentication token found. Please log in first.');
} else {
  console.log('Using token:', token.substring(0, 10) + '...');
  
  // Test resources endpoint
  api.get('/api/resources', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(response => {
      console.log('Resources API Response:', response.data);
      console.log('Resources count:', response.data.count);
      console.log('First resource:', response.data.data[0]);
    })
    .catch(error => {
      console.error('API Error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Status:', error.response.status);
      }
    });
} 