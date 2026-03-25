const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  resource: {
    type: mongoose.Schema.ObjectId,
    ref: 'Resource',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  purpose: {
    type: String,
    required: [true, 'Please specify the purpose'],
    maxlength: [500, 'Purpose cannot be more than 500 characters']
  },
  startTime: {
    type: Date,
    required: [true, 'Please add a start time']
  },
  endTime: {
    type: Date,
    required: [true, 'Please add an end time']
  },
  attendees: {
    type: Number,
    required: [true, 'Please specify the number of attendees']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrencePattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
    },
    daysOfWeek: {
      type: [Number] // 0 = Sunday, 1 = Monday, etc.
    },
    endDate: {
      type: Date
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for efficient querying
ReservationSchema.index({ resource: 1, startTime: 1, endTime: 1 });
ReservationSchema.index({ user: 1, status: 1 });

// Method to check for reservation conflicts
ReservationSchema.statics.checkConflict = async function(resourceId, startTime, endTime, reservationId = null) {
  const query = {
    $and: [
      { resource: resourceId },
      { status: { $in: ['pending', 'approved'] } },
      { startTime: { $lt: endTime } },
      { endTime: { $gt: startTime } }
    ]
  };

  // If updating an existing reservation, exclude it from the conflict check
  if (reservationId) {
    query._id = { $ne: reservationId };
  }

  const conflictingReservation = await this.findOne(query);
  return conflictingReservation;
};

module.exports = mongoose.model('Reservation', ReservationSchema); 