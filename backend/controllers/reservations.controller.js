const Reservation = require('../models/Reservation');
const Resource = require('../models/Resource');
const User = require('../models/User');
const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc      Get all reservations
// @route     GET /api/reservations
// @access    Private (Admin only)
exports.getReservations = asyncHandler(async (req, res, next) => {
  const reservations = await Reservation.find()
    .populate({
      path: 'resource',
      select: 'name type location'
    })
    .populate({
      path: 'user',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'approvedBy',
      select: 'firstName lastName email'
    });
  
  res.status(200).json({
    success: true,
    count: reservations.length,
    data: reservations
  });
});

// @desc      Get user reservations
// @route     GET /api/reservations/user
// @access    Private
exports.getUserReservations = asyncHandler(async (req, res, next) => {
  const reservations = await Reservation.find({ user: req.user.id })
    .populate({
      path: 'resource',
      select: 'name type location'
    })
    .populate({
      path: 'approvedBy',
      select: 'firstName lastName email'
    });
  
  res.status(200).json({
    success: true,
    count: reservations.length,
    data: reservations
  });
});

// @desc      Get resource reservations
// @route     GET /api/reservations/resource/:resourceId
// @access    Private
exports.getResourceReservations = asyncHandler(async (req, res, next) => {
  const resourceId = req.params.resourceId;
  
  // Check if resource exists
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    return next(new ErrorResponse(`Resource not found with id of ${resourceId}`, 404));
  }
  
  const reservations = await Reservation.find({ 
    resource: resourceId,
    status: { $in: ['pending', 'approved'] }
  })
    .populate({
      path: 'user',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'approvedBy',
      select: 'firstName lastName email'
    });
  
  res.status(200).json({
    success: true,
    count: reservations.length,
    data: reservations
  });
});

// @desc      Get single reservation
// @route     GET /api/reservations/:id
// @access    Private
exports.getReservation = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate({
      path: 'resource',
      select: 'name type location'
    })
    .populate({
      path: 'user',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'approvedBy',
      select: 'firstName lastName email'
    });
  
  if (!reservation) {
    return next(new ErrorResponse(`Reservation not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user is reservation owner or admin
  if (reservation.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this reservation`, 403));
  }
  
  res.status(200).json({
    success: true,
    data: reservation
  });
});

