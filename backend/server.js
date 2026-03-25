// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const cookieParser = require("cookie-parser");
const colors = require("colors");
const errorHandler = require("./middleware/error");
const { protect, authorize } = require("./middleware/auth");
const jwt = require("jsonwebtoken");
const { initSchedulers } = require("./utils/schedulers");

// Import routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const scheduleRoutes = require("./routes/schedule.routes");
const eventRoutes = require("./routes/events.routes");
const resourceRoutes = require("./routes/resource.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const messageRoutes = require("./routes/message.routes");
const notificationRoutes = require("./routes/notification.routes");
const reservationRoutes = require("./routes/reservations");

// Load environment variables
dotenv.config();

// Import models - use existing model if already defined
let User;
try {
  // Check if model is already defined
  User = mongoose.models.User;
  if (!User) {
    // If not, require it
    User = require("./models/User");
  }
} catch (error) {
  console.log("Error loading User model:", error.message);
  // Fallback to requiring the model
  User = require("./models/User");
}

// Make User and mongoose available globally for route modules
global.User = User;
global.mongoose = mongoose;
global.registeredUsers = [];

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "blob:"],
      },
    },
  })
);

// Logger middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5002",
      "http://localhost:5003",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
  })
);

// Additional headers for CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Set up static folder for uploads and public files
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use(express.static(path.join(__dirname, "public")));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`.cyan);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Function to get registered users
const getRegisteredUsers = async (includePassword = false) => {
  // If MongoDB is connected, get users from database
  if (mongoose.connection.readyState === 1) {
    try {
      console.log("Fetching users from MongoDB...");
      // Only exclude password if includePassword is false
      const users = includePassword
        ? await User.find()
        : await User.find().select("-password");
      console.log(`Retrieved ${users.length} users from MongoDB`);
      return users;
    } catch (error) {
      console.error("Error fetching users from MongoDB:", error);
      // Fall back to in-memory users
      console.log(
        `Falling back to in-memory storage with ${global.registeredUsers.length} users`
      );
      return global.registeredUsers;
    }
  }
  // Otherwise, return in-memory users
  console.log(
    `Using in-memory storage with ${global.registeredUsers.length} users`
  );
  return global.registeredUsers;
};

// Function to add a registered user
const addRegisteredUser = async (userData) => {
  console.log("\n=== Adding New User ===");
  console.log("User Data:", userData);
  console.log(
    "MongoDB Status:",
    mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
  );

  // If MongoDB is connected, add user to database
  if (mongoose.connection.readyState === 1) {
    try {
      console.log("Attempting to add user to MongoDB...");
      // Create a copy of userData without the id field for MongoDB
      const mongoUserData = { ...userData };
      // Remove the custom id field as MongoDB will generate its own _id
      if (mongoUserData.id) {
        delete mongoUserData.id;
      }
      const user = await User.create(mongoUserData);
      // Add the MongoDB _id as the id field for consistency
      user.id = user._id.toString();
      console.log("User successfully added to MongoDB:", user);
      return user;
    } catch (error) {
      console.error("Error adding user to MongoDB:", error);
      // Fall back to in-memory storage
      console.log(
        "Falling back to in-memory storage for user:",
        userData.email
      );
      global.registeredUsers.push(userData);
      return userData;
    }
  }

  // Otherwise, add to in-memory array
  console.log(
    "MongoDB not connected, adding user to in-memory storage:",
    userData.email
  );
  global.registeredUsers.push(userData);
  return userData;
};

// Function to remove a registered user
const removeRegisteredUser = async (userId) => {
  console.log("Removing user with ID:", userId);

  // If MongoDB is connected, remove user from database
  if (mongoose.connection.readyState === 1) {
    try {
      const result = await User.findByIdAndDelete(userId);
      if (!result) {
        // Try finding by custom id field
        const user = await User.findOne({ id: userId });
        if (user) {
          await User.findByIdAndDelete(user._id);
        } else {
          return false; // User not found
        }
      }
      return true; // User deleted successfully
    } catch (error) {
      console.error("Error removing user from MongoDB:", error);
      // Fall back to in-memory removal
    }
  }

  // Remove from in-memory array
  const userIndex = global.registeredUsers.findIndex(
    (u) => u.id === userId || u._id === userId
  );
  if (userIndex !== -1) {
    global.registeredUsers.splice(userIndex, 1);
    return true; // User deleted successfully
  }

  return false; // User not found
};

// Initialize with some default registered users
const initializeDefaultUsers = async () => {
  try {
    // Add default admin user
    const adminExists =
      mongoose.connection.readyState === 1
        ? await User.findOne({ email: "admin@smartcampus.edu" })
        : global.registeredUsers.find(
            (u) => u.email === "admin@smartcampus.edu"
          );

    if (!adminExists) {
      await addRegisteredUser({
        id: "admin-1",
        firstName: "Admin",
        lastName: "User",
        email: "admin@smartcampus.edu",
        password: "admin123",
        role: "admin",
        department: "Administration",
        status: "active",
        lastLogin: new Date().toISOString(),
        createdAt: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
      console.log("Added default admin user");
    }

    // Add default lecturer
    const lecturerExists =
      mongoose.connection.readyState === 1
        ? await User.findOne({ email: "john.cena@smartcampus.edu" })
        : global.registeredUsers.find(
            (u) => u.email === "john.cena@smartcampus.edu"
          );

    if (!lecturerExists) {
      await addRegisteredUser({
        id: "lecturer-1",
        firstName: "John",
        lastName: "Cena",
        email: "john.cena@smartcampus.edu",
        password: "password123",
        role: "lecturer",
        department: "Computer Science",
        status: "active",
        lastLogin: new Date().toISOString(),
        createdAt: new Date(
          Date.now() - 25 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
      console.log("Added default lecturer user");
    }

    // Add default student
    const studentExists =
      mongoose.connection.readyState === 1
        ? await User.findOne({ email: "jane.froster@smartcampus.edu" })
        : global.registeredUsers.find(
            (u) => u.email === "jane.froster@smartcampus.edu"
          );

    if (!studentExists) {
      await addRegisteredUser({
        id: "student-1",
        firstName: "Jane",
        lastName: "Froster",
        email: "jane.froster@smartcampus.edu",
        password: "password123",
        role: "student",
        department: "Computer Science",
        status: "active",
        lastLogin: new Date().toISOString(),
        createdAt: new Date(
          Date.now() - 20 * 24 * 60 * 60 * 1000
        ).toISOString(),
      });
      console.log("Added default student user");
    }
  } catch (error) {
    console.error("Error initializing default users:", error);
  }
};

// Mock login endpoint with proper validation
// Register endpoint (IIIT Vadodara email only)
app.post("/api/auth/register", async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
  }

  // Allow only IIIT Vadodara emails
  if (!email.toLowerCase().endsWith("@iiitvadodara.ac.in")) {
    return res.status(400).json({
      success: false,
      message: "Only IIIT Vadodara email allowed",
    });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const newUser = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: role || "student",
      department: req.body.department || "Not Assigned",
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

// Mock register endpoint
app.post("/api/auth/register", async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields",
    });
  }

  try {
    const users = await getRegisteredUsers(true);

    const existingUser = users.find((user) => user.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const newUser = {
      id: `user-${Date.now()}`,
      firstName,
      lastName,
      email,
      password, // ⭐ IMPORTANT FIX
      role: role || "student",
      department: req.body.department || "Not Assigned",
      status: "active",
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    await addRegisteredUser(newUser);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: newUser.id,
        firstName,
        lastName,
        email,
        role: role || "student",
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during registration",
    });
  }
});

// Mock registered users endpoint
app.get("/api/auth/registered-users", async (req, res) => {
  try {
    const users = await getRegisteredUsers();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching registered users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching registered users",
    });
  }
});

// MOCK USERS ENDPOINT - COMPLETELY BYPASSES AUTHENTICATION
app.get("/api/users", async (req, res) => {
  console.log("GET /api/users request received");
  try {
    // Get query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "";
    const department = req.query.department || "";
    const status = req.query.status || "";

    console.log("Query parameters:", {
      page,
      limit,
      search,
      role,
      department,
      status,
    });

    // Get registered users
    const registeredUsers = await getRegisteredUsers();
    console.log(`Retrieved ${registeredUsers.length} registered users`);

    // Use only registered users (no mock users)
    const allUsers = [...registeredUsers];
    console.log(`Total users: ${allUsers.length}`);

    // Filter users based on search and filters
    let filteredUsers = allUsers.filter((user) => {
      const searchMatch =
        !search ||
        user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase());

      const roleMatch = !role || user.role === role;
      const deptMatch = !department || user.department === department;
      const statusMatch = !status || user.status === status;

      return searchMatch && roleMatch && deptMatch && statusMatch;
    });

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    console.log(
      `Returning ${paginatedUsers.length} users (filtered from ${filteredUsers.length})`
    );

    // Return response
    return res.status(200).json({
      success: true,
      count: filteredUsers.length,
      data: paginatedUsers,
      page,
      pages: Math.ceil(filteredUsers.length / limit),
    });
  } catch (error) {
    console.error("Error in /api/users endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + (error.message || "Unknown error"),
    });
  }
});

// CREATE USER ENDPOINT
app.post("/api/users", protect, authorize("admin"), async (req, res) => {
  console.log("POST /api/users request received");
  try {
    const userData = req.body;
    console.log("Creating new user:", {
      ...userData,
      password: userData.password ? "[PROVIDED]" : "[DEFAULT]",
    });

    // Validate required fields
    if (
      !userData.firstName ||
      !userData.lastName ||
      !userData.email ||
      !userData.role
    ) {
      console.log("Validation failed: Missing required fields");
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: firstName, lastName, email, role",
      });
    }

    // Validate departments for non-admin roles
    if (userData.role !== "admin") {
      if (!userData.mainDepartment || !userData.subDepartment) {
        return res.status(400).json({
          success: false,
          message: "Please provide both main department and sub-department",
        });
      }

      // Validate main department
      if (!User.DEPARTMENTS[userData.mainDepartment]) {
        return res.status(400).json({
          success: false,
          message: "Invalid main department",
        });
      }

      // Validate sub-department
      if (
        !User.DEPARTMENTS[userData.mainDepartment].includes(
          userData.subDepartment
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid sub-department for the selected main department",
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log(`User with email ${userData.email} already exists`);
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create a new user using the User model
    const newUser = await User.create({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password || "password123", // Use provided password or default
      role: userData.role,
      mainDepartment:
        userData.role === "admin" ? "Administration" : userData.mainDepartment,
      subDepartment:
        userData.role === "admin" ? "Administration" : userData.subDepartment,
      status: userData.status || "active",
      lastLogin: null,
    });

    console.log("User successfully created:", newUser.email);

    // Remove sensitive data from response
    const responseUser = newUser.toObject();
    delete responseUser.password;

    // Add a message to indicate if default password was used
    const message = userData.password
      ? "User created successfully with provided password"
      : "User created successfully with default password: password123";

    return res.status(201).json({
      success: true,
      message: message,
      data: responseUser,
    });
  } catch (error) {
    console.error("Error in POST /api/users endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + (error.message || "Unknown error"),
    });
  }
});

// UPDATE USER ENDPOINT
app.put("/api/users/:id", protect, authorize("admin"), async (req, res) => {
  console.log(`PUT /api/users/${req.params.id} request received`);
  try {
    const userId = req.params.id;
    const updateData = req.body;
    console.log("Updating user:", {
      ...updateData,
      password: updateData.password ? "[HIDDEN]" : undefined,
    });

    // Find the user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email is being changed and if it's already taken
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({ email: updateData.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email address is already in use",
        });
      }
    }

    // Handle department updates based on role
    try {
      const effectiveRole = updateData.role || user.role;

      // If changing to admin role, set both departments to Administration
      if (effectiveRole === "admin" && user.role !== "admin") {
        updateData.mainDepartment = "Administration";
        updateData.subDepartment = "Administration";
      }
      // If changing from admin to another role
      else if (user.role === "admin" && effectiveRole !== "admin") {
        updateData.mainDepartment =
          updateData.mainDepartment || "School of Science";
        updateData.subDepartment =
          updateData.subDepartment || "Computer Science";
      }
      // For non-admin roles, validate departments if they're being updated
      else if (effectiveRole !== "admin") {
        // Get the effective main department (either from update or current user)
        const effectiveMainDept =
          updateData.mainDepartment || user.mainDepartment;

        // Validate main department if it's being updated
        if (updateData.mainDepartment && !User.DEPARTMENTS[effectiveMainDept]) {
          return res.status(400).json({
            success: false,
            message: `Invalid main department: "${effectiveMainDept}". Valid options are: ${Object.keys(
              User.DEPARTMENTS
            ).join(", ")}`,
          });
        }

        // Get valid sub-departments for the effective main department
        const validSubDepts = User.DEPARTMENTS[effectiveMainDept] || [];

        // If updating sub-department, validate it against the effective main department
        if (
          updateData.subDepartment &&
          !validSubDepts.includes(updateData.subDepartment)
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid sub-department "${
              updateData.subDepartment
            }" for ${effectiveMainDept}. Valid options are: ${validSubDepts.join(
              ", "
            )}`,
          });
        }

        // If only updating main department, check if current sub-department is still valid
        if (updateData.mainDepartment && !updateData.subDepartment) {
          if (!validSubDepts.includes(user.subDepartment)) {
            updateData.subDepartment = validSubDepts[0];
            console.log(
              `Auto-selected sub-department ${updateData.subDepartment} for main department ${effectiveMainDept}`
            );
          }
        }
      }

      // Update the user with the validated data - don't run schema validators
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        {
          new: true,
          runValidators: false, // Skip schema validators since we've already validated
        }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found after update",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (validationError) {
      console.error("Validation error:", validationError);
      if (validationError.name === "ValidationError") {
        const errors = Object.values(validationError.errors).map(
          (err) => err.message
        );
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors,
        });
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Error in PUT /api/users/:id endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the user",
    });
  }
});

