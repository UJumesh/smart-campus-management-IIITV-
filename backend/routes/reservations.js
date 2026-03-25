const express = require('express');
const {
  getReservations,
  getUserReservations,
  getResourceReservations,
  getReservation,
  createReservation,
  updateReservation,
  approveReservation,
  rejectReservation,
  cancelReservation,
  deleteReservation
} = require('../controllers/reservations.controller');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);

// Admin only routes
router.route('/')
  .get(authorize('admin'), getReservations)
  .post(createReservation);

// User reservations
router.route('/user')
  .get(getUserReservations);

// Resource reservations
router.route('/resource/:resourceId')
  .get(getResourceReservations);

// Approval/Rejection routes - admin only
router.route('/:id/approve')
  .put(authorize('admin'), approveReservation);

router.route('/:id/reject')
  .put(authorize('admin'), rejectReservation);

// Cancel reservation - any user can cancel their own
router.route('/:id/cancel')
  .put(cancelReservation);

// Single reservation routes
router.route('/:id')
  .get(getReservation)
  .put(updateReservation)
  .delete(authorize('admin'), deleteReservation);

module.exports = router; 