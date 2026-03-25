const Event = require("../models/Event");
const Registration = require("../models/Registration");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");

/**
 * @desc    Get all events
 * @route   GET /api/events
 * @access  Public
 */
exports.getEvents = asyncHandler(async (req, res) => {
  // Extract query parameters for filtering
  const { search, department, type, status, page = 1, limit = 10 } = req.query;

  // Build query object
  const query = {};

  // Add filters if provided
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (department) query.department = department;
  if (type) query.type = type;
  if (status) query.status = status;

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Count total events matching query
    const total = await Event.countDocuments(query);

    // Get events with pagination
    const events = await Event.find(query)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      count: total,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

/**
 * @desc    Get featured events
 * @route   GET /api/events/featured
 * @access  Public
 */
exports.getFeaturedEvents = asyncHandler(async (req, res) => {
  const featuredEvents = await Event.find({ featured: true })
    .sort({ startDate: 1 })
    .limit(5);

  return res.status(200).json({
    success: true,
    count: featuredEvents.length,
    data: featuredEvents,
  });
});

/**
 * @desc    Get single event
 * @route   GET /api/events/:id
 * @access  Public
 */
exports.getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      success: false,
      error: "Event not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: event,
  });
});

/**
 * @desc    Get events registered by the current user
 * @route   GET /api/users/me/registrations
 * @access  Private
 */
exports.getUserRegisteredEvents = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Find all registrations for this user
  const registrations = await Registration.find({ userId });

  if (!registrations || registrations.length === 0) {
    return res.status(200).json({
      success: true,
      data: { eventIds: [] },
    });
  }

  // Extract event IDs
  const eventIds = registrations.map((reg) => reg.eventId);

  return res.status(200).json({
    success: true,
    data: { eventIds },
  });
});

/**
 * @desc    Get registered events for the current user
 * @route   GET /api/events/user/registrations
 * @access  Private
 */
exports.getCurrentUserRegisteredEvents = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Find all registrations for this user
  const registrations = await Registration.find({ userId });

  if (!registrations || registrations.length === 0) {
    return res.status(200).json({
      success: true,
      data: { eventIds: [] },
    });
  }

  // Extract event IDs
  const eventIds = registrations.map((reg) => reg.eventId);

  // Get the actual event details for these IDs
  const events = await Event.find({ _id: { $in: eventIds } });

  return res.status(200).json({
    success: true,
    count: events.length,
    data: {
      eventIds,
      events,
    },
  });
});

/**
 * @desc    Register for an event
 * @route   POST /api/events/:id/register
 * @access  Private
 */
exports.registerForEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  console.log(
    `User ${userId} with role ${userRole} registering for event ${eventId}`
  );

  // Check if the event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      error: "Event not found",
    });
  }

  // Get the target audience of the event
  const targetAudience = event.targetAudience || "All";

  // Validate audience type restrictions
  if (
    (userRole === "student" &&
      targetAudience !== "Students" &&
      targetAudience !== "All") ||
    (userRole === "lecturer" &&
      targetAudience !== "Lecturers" &&
      targetAudience !== "All")
  ) {
    return res.status(403).json({
      success: false,
      error: `This event is not available for ${
        userRole === "student" ? "students" : "lecturers"
      }`,
    });
  }

  // Check if already registered
  const existingRegistration = await Registration.findOne({
    userId,
    eventId,
  });

  if (existingRegistration) {
    return res.status(400).json({
      success: false,
      error: "You are already registered for this event",
    });
  }

  // Create registration
  const registration = await Registration.create({
    userId,
    eventId,
    registeredAt: new Date(),
  });

  // Update the event's registrations count
  event.registrationsCount = (event.registrationsCount || 0) + 1;
  await event.save();

  return res.status(200).json({
    success: true,
    data: event,
  });
});

/**
 * @desc    Unregister from an event
 * @route   DELETE /api/events/:id/register
 * @access  Private
 */
exports.unregisterFromEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;

  console.log(`User ${userId} unregistering from event ${eventId}`);

  // Check if the event exists
  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(404).json({
      success: false,
      error: "Event not found",
    });
  }

  // Check if registration exists
  const existingRegistration = await Registration.findOne({
    userId,
    eventId,
  });

  if (!existingRegistration) {
    return res.status(400).json({
      success: false,
      error: "You are not registered for this event",
    });
  }

  // Delete registration
  await Registration.findByIdAndDelete(existingRegistration._id);

  // Update the event's registrations count
  if (event.registrationsCount && event.registrationsCount > 0) {
    event.registrationsCount -= 1;
    await event.save();
  }

  return res.status(200).json({
    success: true,
    data: {},
  });
});

/**
 * @desc    Delete event
 * @route   DELETE /api/events/:id
 * @access  Private (admins and lecturers who created the event)
 */
exports.deleteEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.id;

  // Find the event
  const event = await Event.findById(eventId);

  if (!event) {
    return res.status(404).json({
      success: false,
      error: "Event not found",
    });
  }

  // Check permissions
  // Admins can delete any event
  // Lecturers can only delete events they created
  if (
    req.user.role === "lecturer" &&
    event.createdBy.toString() !== req.user.id
  ) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to delete this event",
    });
  }

  // Delete the event
  await Event.findByIdAndDelete(eventId);

  // Delete associated registrations
  await Registration.deleteMany({ eventId });

  return res.status(200).json({
    success: true,
    data: {},
  });
});