// DELETE USER ENDPOINT
app.delete("/api/users/:id", async (req, res) => {
  console.log(`DELETE /api/users/${req.params.id} request received`);
  try {
    const userId = req.params.id;
    console.log("Deleting user:", userId);

    // Use the removeRegisteredUser function to delete the user
    const deleted = await removeRegisteredUser(userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("User deleted successfully");

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/users/:id endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + (error.message || "Unknown error"),
    });
  }
});

// UPDATE USER STATUS ENDPOINT
app.patch(
  "/api/users/:id/status",
  protect,
  authorize("admin"),
  async (req, res) => {
    console.log(`PATCH /api/users/${req.params.id}/status request received`);
    try {
      const userId = req.params.id;
      const { status } = req.body;
      console.log("Updating user status:", userId, status);

      if (!status || !["active", "inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid status: active or inactive",
        });
      }

      // Find the user to update
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update user status
      user.status = status;
      await user.save();

      console.log("User status updated:", user.email, status);

      return res.status(200).json({
        success: true,
        message: "User status updated successfully",
        data: user,
      });
    } catch (error) {
      console.error("Error in PATCH /api/users/:id/status endpoint:", error);
      return res.status(500).json({
        success: false,
        message: "Server error: " + (error.message || "Unknown error"),
      });
    }
  }
);

