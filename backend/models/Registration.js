const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event ID is required']
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: {
    type: Date
  },
  attendanceStatus: {
    type: String,
    enum: ['registered', 'attended', 'no-show'],
    default: 'registered'
  }
}, {
  timestamps: true
});

// Prevent duplicates - a user can only register once for an event
RegistrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', RegistrationSchema); 