// @desc      Create new reservation
// @route     POST /api/reservations
// @access    Private (Lecturers and Admins only)
exports.createReservation = asyncHandler(async (req, res, next) => {
  // Log the entire request body for debugging
  console.log('Reservation creation request body:', JSON.stringify(req.body, null, 2));
  console.log('User making request:', req.user.id, req.user.firstName, req.user.lastName, req.user.role);
  
  // Add user to req.body
  req.body.user = req.user.id;
  
  // Check if user is lecturer or admin
  if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
    console.log('User role not authorized:', req.user.role);
    return next(new ErrorResponse(`User role ${req.user.role} is not authorized to create reservations`, 403));
  }
  
  console.log('Checking if resource exists:', req.body.resource);
  // Check if resource exists
  const resource = await Resource.findById(req.body.resource);
  if (!resource) {
    console.log('Resource not found:', req.body.resource);
    return next(new ErrorResponse(`Resource not found with id of ${req.body.resource}`, 404));
  }
  
  console.log('Resource found:', resource.name, 'Availability:', resource.availability);
  
  // Ensure the resource has a createdBy field
  if (!resource.createdBy) {
    console.log('Resource missing createdBy field. Adding current user as creator:', req.user.id);
    await Resource.findByIdAndUpdate(
      resource._id,
      { createdBy: req.user.id },
      { new: true }
    );
  }
  
  // Check if resource is available
  if (!resource.availability) {
    console.log('Resource not available:', resource.name);
    return next(new ErrorResponse(`Resource is not available for booking`, 400));
  }
  
  // Check if user is allowed to book this resource
  console.log('Checking if user role is allowed:', req.user.role, 'Allowed roles:', resource.allowedRoles);
  if (!resource.allowedRoles.includes(req.user.role)) {
    console.log('User role not allowed to book this resource:', req.user.role);
    return next(new ErrorResponse(`User role ${req.user.role} is not allowed to book this resource`, 403));
  }
  
  // Check for booking conflicts
  const { startTime, endTime } = req.body;
  console.log('Checking for booking conflicts. StartTime:', startTime, 'EndTime:', endTime);
  
  if (!startTime || !endTime) {
    console.log('Missing startTime or endTime:', { startTime, endTime });
    return next(new ErrorResponse('Start time and end time are required', 400));
  }
  
  try {
    // Ensure dates are valid
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    console.log('Parsed dates - Start:', startDate, 'End:', endDate);
    
    // Validate date logic
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.log('Invalid date format');
      return next(new ErrorResponse('Invalid date format for start or end time', 400));
    }
    
    if (startDate >= endDate) {
      console.log('Start time must be before end time');
      return next(new ErrorResponse('Start time must be before end time', 400));
    }
    
    const conflict = await Reservation.checkConflict(req.body.resource, startTime, endTime);
    
    if (conflict) {
      console.log('Booking conflict found:', conflict);
      return next(new ErrorResponse(`Reservation conflicts with an existing booking`, 400));
    }
    
    // If resource doesn't require approval, auto-approve the reservation
    console.log('Resource requires approval:', resource.reservationRequiresApproval);
    if (!resource.reservationRequiresApproval) {
      req.body.status = 'approved';
      
      // Update resource availability to false (unavailable)
      await Resource.findByIdAndUpdate(
        req.body.resource,
        { availability: false },
        { new: true }
      );
    }
    
    // Format date fields to ensure they're stored correctly
    req.body.startTime = startDate;
    req.body.endTime = endDate;
    
    console.log('Creating reservation with data:', req.body);
    const reservation = await Reservation.create(req.body);
    console.log('Reservation created:', reservation._id);
    
    // Create notification for admin users about the new reservation
    await Notification.create({
      recipient: null, // Will be filtered to admin users in the front end
      type: 'resource_approval',
      title: 'New Resource Reservation',
      content: `${req.user.firstName} ${req.user.lastName} has ${resource.reservationRequiresApproval ? 'requested' : 'booked'} ${resource.name}`,
      priority: 'medium',
      relatedModel: 'Reservation',
      relatedId: reservation._id
    });
    
    res.status(201).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return next(new ErrorResponse(`Error creating reservation: ${error.message}`, 400));
  }
});

// @desc      Update reservation
// @route     PUT /api/reservations/:id
// @access    Private
exports.updateReservation = asyncHandler(async (req, res, next) => {
  let reservation = await Reservation.findById(req.params.id);
  
  if (!reservation) {
    return next(new ErrorResponse(`Reservation not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user is reservation owner or admin
  if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this reservation`, 403));
  }
  
  // Cannot update approved reservations except by admin
  if (reservation.status === 'approved' && req.user.role !== 'admin') {
    return next(new ErrorResponse(`Cannot update an approved reservation`, 400));
  }
  
  // Check for booking conflicts if dates are being updated
  if (req.body.startTime || req.body.endTime) {
    const startTime = req.body.startTime || reservation.startTime;
    const endTime = req.body.endTime || reservation.endTime;
    
    const conflict = await Reservation.checkConflict(
      reservation.resource, 
      startTime, 
      endTime, 
      reservation._id
    );
    
    if (conflict) {
      return next(new ErrorResponse(`Reservation conflicts with an existing booking`, 400));
    }
  }
  
  reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: reservation
  });
});

// @desc      Approve reservation
// @route     PUT /api/reservations/:id/approve
// @access    Private (Admin only)
exports.approveReservation = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id);
  
  if (!reservation) {
    return next(new ErrorResponse(`Reservation not found with id of ${req.params.id}`, 404));
  }
  
  // Only admin can approve reservations
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse(`User is not authorized to approve reservations`, 403));
  }
  
  // Cannot approve if already approved or cancelled/rejected
  if (reservation.status !== 'pending') {
    return next(new ErrorResponse(`Cannot approve a ${reservation.status} reservation`, 400));
  }
  
  // Check for conflicts again in case another reservation was approved
  const conflict = await Reservation.checkConflict(
    reservation.resource, 
    reservation.startTime, 
    reservation.endTime, 
    reservation._id
  );
  
  if (conflict) {
    return next(new ErrorResponse(`Reservation conflicts with an existing booking`, 400));
  }
  
  // Update resource availability
  await Resource.findByIdAndUpdate(
    reservation.resource,
    { availability: false },
    { new: true }
  );
  
  // Update reservation
  const updatedReservation = await Reservation.findByIdAndUpdate(
    req.params.id,
    {
      status: 'approved',
      approvedBy: req.user.id,
      approvalDate: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  ).populate({
    path: 'resource',
    select: 'name type location'
  });
  
  // Send notification to user
  await Notification.create({
    recipient: reservation.user,
    type: 'resource_approval',
    title: 'Reservation Approved',
    content: `Your reservation for ${updatedReservation.resource.name} has been approved`,
    priority: 'high',
    relatedModel: 'Reservation',
    relatedId: reservation._id
  });
  
  res.status(200).json({
    success: true,
    data: updatedReservation
  });
});