// RESET USER PASSWORD ENDPOINT
app.post(
  "/api/users/:id/reset-password",
  protect,
  authorize("admin"),
  async (req, res) => {
    console.log(
      `POST /api/users/${req.params.id}/reset-password request received`
    );
    try {
      const userId = req.params.id;
      console.log("Resetting password for user:", userId);

      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Set the default password
      const defaultPassword = "password123";
      user.password = defaultPassword;
      await user.save(); // This will trigger the password hashing in the User model

      console.log("Password reset completed for user:", user.email);

      return res.status(200).json({
        success: true,
        message: "Password has been reset to system default",
        data: {
          id: userId,
          email: user.email,
        },
      });
    } catch (error) {
      console.error(
        "Error in POST /api/users/:id/reset-password endpoint:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Server error: " + (error.message || "Unknown error"),
      });
    }
  }
);

// BULK UPDATE USERS ENDPOINT
app.patch("/api/users/bulk", protect, authorize("admin"), async (req, res) => {
  console.log("PATCH /api/users/bulk request received");
  try {
    const { userIds, updates } = req.body;
    console.log("Bulk updating users:", userIds, updates);

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid array of user IDs",
      });
    }

    if (!updates || typeof updates !== "object") {
      return res.status(400).json({
        success: false,
        message: "Please provide valid updates",
      });
    }

    // Get registered users
    const registeredUsers = await getRegisteredUsers();

    // Find and update users
    const updatedUsers = [];

    for (const userId of userIds) {
      // Find the user to update
      const userIndex = registeredUsers.findIndex(
        (u) =>
          u.id === userId ||
          u._id === userId ||
          (u._id && u._id.toString() === userId)
      );

      if (userIndex !== -1) {
        // Update user data
        const updatedUser = {
          ...registeredUsers[userIndex],
          ...updates,
        };

        // Update in the array
        registeredUsers[userIndex] = updatedUser;
        updatedUsers.push(updatedUser);

        // If MongoDB is connected, update the user in the database
        if (mongoose.connection.readyState === 1) {
          try {
            // Try to update by MongoDB _id
            if (updatedUser._id) {
              await User.findByIdAndUpdate(updatedUser._id, updates, {
                new: true,
              });
            }
            // If no _id, try to update by custom id
            else if (updatedUser.id) {
              const user = await User.findOne({ id: updatedUser.id });
              if (user) {
                await User.findByIdAndUpdate(user._id, updates, { new: true });
              }
            }
          } catch (error) {
            console.error(`Error updating user ${userId} in MongoDB:`, error);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Users updated successfully",
      data: {
        count: updatedUsers.length,
        users: updatedUsers,
      },
    });
  } catch (error) {
    console.error("Error in PATCH /api/users/bulk endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + (error.message || "Unknown error"),
    });
  }
});

