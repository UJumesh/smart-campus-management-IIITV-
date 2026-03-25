const Event = require("../models/Event");
const Schedule = require("../models/Schedule");
const User = require("../models/User");
const asyncHandler = require("express-async-handler");
const { sendNotification } = require("../utils/notifications");

// @desc    Get all events
// @route   GET /api/events
// @access  Private
exports.getEvents = asyncHandler(async (req, res) => {
  const { startDate, endDate, type, status, visibility, search, limit } =
    req.query;

  // Build query
  let query = {};

  // Filter by date range
  if (startDate && endDate) {
    query.startDate = { $gte: new Date(startDate) };
    query.endDate = { $lte: new Date(endDate) };
  }

  // Filter by type
  if (type) {
    query.type = type;
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by visibility
  if (visibility) {
    query.visibility = visibility;
  }

  // Filter by search term
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  // Filter by user role
  if (req.user && req.user.role !== "admin") {
    // For non-admin users, only show events they can access
    query.$or = [
      { visibility: "public" },
      {
        visibility: "restricted",
        allowedRoles: req.user.role,
      },
      { organizer: req.user._id },
    ];
  }

  // Create the base query
  let eventsQuery = Event.find(query)
    .populate("organizer", "firstName lastName email")
    .populate("attendees", "firstName lastName email role")
    .sort({ startDate: 1 });

  // Apply limit if specified
  if (limit && !isNaN(parseInt(limit))) {
    eventsQuery = eventsQuery.limit(parseInt(limit));
  }

  // Execute the query
  const events = await eventsQuery;

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  });
});

// @desc    Get featured events
// @route   GET /api/events/featured
// @access  Public
exports.getFeaturedEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ featured: true, status: "active" })
    .populate("organizer", "firstName lastName email")
    .sort({ startDate: 1 })
    .limit(5);

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  });
});

// @desc    Get events by department
// @route   GET /api/events/department/:department
// @access  Private
exports.getEventsByDepartment = asyncHandler(async (req, res) => {
  const { department } = req.params;

  const events = await Event.find({
    department,
    status: "active",
    startDate: { $gte: new Date() },
  })
    .populate("organizer", "firstName lastName email")
    .sort({ startDate: 1 });

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  });
});

// @desc    Get user's registered events
// @route   GET /api/events/user/registrations
// @access  Private
exports.getCurrentUserRegisteredEvents = asyncHandler(async (req, res) => {
  // Find events where the current user is in the attendees array
  const events = await Event.find({
    "attendees.user": req.user._id,
  })
    .populate("organizer", "firstName lastName email")
    .sort({ startDate: 1 });

  res.status(200).json({
    success: true,
    count: events.length,
    data: events,
  });
});

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Private
exports.getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate("organizer", "firstName lastName email")
    .populate("attendees.user", "firstName lastName email");

  if (!event) {
    return res.status(404).json({
      success: false,
      error: "Event not found",
    });
  }

  // Check if user has access to this event
  if (
    req.user &&
    event.visibility === "private" &&
    event.organizer._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to access this event",
    });
  }

  if (
    req.user &&
    event.visibility === "restricted" &&
    !event.allowedRoles.includes(req.user.role) &&
    event.organizer._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to access this event",
    });
  }

  res.status(200).json({
    success: true,
    data: event,
  });
});

// @desc    Create new event
// @route   POST /api/events
// @access  Private
exports.createEvent = asyncHandler(async (req, res) => {
  // Add user to req.body
  req.body.organizer = req.user._id;

  // Validate dates
  const startDate = new Date(req.body.startDate);
  const endDate = new Date(req.body.endDate);

  if (endDate < startDate) {
    return res.status(400).json({
      success: false,
      error: "End date must be after start date",
    });
  }

  // Create event
  const event = await Event.create(req.body);

  // Create corresponding schedule entry
  const schedule = await Schedule.create({
    title: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location,
    type: "event",
    organizer: event.organizer,
    color: "#FF5722", // Orange color for events
    metadata: {
      eventId: event._id,
    },
  });

  // Send notifications to relevant users
  let notificationRecipients = [];

  // Notify admins
  const admins = await User.find({ role: "admin" });
  notificationRecipients = [
    ...notificationRecipients,
    ...admins.map((admin) => admin._id),
  ];

  // Notify users based on event visibility and allowed roles
  if (event.visibility === "public" || event.visibility === "restricted") {
    let userQuery = {};

    if (event.visibility === "restricted") {
      userQuery.role = { $in: event.allowedRoles };
    }

    const users = await User.find(userQuery);
    notificationRecipients = [
      ...notificationRecipients,
      ...users.map((user) => user._id),
    ];
  }

  // Remove duplicates and exclude the organizer
  notificationRecipients = [...new Set(notificationRecipients)].filter(
    (id) => id.toString() !== req.user._id.toString()
  );

  // Send notifications
  for (const recipientId of notificationRecipients) {
    await sendNotification({
      recipient: recipientId,
      sender: req.user._id,
      type: "event_created",
      title: "New Event Created",
      message: `A new event "${event.title}" has been created`,
      reference: {
        type: "event",
        id: event._id,
      },
    });
  }

  res.status(201).json({
    success: true,
    data: event,
    schedule: schedule,
  });
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private
exports.updateEvent = asyncHandler(async (req, res) => {
  let event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      success: false,
      error: "Event not found",
    });
  }

  // Make sure user is event organizer or admin
  if (
    event.organizer.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to update this event",
    });
  }

  // Validate dates if they're being updated
  if (req.body.startDate && req.body.endDate) {
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        error: "End date must be after start date",
      });
    }
  }

  // Update event
  event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Update corresponding schedule entry
  await Schedule.findOneAndUpdate(
    { "metadata.eventId": event._id },
    {
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: event,
  });
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private
exports.deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      success: false,
      error: "Event not found",
    });
  }

  // Make sure user is event organizer or admin
  if (
    event.organizer.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to delete this event",
    });
  }

  // Delete event - UPDATED to use findByIdAndDelete instead of remove()
  await Event.findByIdAndDelete(req.params.id);

  // Delete corresponding schedule entry
  await Schedule.findOneAndDelete({ "metadata.eventId": event._id });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Toggle featured status
