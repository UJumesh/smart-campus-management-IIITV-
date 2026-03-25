const express = require('express');
const router = express.Router();

// Import route files
const eventRoutes = require('./events');
const userRoutes = require('./users');
const resourceRoutes = require('./resources');

// Mount routes
router.use('/events', eventRoutes);
router.use('/users', userRoutes);
router.use('/resources', resourceRoutes);

module.exports = router; 