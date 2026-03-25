const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Define department structure
const DEPARTMENTS = {
  "School of Engineering": [
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Computer Engineering",
    "Chemical Engineering",
  ],
  "School of Business": [
    "Business Administration",
    "Finance",
    "Marketing",
    "Accounting",
    "Management",
  ],
  "School of Science": [
    "Computer Science",
    "Physics",
    "Chemistry",
    "Biology",
    "Mathematics",
  ],
  "School of Arts and Humanities": [
    "History",
    "Literature",
    "Languages",
    "Philosophy",
    "Cultural Studies",
  ],
  "School of Social Sciences": [
    "Economics",
    "Psychology",
    "Sociology",
    "Political Science",
    "Anthropology",
  ],
  "School of Law": ["Law", "Criminal Justice"],
  "School of Medicine & Health Sciences": [
    "Medicine",
    "Nursing",
    "Public Health",
    "Pharmacy",
  ],
};

const mainDepartments = Object.keys(DEPARTMENTS);
const subDepartments = Object.values(DEPARTMENTS).flat();

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please add a first name"],
      trim: true,
      maxlength: [50, "First name cannot be more than 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Please add a last name"],
      trim: true,
      maxlength: [50, "Last name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    role: {
      type: String,
      enum: ["admin", "lecturer", "student"],
      default: "student",
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false,
    },
    mainDepartment: {
      type: String,
      enum: [...mainDepartments, "Administration"],
      default: function () {
        return this.role === "admin" ? "Administration" : "School of Science";
      },
    },
    subDepartment: {
      type: String,
      enum: [...subDepartments, "Administration"],
      default: function () {
        return this.role === "admin" ? "Administration" : "Computer Science";
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Export departments
UserSchema.statics.DEPARTMENTS = DEPARTMENTS;

// Virtual id
UserSchema.virtual("id").get(function () {
  return this._id.toString();
});

// Virtual department
UserSchema.virtual("department").get(function () {
  if (this.role === "admin") {
    return "Administration";
  }
  return `${this.mainDepartment} - ${this.subDepartment}`;
});

// Encrypt password
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Alias
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


// ⭐⭐⭐ FIXED PART ⭐⭐⭐
// Generate JWT token
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET || "smartcampussecret",
    {
      expiresIn: "7d",
    }
  );
};

module.exports = mongoose.model("User", UserSchema);