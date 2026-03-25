const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/eventsController");
const { protect } = require("../middleware/authMiddleware");

// This file is just a placeholder for future user routes
// The main user routes are currently defined in server.js

// Add the route for getting the current user's event registrations
router.get('/me/registrations', protect, eventsController.getUserRegisteredEvents);

module.exports = router;