// DASHBOARD ENDPOINT - Provides data for user dashboards
app.get("/api/dashboard", protect, async (req, res) => {
  console.log("GET /api/dashboard request received");

  try {
    // Get user ID and role from the decoded token
    const userId = req.user.id;
    const userRole = req.user.role;
    console.log(
      `Generating dashboard for user ${userId} with role ${userRole}`
    );

    // Initialize dashboard data structure
    const dashboardData = {
      stats: {},
      recentActivities: [],
      upcomingEvents: [],
      notifications: [],
    };

    // Fetch real stats from the database based on user role
    if (userRole === "admin") {
      // For admin: count users by role, total courses, etc.
      const [
        totalUsers,
        totalActiveUsers,
        adminCount,
        lecturerCount,
        studentCount,
      ] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ status: "active" }),
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ role: "lecturer" }),
        User.countDocuments({ role: "student" }),
      ]);

      dashboardData.stats = {
        totalUsers,
        totalActiveUsers,
        adminCount,
        lecturerCount,
        studentCount,
        // You can add more real stats here
      };
    } else if (userRole === "lecturer") {
      // For lecturers: count their students, courses, etc.
      // This would depend on your data model
      const teacherData = await User.findById(userId);
      dashboardData.stats = {
        totalStudents: Math.floor(Math.random() * 100) + 50, // Replace with real query
        coursesCount: Math.floor(Math.random() * 5) + 1,
        // Add more lecturer-specific stats
      };
    } else {
      // For students: count their courses, assignments, etc.
      const studentData = await User.findById(userId);
      dashboardData.stats = {
        coursesEnrolled: Math.floor(Math.random() * 6) + 2,
        assignmentsPending: Math.floor(Math.random() * 5),
        // Add more student-specific stats
        enrolledCourses: [], // Empty array instead of mock courses
      };
    }

    // Get real recent activities - this would be from your activities collection
    // For this example, we'll still use synthetic data but with real timestamps
    dashboardData.recentActivities = [
      {
        id: "act1",
        type: "course",
        title: "Database Systems Lecture",
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        location: "Room 101",
      },
      {
        id: "act2",
        type: "meeting",
        title: "Project Team Meeting",
        date: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
        location: "Conference Room A",
      },
      {
        id: "act3",
        type: "assignment",
        title: "Programming Assignment Due",
        date: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
      },
    ];

    // Get upcoming events - in a real implementation these would come from your events collection
    dashboardData.upcomingEvents = [
      {
        id: "evt1",
        title: "Campus Tech Fair",
        date: new Date(Date.now() + 432000000).toISOString(), // 5 days from now
        location: "Main Hall",
      },
      {
        id: "evt2",
        title: "Guest Lecture: AI Ethics",
        date: new Date(Date.now() + 518400000).toISOString(), // 6 days from now
        location: "Auditorium B",
      },
      {
        id: "evt3",
        title: "Student Council Meeting",
        date: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
        location: "Meeting Room 2",
      },
    ];

    // Get notifications - in a real implementation these would come from your notifications collection
    // filtered for the specific user
    dashboardData.notifications = [
      {
        id: "notif1",
        title: "Course Schedule Updated",
        content: "The schedule for Database Systems has been updated.",
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        isRead: false,
      },
      {
        id: "notif2",
        title: "New Resource Available",
        content: "New study materials have been uploaded for Programming 101.",
        date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        isRead: true,
      },
      {
        id: "notif3",
        title: "Upcoming Maintenance",
        content: "The campus portal will be under maintenance this weekend.",
        date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        isRead: false,
      },
    ];

    // Include timestamp for client-side caching/refresh logic
    dashboardData.timestamp = new Date().toISOString();

    // Send real dashboard data
    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error generating dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Error generating dashboard data",
      error: error.message,
    });
  }
});

