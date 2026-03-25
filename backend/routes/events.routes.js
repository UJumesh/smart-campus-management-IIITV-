const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const eventController = require("../controllers/eventController");

// Get all events
router.get("/", eventController.getEvents);

// Get featured events
router.get("/featured", eventController.getFeaturedEvents);

// Get events by department
router.get("/department/:department", eventController.getEventsByDepartment);

// Get user's registrations (fixed function name)
router.get(
  "/user/registrations",
  protect,
  eventController.getCurrentUserRegisteredEvents
);

// Get event by ID - Dynamic route MUST be AFTER specific routes
router.get("/:id", eventController.getEvent);

// Create event - only admins and lecturers
router.post(
  "/",
  protect,
  authorize("admin", "lecturer"),
  eventController.createEvent
);

// Update event - only admins and lecturers
router.put(
  "/:id",
  protect,
  authorize("admin", "lecturer"),
  eventController.updateEvent
);

// Delete event - only admins and lecturers
router.delete(
  "/:id",
  protect,
  authorize("admin", "lecturer"),
  eventController.deleteEvent
);

// Toggle featured status - only admins
router.patch(
  "/:id/featured",
  protect,
  authorize("admin"),
  eventController.toggleFeatured
);

// Register for event
router.post("/:id/register", protect, eventController.registerForEvent);

// Unregister from event
router.delete("/:id/register", protect, eventController.unregisterFromEvent);

module.exports = router;
