const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getResources,
  getResource,
  createResource,
  updateResource,
  updateResourceAvailability,
  deleteResource,
  getResourcesByType
} = require('../controllers/resources.controller');

// Routes for all resources
router.route('/')
  .get(protect, getResources)
  .post(protect, authorize('admin'), createResource);

// Routes for resources by type
router.route('/type/:type')
  .get(protect, getResourcesByType);

// Routes for specific resource
router.route('/:id')
  .get(protect, getResource)
  .put(protect, authorize('admin'), updateResource)
  .delete(protect, authorize('admin'), deleteResource);

// Route for updating resource availability
router.route('/:id/availability')
  .patch(protect, authorize('admin'), updateResourceAvailability);

module.exports = router; 