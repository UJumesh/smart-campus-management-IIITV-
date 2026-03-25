const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  console.log('Auth middleware headers:', JSON.stringify(req.headers));

  // Get token from header or cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
    console.log('Token from Authorization header:', token ? token.substring(0, 10) + '...' : 'No token');
  } else if (req.cookies.token) {
    // Set token from cookie
    token = req.cookies.token;
    console.log('Token from cookies:', token ? token.substring(0, 10) + '...' : 'No token');
  }

  // Make sure token exists
  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Get user from the token
    const user = await User.findById(decoded.id || decoded._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No user found with this id'
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact an administrator.'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorize middleware - User role:', req.user.role, 'Allowed roles:', roles);
    
    if (!roles.includes(req.user.role)) {
      console.log('Authorization failed: User role not in allowed roles');
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    console.log('Authorization successful');
    next();
  };
};

// Track last activity
exports.trackActivity = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.id) {
    // Update last active timestamp
    await User.findByIdAndUpdate(req.user.id, {
      lastActive: Date.now()
    });
  }
  next();
}); 