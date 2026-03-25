const Event = require('../models/Event');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('express-async-handler');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = asyncHandler(async (req, res) => {
  const { search, category, department, startDate, endDate } = req.query;
  
  // Build query
  const query = {};
  
  // Search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Filter by category
  if (category) {
    query.category = category;
  }
  
  // Filter by department
  if (department) {
    query.department = department;
  }
  
  // Filter by date range
  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) {
      query.startDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.startDate.$lte = new Date(endDate);
    }
  }
  
  try {
    const events = await Event.find(query)
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email')
      .sort({ startDate: 1 });
      
    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('organizer', 'firstName lastName email')
    .populate('attendees', 'firstName lastName email');

  if (!event) {
    return res.status(404).json({
      success: false,
      error: 'Event not found'
    });
  }

  res.status(200).json({
    success: true,
    data: event
  });
});

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Admin & Lecturer)
exports.createEvent = asyncHandler(async (req, res) => {
  // Add user to req.body
  req.body.organizer = req.user.id;
  req.body.createdBy = req.user.id;

  // Validate dates
  const startDate = new Date(req.body.startDate);
  const endDate = new Date(req.body.endDate);

  if (endDate < startDate) {
    return res.status(400).json({
      success: false,
      error: 'End date must be after start date'
    });
  }

  const event = await Event.create(req.body);

  res.status(201).json({
    success: true,
    data: event
  });
});

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin & Event Organizer)
exports.updateEvent = asyncHandler(async (req, res) => {
  let event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      success: false,
      error: 'Event not found'
    });
  }

  // Make sure user is event organizer or admin
  if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to update this event'
    });
  }

  // Validate dates if being updated
  if (req.body.startDate && req.body.endDate) {
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        error: 'End date must be after start date'
      });
    }
  }

  event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: event
  });
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin & Event Organizer)
exports.deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      success: false,
      error: 'Event not found'
    });
  }

  // Make sure user is event organizer or admin
  if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to delete this event'
    });
  }

  await event.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Toggle event featured status
// @route   PATCH /api/events/:id/featured
// @access  Private (Admin only)
exports.toggleFeatured = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      success: false,
      error: 'Event not found'
    });
  }

  event.isFeatured = !event.isFeatured;
  await event.save();

  res.status(200).json({
    success: true,
    data: event
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
      error: 'Event not found'
    });
  }

  // Check if event is full
  if (event.attendees.length >= event.capacity) {
    return res.status(400).json({
      success: false,
      error: 'Event is at full capacity'
    });
  }

  // Check if user is already registered
  if (event.attendees.includes(req.user.id)) {
    return res.status(400).json({
      success: false,
      error: 'Already registered for this event'
    });
  }

  event.attendees.push(req.user.id);
  await event.save();

  res.status(200).json({
    success: true,
    data: event
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
      error: 'Event not found'
    });
  }

  // Remove user from attendees
  event.attendees = event.attendees.filter(
    attendee => attendee.toString() !== req.user.id
  );

  await event.save();

  res.status(200).json({
    success: true,
    data: event
  });
});

// @desc    Get featured events
// @route   GET /api/events/featured
// @access  Public
exports.getFeaturedEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ isFeatured: true })
    .populate('organizer', 'firstName lastName email')
    .sort({ startDate: 1 });

  res.status(200).json({
    success: true,
    count: events.length,
    data: events
  });
});

// @desc    Get events by department
// @route   GET /api/events/department/:department
// @access  Public
exports.getEventsByDepartment = asyncHandler(async (req, res) => {
  const events = await Event.find({ department: req.params.department })
    .populate('organizer', 'firstName lastName email')
    .sort({ startDate: 1 });

  res.status(200).json({
    success: true,
    count: events.length,
    data: events
  });
});

exports.getCurrentUserRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ 
      user: req.user.id 
    }).populate('event');
    
    res.status(200).json({ 
      success: true, 
      data: registrations 
    });
  } catch (err) {
    console.error('Registration fetch error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
}; 