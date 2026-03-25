const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please add a title"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  startDate: {
    type: Date,
    required: [true, "Please add a start date"],
  },
  endDate: {
    type: Date,
    required: [true, "Please add an end date"],
  },
  location: {
    type: String,
    required: [true, "Please add a location"],
  },
  type: {
    type: String,
    enum: ["class", "lecture", "meeting", "exam", "workshop", "event", "other"],
    default: "other",
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  resources: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
    },
  ],
  recurrence: {
    type: String,
    enum: ["none", "daily", "weekly", "biweekly", "monthly"],
    default: "none",
  },
  targetAudience: {
    type: String,
    enum: ["Students", "Lecturers", "All"],
    default: "All",
  },
  color: {
    type: String,
    default: "#3788d8",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Validate that end date is after start date
ScheduleSchema.pre("validate", function (next) {
  if (this.endDate && this.startDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date must be after start date");
  }
  next();
});

module.exports = mongoose.model("Schedule", ScheduleSchema);
