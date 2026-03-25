const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/events.controller");
const { protect, authorize } = require("../middleware/auth");

// Get all events
router.get("/", eventsController.getEvents);

// Get featured events
router.get("/featured", eventsController.getFeaturedEvents);

// Get the current user's event registrations - IMPORTANT: specific routes BEFORE dynamic routes
router.get(
  "/user/registrations",
  protect,
  eventsController.getCurrentUserRegisteredEvents
);

// Get single event - Dynamic route MUST be AFTER specific routes
router.get("/:id", eventsController.getEvent);

// Create event - Only admins and lecturers can create events
router.post(
  "/",
  protect,
  authorize("admin", "lecturer"),
  eventsController.createEvent
);

// Update event - Only admins and event creators can update
router.put("/:id", protect, eventsController.updateEvent);

// Delete event - Only admins and event creators can delete
router.delete("/:id", protect, eventsController.deleteEvent);

// Register for an event
router.post("/:id/register", protect, eventsController.registerForEvent);

// Unregister from an event
router.delete("/:id/register", protect, eventsController.unregisterFromEvent);

// Get event attendees
router.get("/:id/attendees", protect, eventsController.getEventAttendees);

// Check in attendee - Only admins and event creators can check in
router.put(
  "/:id/checkin/:userId",
  protect,
  authorize("admin", "lecturer"),
  eventsController.checkInAttendee
);

module.exports = router;
