const Schedule = require('../models/Schedule');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all schedules
// @route   GET /api/schedules
// @access  Private
exports.getSchedules = asyncHandler(async (req, res, next) => {
  const { startDate, endDate, type } = req.query;
  let query = {};

  // Add date range filter if provided
  if (startDate && endDate) {
    query.startDate = { $gte: new Date(startDate) };
    query.endDate = { $lte: new Date(endDate) };
  }

  // Add type filter if provided
  if (type) {
    query.type = type;
  }

  // Add user filter based on role
  if (req.user.role !== 'admin') {
    query.$or = [
      { createdBy: req.user._id },
      { 'attendees.user': req.user._id }
    ];
  }

  const schedules = await Schedule.find(query)
    .populate('createdBy', 'firstName lastName email')
    .populate('attendees.user', 'firstName lastName email')
    .sort({ startDate: 1 });

  res.status(200).json({
    success: true,
    count: schedules.length,
    data: schedules
  });
});

// @desc    Get single schedule
// @route   GET /api/schedules/:id
// @access  Private
exports.getSchedule = asyncHandler(async (req, res, next) => {
  const schedule = await Schedule.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email')
    .populate('attendees.user', 'firstName lastName email');

  if (!schedule) {
    return next(new ErrorResponse(`Schedule not found with id of ${req.params.id}`, 404));
  }

  // Check if user has access to this schedule
  if (req.user.role !== 'admin' && 
      schedule.createdBy._id.toString() !== req.user._id.toString() &&
      !schedule.attendees.some(a => a.user._id.toString() === req.user._id.toString())) {
    return next(new ErrorResponse(`Not authorized to access this schedule`, 403));
  }

  res.status(200).json({
    success: true,
    data: schedule
  });
});

// @desc    Create new schedule
// @route   POST /api/schedules
// @access  Private
exports.createSchedule = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user._id;

  // Validate dates
  const startDate = new Date(req.body.startDate);
  const endDate = new Date(req.body.endDate);

  if (endDate < startDate) {
    return next(new ErrorResponse('End date must be after start date', 400));
  }

  const schedule = await Schedule.create(req.body);

  res.status(201).json({
    success: true,
    data: schedule
  });
});

// @desc    Update schedule
// @route   PUT /api/schedules/:id
// @access  Private
exports.updateSchedule = asyncHandler(async (req, res, next) => {
  let schedule = await Schedule.findById(req.params.id);

  if (!schedule) {
    return next(new ErrorResponse(`Schedule not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is schedule owner or admin
  if (schedule.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Not authorized to update this schedule`, 403));
  }

  // Validate dates if they're being updated
  if (req.body.startDate && req.body.endDate) {
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    if (endDate < startDate) {
      return next(new ErrorResponse('End date must be after start date', 400));
    }
  }

  schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: schedule
  });
});

// @desc    Delete schedule
// @route   DELETE /api/schedules/:id
// @access  Private
exports.deleteSchedule = asyncHandler(async (req, res, next) => {
  const schedule = await Schedule.findById(req.params.id);

  if (!schedule) {
    return next(new ErrorResponse(`Schedule not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is schedule owner or admin
  if (schedule.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Not authorized to delete this schedule`, 403));
  }

  await schedule.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Update attendee status
// @route   PUT /api/schedules/:id/attendance
// @access  Private
exports.updateAttendanceStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!['accepted', 'declined', 'pending'].includes(status)) {
    return next(new ErrorResponse('Invalid status', 400));
  }

  const schedule = await Schedule.findById(req.params.id);

  if (!schedule) {
    return next(new ErrorResponse(`Schedule not found with id of ${req.params.id}`, 404));
  }

  // Find the attendee entry for the current user
  const attendeeIndex = schedule.attendees.findIndex(
    a => a.user.toString() === req.user._id.toString()
  );

  if (attendeeIndex === -1) {
    return next(new ErrorResponse('You are not an attendee of this schedule', 404));
  }

  // Update the status
  schedule.attendees[attendeeIndex].status = status;
  await schedule.save();

  res.status(200).json({
    success: true,
    data: schedule
  });
}); 