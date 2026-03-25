const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateProfile
} = require('../controllers/user.controller');

// Apply authentication middleware to all routes below
// This just checks if the user is logged in with a valid token
router.use(protect);

// Routes accessible to ALL authenticated users regardless of role
// IMPORTANT: These must be defined BEFORE the authorize middleware
router.route('/profile')
  .put(updateProfile); // Any authenticated user can update their own profile

// Apply role-based authorization for admin-only routes
// Everything below this middleware will require admin role
router.use(authorize('admin'));

// Admin-only routes
router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router; 