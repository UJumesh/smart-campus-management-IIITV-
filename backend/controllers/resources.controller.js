const Resource = require('../models/Resource');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc      Get all resources
// @route     GET /api/resources
// @access    Private
exports.getResources = asyncHandler(async (req, res, next) => {
  console.log('GET /api/resources request received');
  console.log('Request user:', req.user ? req.user.name : 'No user');
  
  try {
    console.log('Fetching resources from database...');
    const resources = await Resource.find().populate('createdBy', 'name email');
    
    console.log(`Resources found: ${resources.length}`);
    if (resources.length === 0) {
      console.log('No resources found in the database');
    } else {
      console.log('Resources IDs:', resources.map(r => r._id));
      console.log('First resource details:', JSON.stringify(resources[0], null, 2));
    }
    
    const responseData = {
      success: true,
      count: resources.length,
      data: resources
    };
    
    console.log('Sending response with count:', resources.length);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error retrieving resources:', error);
    return next(new ErrorResponse('Error retrieving resources', 500));
  }
});

// @desc      Get single resource
// @route     GET /api/resources/:id
// @access    Private
exports.getResource = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id).populate('createdBy', 'name email');
  
  if (!resource) {
    return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: resource
  });
});

// @desc      Create new resource
// @route     POST /api/resources
// @access    Private (Admin only)
exports.createResource = asyncHandler(async (req, res, next) => {
  console.log('Create resource request received');
  
  // Make sure user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse(`User is not authorized to create resources`, 403));
  }
  
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;
    console.log('User ID added to request body:', req.user.id);
    
    // Deep clone the request body to avoid modifying the original
    const resourceData = JSON.parse(JSON.stringify(req.body));
    
    // Process nested objects
    try {
      // Handle location object
      if (typeof resourceData.location === 'string') {
        resourceData.location = JSON.parse(resourceData.location);
      }
      
      // Handle features array
      if (typeof resourceData.features === 'string') {
        resourceData.features = JSON.parse(resourceData.features);
      }
      
      // Handle maintenanceSchedule array
      if (typeof resourceData.maintenanceSchedule === 'string') {
        resourceData.maintenanceSchedule = JSON.parse(resourceData.maintenanceSchedule);
      }
      
      // Handle images array
      if (typeof resourceData.images === 'string') {
        resourceData.images = JSON.parse(resourceData.images);
      }
      
      // Handle allowedRoles array
      if (typeof resourceData.allowedRoles === 'string') {
        resourceData.allowedRoles = JSON.parse(resourceData.allowedRoles);
      }
      
      // Validate required fields
      if (!resourceData.name) {
        console.log('Name is required');
        return next(new ErrorResponse('Name is required', 400));
      }
      
      if (!resourceData.location || !resourceData.location.building) {
        console.log('Building is required');
        return next(new ErrorResponse('Building is required', 400));
      }
      
      if (!resourceData.location || !resourceData.location.floor) {
        console.log('Floor is required');
        return next(new ErrorResponse('Floor is required', 400));
      }
      
      if ((resourceData.type === 'classroom' || resourceData.type === 'laboratory') && !resourceData.capacity) {
        console.log('Capacity is required for classrooms and laboratories');
        return next(new ErrorResponse('Capacity is required for classrooms and laboratories', 400));
      }
      
      console.log('Processed resource data:', JSON.stringify(resourceData, null, 2));
      
      // Create resource in MongoDB
      console.log('Attempting to create resource in MongoDB...');
      const resource = await Resource.create(resourceData);
      console.log('Resource created successfully:', resource._id);
      
      return res.status(201).json({
        success: true,
        data: resource
      });
    } catch (parseError) {
      console.error('Error parsing nested objects:', parseError);
      return next(new ErrorResponse(`Error parsing resource data: ${parseError.message}`, 400));
    }
  } catch (error) {
    console.error('Error creating resource:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      console.log('Validation error:', messages);
      return next(new ErrorResponse(messages, 400));
    }
    if (error.code === 11000) {
      console.log('Duplicate key error');
      return next(new ErrorResponse('Duplicate resource name', 400));
    }
    return next(new ErrorResponse(`Server Error: ${error.message}`, 500));
  }
});

// @desc      Update resource
// @route     PUT /api/resources/:id
// @access    Private (Admin only)
exports.updateResource = asyncHandler(async (req, res, next) => {
  let resource = await Resource.findById(req.params.id);
  
  if (!resource) {
    return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse(`User is not authorized to update resources`, 403));
  }
  
  // Process nested objects if they're strings (from form data)
  if (req.body.location && typeof req.body.location === 'string') {
    req.body.location = JSON.parse(req.body.location);
  }
  
  if (req.body.features && typeof req.body.features === 'string') {
    req.body.features = JSON.parse(req.body.features);
  }
  
  if (req.body.maintenanceSchedule && typeof req.body.maintenanceSchedule === 'string') {
    req.body.maintenanceSchedule = JSON.parse(req.body.maintenanceSchedule);
  }
  
  if (req.body.images && typeof req.body.images === 'string') {
    req.body.images = JSON.parse(req.body.images);
  }
  
  if (req.body.allowedRoles && typeof req.body.allowedRoles === 'string') {
    req.body.allowedRoles = JSON.parse(req.body.allowedRoles);
  }
  
  resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: resource
  });
});

// @desc      Update resource availability
// @route     PATCH /api/resources/:id/availability
// @access    Private (Admin only)
exports.updateResourceAvailability = asyncHandler(async (req, res, next) => {
  let resource = await Resource.findById(req.params.id);
  
  if (!resource) {
    return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse(`User is not authorized to update resource availability`, 403));
  }
  
  // Check if availability is provided in request body
  if (req.body.availability === undefined) {
    return next(new ErrorResponse('Please provide availability status', 400));
  }
  
  resource = await Resource.findByIdAndUpdate(
    req.params.id, 
    { availability: req.body.availability }, 
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    data: resource
  });
});

// @desc      Delete resource
// @route     DELETE /api/resources/:id
// @access    Private (Admin only)
exports.deleteResource = asyncHandler(async (req, res, next) => {
  const resource = await Resource.findById(req.params.id);
  
  if (!resource) {
    return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user is admin
  if (req.user.role !== 'admin') {
    return next(new ErrorResponse(`User is not authorized to delete resources`, 403));
  }
  
  // Use deleteOne instead of remove() which is deprecated
  await resource.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc      Get resources by type
// @route     GET /api/resources/type/:type
// @access    Private
exports.getResourcesByType = asyncHandler(async (req, res, next) => {
  const { type } = req.params;
  
  // Validate resource type
  const validTypes = ['classroom', 'laboratory', 'equipment', 'facility', 'other'];
  if (!validTypes.includes(type)) {
    return next(new ErrorResponse(`Invalid resource type: ${type}`, 400));
  }
  
  const resources = await Resource.find({ type }).populate('createdBy', 'name email');
  
  res.status(200).json({
    success: true,
    count: resources.length,
    data: resources
  });
}); 