// @route   PATCH /api/events/:id/featured
// @access  Private (Admin only)
exports.toggleFeatured = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      success: false,
      error: "Event not found",
    });
  }

  // Toggle featured status
  event.featured = !event.featured;
  await event.save();

  res.status(200).json({
    success: true,
    data: event,
  });
});

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private
exports.registerForEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      success: false,
      error: "Event not found",
    });
  }

  // Check if event is active
  if (event.status !== "active" && event.status !== "upcoming") {
    return res.status(400).json({
      success: false,
      error: "Cannot register for inactive event",
    });
  }

  // Check if event is in the past
  if (new Date(event.startDate) < new Date()) {
    return res.status(400).json({
      success: false,
      error: "Cannot register for past event",
    });
  }

  // Check if user is already registered
  const isRegistered = event.attendees.some(
    (attendee) => attendee.toString() === req.user._id.toString()
  );

  if (isRegistered) {
    return res.status(400).json({
      success: false,
      error: "Already registered for this event",
    });
  }

  // Add user to attendees
  event.attendees.push(req.user._id);

  await event.save();

  // Notify event organizer
  await sendNotification({
    recipient: event.organizer,
    sender: req.user._id,
    type: "event_registration",
    title: "New Event Registration",
    message: `${req.user.firstName} ${req.user.lastName} has registered for "${event.title}"`,
    reference: {
      type: "event",
      id: event._id,
    },
  });

  res.status(200).json({
    success: true,
    data: event,
  });
});

// @desc    Unregister from event
// @route   DELETE /api/events/:id/register
// @access  Private
exports.unregisterFromEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      success: false,
      error: "Event not found",
    });
  }

  // Check if event is active
  if (event.status !== "active" && event.status !== "upcoming") {
    return res.status(400).json({
      success: false,
      error: "Cannot unregister from inactive event",
    });
  }

  // Check if event is in the past
  if (new Date(event.startDate) < new Date()) {
    return res.status(400).json({
      success: false,
      error: "Cannot unregister from past event",
    });
  }

  // Check if user is registered
  const attendeeIndex = event.attendees.findIndex(
    (attendeeId) => attendeeId.toString() === req.user._id.toString()
  );

  if (attendeeIndex === -1) {
    return res.status(400).json({
      success: false,
      error: "Not registered for this event",
    });
  }

  // Remove user from attendees
  event.attendees.splice(attendeeIndex, 1);

  await event.save();

  // Notify event organizer
  await sendNotification({
    recipient: event.organizer,
    sender: req.user._id,
    type: "event_unregistration",
    title: "Event Unregistration",
    message: `${req.user.firstName} ${req.user.lastName} has unregistered from "${event.title}"`,
    reference: {
      type: "event",
      id: event._id,
    },
  });

  res.status(200).json({
    success: true,
    data: event,
  });
});

// @desc    Check in attendee
// @route   PUT /api/events/:id/checkin/:userId
// @access  Private (Admin or Organizer only)
exports.checkInAttendee = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      success: false,
      error: "Event not found",
    });
  }

  // Make sure user is event organizer or admin
  if (
    event.organizer.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to check in attendees",
    });
  }

  // Find attendee
  const attendeeIndex = event.attendees.findIndex(
    (attendee) => attendee.user.toString() === req.params.userId
  );

  if (attendeeIndex === -1) {
    return res.status(404).json({
      success: false,
      error: "Attendee not found",
    });
  }

  // Update attendee
  event.attendees[attendeeIndex].attended = true;
  event.attendees[attendeeIndex].checkedInAt = Date.now();

  await event.save();

  res.status(200).json({
    success: true,
    data: event,
  });
});

// @desc    Get event attendees
// @route   GET /api/events/:id/attendees
// @access  Private (Admin or Organizer only)
exports.getEventAttendees = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate(
    "attendees.user",
    "firstName lastName email role"
  );

  if (!event) {
    return res.status(404).json({
      success: false,
      error: "Event not found",
    });
  }

  // Make sure user is event organizer or admin
  if (
    event.organizer.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      error: "Not authorized to view attendees",
    });
  }

  res.status(200).json({
    success: true,
    count: event.attendees.length,
    data: event.attendees,
  });
});
