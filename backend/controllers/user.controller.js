const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('express-async-handler');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
  console.log('getUsers controller called');
  
  // Add debug for query params
  console.log('Query parameters:', req.query);
  
  // Build query
  const query = {};
  
  // Add search functionality
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex }
    ];
  }
  
  // Filter by role
  if (req.query.role) {
    query.role = req.query.role;
  }
  
  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  // Filter by main department
  if (req.query.mainDepartment) {
    query.mainDepartment = req.query.mainDepartment;
  }
  
  // Filter by sub department
  if (req.query.subDepartment) {
    query.subDepartment = req.query.subDepartment;
  }
  
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  console.log('Query:', query);
  console.log('Pagination:', { page, limit, startIndex });
  
  try {
    // Get total count
    const total = await User.countDocuments(query);
    
    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    console.log(`Found ${users.length} users out of ${total} total`);
    
    res.status(200).json({
      success: true,
      count: total,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    throw new ErrorResponse(`User not found with id of ${req.params.id}`, 404);
  }
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!user) {
    throw new ErrorResponse(`User not found with id of ${req.params.id}`, 404);
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private (any authenticated user)
exports.updateProfile = asyncHandler(async (req, res) => {
  // Get user from token
  const user = await User.findById(req.user.id).select('-password');

  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }

  console.log(`Profile update requested by user: ${user._id}, role: ${user.role}`);
  
  // All authenticated users can update their own profile
  // No role check needed here - this is intentionally accessible to all roles

  // Create updatable fields object
  const updatableFields = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    mobilePhone: req.body.mobilePhone,
    landlinePhone: req.body.landlinePhone,
    dateOfBirth: req.body.dateOfBirth,
    gender: req.body.gender,
    enrollmentYear: req.body.enrollmentYear,
    programName: req.body.programName,
    designation: req.body.designation,
    address: req.body.address,
    emergencyContact: req.body.emergencyContact
  };

  // Only allow admin users to update department fields
  if (req.user.role === 'admin') {
    updatableFields.mainDepartment = req.body.mainDepartment;
    updatableFields.subDepartment = req.body.subDepartment;
  }

  // Clean the update data
  Object.keys(updatableFields).forEach(key => {
    if (updatableFields[key] === undefined) {
      delete updatableFields[key];
    }
  });

  // Update user
  const updatedUser = await User.findByIdAndUpdate(req.user.id, updatableFields, {
    new: true,
    runValidators: true
  }).select('-password');

  console.log(`Profile updated successfully for user: ${updatedUser._id}`);

  res.status(200).json({
    success: true,
    data: updatedUser
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ErrorResponse(`User not found with id of ${req.params.id}`, 404);
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
}); 