// @desc      Reject reservation
// @route     PUT /api/reservations/:id/reject
// @access    Private (Admin only)
exports.rejectReservation = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id);
  
  if (!reservation) {
    return next(new ErrorResponse(`Reservation not found with id of ${req.params.id}`, 404));
  }
  
  // Only admin can reject reservations
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse(`User is not authorized to reject reservations`, 403));
  }
  
  // Cannot reject if already approved, rejected or cancelled
  if (reservation.status !== 'pending') {
    return next(new ErrorResponse(`Cannot reject a ${reservation.status} reservation`, 400));
  }
  
  // Ensure a reason is provided
  if (!req.body.rejectionReason) {
    return next(new ErrorResponse('Please provide a reason for rejection', 400));
  }
  
  // Update reservation
  const updatedReservation = await Reservation.findByIdAndUpdate(
    req.params.id,
    {
      status: 'rejected',
      approvedBy: req.user.id,
      approvalDate: Date.now(),
      rejectionReason: req.body.rejectionReason
    },
    {
      new: true,
      runValidators: true
    }
  ).populate({
    path: 'resource',
    select: 'name type location'
  });
  
  // Send notification to user
  await Notification.create({
    recipient: reservation.user,
    type: 'resource_rejection',
    title: 'Reservation Rejected',
    content: `Your reservation for ${updatedReservation.resource.name} has been rejected: ${req.body.rejectionReason}`,
    priority: 'high',
    relatedModel: 'Reservation',
    relatedId: reservation._id
  });
  
  res.status(200).json({
    success: true,
    data: updatedReservation
  });
});

// @desc      Cancel reservation
// @route     PUT /api/reservations/:id/cancel
// @access    Private
exports.cancelReservation = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id);
  
  if (!reservation) {
    return next(new ErrorResponse(`Reservation not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user is reservation owner or admin
  if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to cancel this reservation`, 403));
  }
  
  // Cannot cancel if already completed, rejected or cancelled
  if (['completed', 'rejected', 'cancelled'].includes(reservation.status)) {
    return next(new ErrorResponse(`Cannot cancel a ${reservation.status} reservation`, 400));
  }
  
  // If was approved, make resource available again
  if (reservation.status === 'approved') {
    // Check if there are any other current approved reservations for this resource
    const now = new Date();
    const currentApprovedReservations = await Reservation.findOne({
      resource: reservation.resource,
      status: 'approved',
      _id: { $ne: reservation._id },
      startTime: { $lte: now },
      endTime: { $gt: now }
    });
    
    // If no other current approved reservations, make resource available
    if (!currentApprovedReservations) {
      await Resource.findByIdAndUpdate(
        reservation.resource,
        { availability: true },
        { new: true }
      );
    }
  }
  
  // Update reservation
  const updatedReservation = await Reservation.findByIdAndUpdate(
    req.params.id,
    {
      status: 'cancelled'
    },
    {
      new: true,
      runValidators: true
    }
  ).populate({
    path: 'resource',
    select: 'name type location'
  });
  
  res.status(200).json({
    success: true,
    data: updatedReservation
  });
});

// @desc      Delete reservation
// @route     DELETE /api/reservations/:id
// @access    Private (Admin only)
exports.deleteReservation = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id);
  
  if (!reservation) {
    return next(new ErrorResponse(`Reservation not found with id of ${req.params.id}`, 404));
  }
  
  // Only admin can delete reservations
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse(`User is not authorized to delete reservations`, 403));
  }
  
  await reservation.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
}); 