// LOGOUT ENDPOINT - Handles user logout
app.get("/api/auth/logout", protect, (req, res) => {
  console.log("GET /api/auth/logout request received");

  // Send success response
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// Also support POST for logout (for compatibility)
app.post("/api/auth/logout", protect, (req, res) => {
  console.log("POST /api/auth/logout request received");

  // Send success response
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Campus Management System API is running",
    version: "1.0.0",
    mongoDBStatus:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reservations", reservationRoutes);

// Test endpoint to verify API is working
app.get("/api/test", (req, res) => {
  console.log("Test endpoint hit");
  return res.status(200).json({
    success: true,
    message: "API is working",
  });
});

// GET DEPARTMENTS ENDPOINT
app.get("/api/departments", (req, res) => {
  console.log("GET /api/departments request received");
  try {
    const departments = User.DEPARTMENTS;
    return res.status(200).json({
      success: true,
      data: departments,
    });
  } catch (error) {
    console.error("Error in GET /api/departments endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + (error.message || "Unknown error"),
    });
  }
});

// DIRECT PROFILE UPDATE ENDPOINT - Accessible to all authenticated users
app.put("/api/user-profile", protect, async (req, res) => {
  console.log("DIRECT PUT /api/user-profile request received");
  try {
    // Get user from token
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(
      `Direct profile update for user: ${user._id}, role: ${user.role}`
    );

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
      emergencyContact: req.body.emergencyContact,
    };

    // Only allow admin users to update department fields
    if (req.user.role === "admin") {
      updatableFields.mainDepartment = req.body.mainDepartment;
      updatableFields.subDepartment = req.body.subDepartment;
    }

    // Clean the update data
    Object.keys(updatableFields).forEach((key) => {
      if (updatableFields[key] === undefined) {
        delete updatableFields[key];
      }
    });

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updatableFields,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    console.log(
      `Direct profile updated successfully for user: ${updatedUser._id}`
    );

    return res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error in PUT /api/user-profile endpoint:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + (error.message || "Unknown error"),
    });
  }
});

