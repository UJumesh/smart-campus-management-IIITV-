const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date']
  },
  venue: {
    type: String,
    required: [true, 'Please add a venue'],
    maxlength: [200, 'Venue cannot be more than 200 characters']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: [true, 'Please add a department']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Academic', 'Workshop', 'Seminar', 'Club', 'Sports', 'Social']
  },
  targetAudience: {
    type: String,
    required: [true, 'Please specify target audience'],
    enum: ['Students', 'Lecturers', 'All']
  },
  capacity: {
    type: Number,
    required: [true, 'Please specify maximum capacity']
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  poster: {
    type: String, // URL to the uploaded image
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Automatically update event status based on date
eventSchema.pre('save', function(next) {
  const now = new Date();
  if (now < this.startDate) {
    this.status = 'upcoming';
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = 'ongoing';
  } else {
    this.status = 'completed';
  }
  next();
});

// Ensure end date is after start date
eventSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);