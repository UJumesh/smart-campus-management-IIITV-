const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("express-async-handler");
const sendEmail = require("../utils/sendEmail");

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  try {
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    // Ensure all required fields are present
    if (!user._id || !user.email || !user.role) {
      throw new Error("Invalid user data: Missing required fields");
    }

    // Format user response with all required fields
    const userResponse = {
      id: user._id.toString(), // Ensure ID is a string
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      name: user.name || `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role || "student", // Set default role to student
      profileImage: user.profileImage || "default-avatar.jpg",
      notificationPreferences: user.notificationPreferences || {
        email: true,
        sms: false,
        inApp: true,
      },
    };

    // Log the response being sent
    console.log("Sending auth response:", {
      success: true,
      token: token ? "Token present" : "Token missing",
      user: { ...userResponse, email: "***" }, // Log user data without sensitive info
    });

    res.status(statusCode).cookie("token", token, options).json({
      success: true,
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Error in sendTokenResponse:", error);
    throw error;
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  // allow only IIIT Vadodara email
if (!email.endsWith("@iiitvadodara.ac.in")) {
  throw new ErrorResponse("Only IIIT Vadodara email allowed", 400);
}

  // Validate required fields
  if (!firstName || !lastName || !email || !password) {
    throw new ErrorResponse("Please provide all required fields", 400);
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ErrorResponse("Email already registered", 400);
    }

    // Create user with role from request or default to 'student'
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || "student",
    });

    // Send welcome email
    try {
      await sendEmail({
        email: user.email,
        subject: "Welcome to Smart Campus",
        message: `
          <h1>Welcome to Smart Campus</h1>
          <p>Hello ${user.firstName},</p>
          <p>Thank you for registering with Smart Campus. Your account has been created successfully.</p>
          <p>You can now log in using your email and password.</p>
        `,
      });
    } catch (err) {
      console.error("Welcome email could not be sent:", err);
    }

    // Send token response
    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error("Registration error:", error);
    throw new ErrorResponse(
      error.message || "Error during registration",
      error.statusCode || 500
    );
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // allow only IIIT Vadodara email
if (!email.endsWith("@iiitvadodara.ac.in")) {
  throw new ErrorResponse("Login allowed only with IIIT Vadodara email", 400);
}

  console.log("Login attempt for email:", email);

  try {
    // Validate email & password
    if (!email || !password) {
      console.log("Login failed: Missing email or password");
      throw new ErrorResponse("Please provide email and password", 400);
    }

    // Check for user and include password field
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.log("Login failed: User not found for email:", email);
      throw new ErrorResponse("Invalid credentials", 401);
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log("Login failed: Invalid password for email:", email);
      throw new ErrorResponse("Invalid credentials", 401);
    }

    // Log successful authentication
    console.log("Login successful for user:", {
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Ensure user has required fields
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          lastActive: Date.now(),
          role: user.role || "student",
          notificationPreferences: {
            email: true,
            sms: false,
            inApp: true,
            ...user.notificationPreferences,
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      console.error("Failed to update user data after login");
      throw new ErrorResponse("Error updating user data", 500);
    }

    // Send token response
    sendTokenResponse(updatedUser, 200, res);
  } catch (error) {
    console.error("Login error:", {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
    });

    throw new ErrorResponse(
      error.message || "Error logging in",
      error.statusCode || 500
    );
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    throw new ErrorResponse("There is no user with that email", 404);
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  const message = `
    <h1>Password Reset Request</h1>
    <p>You are receiving this email because you (or someone else) has requested to reset your password.</p>
    <p>Please click on the following link to reset your password:</p>
    <a href="${resetUrl}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
    <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
    <p>This link will expire in 10 minutes.</p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      message,
    });

    res.status(200).json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ErrorResponse("Email could not be sent", 500);
  }
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ErrorResponse("Invalid or expired reset token", 400);
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Send token response
  sendTokenResponse(user, 200, res);
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("+password");

  // Check current password
  const isMatch = await user.comparePassword(req.body.currentPassword);

  if (!isMatch) {
    throw new ErrorResponse("Current password is incorrect", 401);
  }

  user.password = req.body.newPassword;
  await user.save();

  // Send token response
  sendTokenResponse(user, 200, res);
});

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// @desc    Verify JWT token
// @route   GET /api/auth/verify
// @access  Public
exports.verifyToken = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Check if token exists
  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user by ID
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    // Format user response with all required fields
    const userResponse = {
      id: user._id.toString(),
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      name: user.name || `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role || "student",
      profileImage: user.profileImage || "default-avatar.jpg",
      notificationPreferences: user.notificationPreferences || {
        email: true,
        sms: false,
        inApp: true,
      },
    };

    // Send response
    res.status(200).json({
      success: true,
      data: userResponse,
      token,
    });
  } catch (err) {
    console.error("Token verification error:", err.message);
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
});

// @desc    Refresh JWT token
// @route   POST /api/auth/refresh-token
// @access  Public (with valid token)
exports.refreshToken = asyncHandler(async (req, res, next) => {
  try {
    // Get token from request body
    const { token } = req.body;

    // Check if token exists
    if (!token) {
      return next(new ErrorResponse("No token provided", 400));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID
    const user = await User.findById(decoded.id || decoded._id);

    if (!user) {
      return next(new ErrorResponse("User not found", 404));
    }

    // Check if user is active
    if (user.status === "inactive") {
      return next(new ErrorResponse("Your account is inactive", 403));
    }

    // Generate new token with extended expiration
    const newToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE || "30d",
      }
    );

    // Format user response
    const userResponse = {
      id: user._id.toString(),
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      name: user.name || `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role || "student",
      profileImage: user.profileImage || "default-avatar.jpg",
    };

    // Update last login time
    user.lastLogin = Date.now();
    await user.save();

    // Send response with new token
    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      token: newToken,
      user: userResponse,
    });
  } catch (err) {
    console.error("Token refresh error:", err.message);

    // If the token is invalid, return a specific error
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return next(new ErrorResponse("Invalid or expired token", 401));
    }

    return next(new ErrorResponse("Failed to refresh token", 500));
  }
});