// Error handler middleware
app.use(errorHandler);

// Handle 404 - Keep this as the last route
app.use((req, res, next) => {
  console.log(`404 Not Found: ${req.originalUrl}`.yellow);
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.originalUrl}`,
    availableRoutes: [
      "/",
      "/health",
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/logout",
      "/api/auth/registered-users",
      "/api/users",
      "/api/analytics",
      "/api/dashboard",
    ],
  });
});

// MongoDB connection function
const connectDB = async (retries = 5) => {
  try {
    // Skip MongoDB connection if configured to do so
    if (process.env.SKIP_MONGODB === "true") {
      console.log("Skipping MongoDB connection as per configuration".yellow);
      return false;
    }

    // Get MongoDB URI from environment variables
    const mongoURI =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart-campus";

    console.log(`Attempting to connect to MongoDB at ${mongoURI}`.cyan);

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(
      `MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold
    );
    return true;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`.red);

    // Retry logic
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts left)`.yellow);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      return connectDB(retries - 1);
    }

    console.error(
      "Failed to connect to MongoDB after multiple attempts".red.bold
    );
    return false;
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    const isConnected = await connectDB();
    if (!isConnected) {
      console.log(
        "Server running in limited mode without MongoDB connection".yellow
      );
    }

    // Initialize default users
    await initializeDefaultUsers();

    // Initialize scheduled tasks
    initSchedulers();

    // Start server with port finding
    const findAvailablePort = (startPort, maxAttempts = 10) => {
      return new Promise((resolve, reject) => {
        let currentPort = startPort;
        let attempts = 0;

        const tryPort = (port) => {
          const testServer = http.createServer();

          testServer.once("error", (err) => {
            if (err.code === "EADDRINUSE") {
              console.log(
                `Port ${port} is in use, trying ${port + 1}...`.yellow
              );
              attempts++;
              if (attempts >= maxAttempts) {
                reject(
                  new Error(
                    `Could not find an available port after ${maxAttempts} attempts`
                  )
                );
              } else {
                tryPort(port + 1);
              }
            } else {
              reject(err);
            }
          });

          testServer.once("listening", () => {
            testServer.close(() => {
              resolve(port);
            });
          });

          testServer.listen(port);
        };

        tryPort(currentPort);
      });
    };

    const preferredPort = process.env.PORT || 5001;
    try {
      const PORT = await findAvailablePort(parseInt(preferredPort));
      server.listen(PORT, () => {
        console.log(
          `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.green
            .bold
        );
        console.log(`API URL: http://localhost:${PORT}`.cyan);
        console.log(`Frontend URL: ${process.env.FRONTEND_URL}`.cyan);

        // Initialize Socket.IO after server is running
        initializeSocketIO(server);
      });
    } catch (portError) {
      console.error(`Error finding available port: ${portError.message}`.red);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error starting server: ${error.message}`.red.bold);
    process.exit(1);
  }
};

// Socket.IO setup function
const initializeSocketIO = (server) => {
  console.log("Initializing Socket.IO server...".cyan);

  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket middleware for authenticating users
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error("Authentication token is required"));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error.message);
      next(new Error("Authentication error"));
    }
  });

  // Connection handling
  io.on("connection", (socket) => {
    console.log(
      `User connected: ${socket.user.firstName} ${socket.user.lastName} (${socket.user._id})`
        .green
    );

    // Join user to their personal room
    socket.join(`user:${socket.user._id}`);

    // Fetch and join user's conversation rooms
    joinUserConversations(socket);

    // Handle joining a specific conversation
    socket.on("join_conversation", (conversationId) => {
      console.log(
        `${socket.user.firstName} joined conversation: ${conversationId}`
      );
      socket.join(`conversation:${conversationId}`);
    });

    // Handle leaving a specific conversation
    socket.on("leave_conversation", (conversationId) => {
      console.log(
        `${socket.user.firstName} left conversation: ${conversationId}`
      );
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle sending a message
    socket.on("send_message", async (messageData) => {
      try {
        const { conversationId, content, attachments } = messageData;

        // Validate conversation exists and user is a participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        const isParticipant = conversation.participants.some(
          (p) => p.user.toString() === socket.user._id.toString()
        );

        if (!isParticipant) {
          socket.emit("error", {
            message: "Not authorized to send messages to this conversation",
          });
          return;
        }

        // Create message
        const message = await Message.create({
          sender: socket.user._id,
          conversation: conversationId,
          content,
          attachments: attachments || [],
          readBy: [{ user: socket.user._id }], // Mark as read by sender
        });

        // Update conversation last message and time
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
          lastMessageAt: message.createdAt,
        });

        // Populate message with sender info
        const populatedMessage = await Message.findById(message._id).populate({
          path: "sender",
          select: "firstName lastName email role",
        });

        // Emit message to all participants in the conversation
        io.to(`conversation:${conversationId}`).emit(
          "new_message",
          populatedMessage
        );

        // Send notifications to participants who aren't in the conversation room
        notifyConversationParticipants(
          conversation,
          socket.user._id,
          populatedMessage
        );
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Error sending message" });
      }
    });

    // Handle typing indicators
    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit("user_typing", {
        userId: socket.user._id,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
        isTyping,
      });
    });

    // Handle read receipts
    socket.on("mark_read", async ({ conversationId, messageId }) => {
      try {
        if (messageId) {
          // Mark specific message as read
          await Message.findByIdAndUpdate(messageId, {
            $addToSet: {
              readBy: {
                user: socket.user._id,
                readAt: new Date(),
              },
            },
          });

          // Emit read receipt to conversation
          socket.to(`conversation:${conversationId}`).emit("message_read", {
            messageId,
            userId: socket.user._id,
          });
        } else if (conversationId) {
          // Mark all unread messages in conversation as read
          await Message.updateMany(
            {
              conversation: conversationId,
              "readBy.user": { $ne: socket.user._id },
            },
            {
              $addToSet: {
                readBy: {
                  user: socket.user._id,
                  readAt: new Date(),
                },
              },
            }
          );

          // Update user's lastSeen in conversation
          await Conversation.findOneAndUpdate(
            {
              _id: conversationId,
              "participants.user": socket.user._id,
            },
            {
              "participants.$.lastSeen": new Date(),
            }
          );

          // Emit conversation read receipt
          socket
            .to(`conversation:${conversationId}`)
            .emit("conversation_read", {
              conversationId,
              userId: socket.user._id,
            });
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(
        `User disconnected: ${socket.user.firstName} ${socket.user.lastName}`
          .yellow
      );
    });
  });

  console.log("Socket.IO initialized successfully".green);
};

// Helper function to join user to their conversation rooms
const joinUserConversations = async (socket) => {
  try {
    const conversations = await Conversation.find({
      "participants.user": socket.user._id,
    });

    conversations.forEach((conversation) => {
      socket.join(`conversation:${conversation._id}`);
    });

    console.log(
      `${socket.user.firstName} joined ${conversations.length} conversation rooms`
    );
  } catch (error) {
    console.error("Error joining user conversations:", error);
  }
};

// Helper function to send notifications to conversation participants
const notifyConversationParticipants = (conversation, senderId, message) => {
  conversation.participants.forEach((participant) => {
    // Skip sender
    if (participant.user.toString() === senderId.toString()) {
      return;
    }

    // Emit to participant's personal room
    io.to(`user:${participant.user}`).emit("message_notification", {
      conversationId: conversation._id,
      message,
    });
  });
};

// Call startServer
startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error(`Error: ${err.message}`.red.bold);
  // Exit on uncaught exceptions as they are more serious
  process.exit(1);
});

// Export app for testing
module.exports = app;

