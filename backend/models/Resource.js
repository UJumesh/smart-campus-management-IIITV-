const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a resource name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  type: {
    type: String,
    required: [true, 'Please specify resource type'],
    enum: ['classroom', 'laboratory', 'equipment', 'facility', 'other'],
    default: 'classroom'
  },
  location: {
    building: {
      type: String,
      required: [true, 'Please specify building']
    },
    floor: {
      type: String,
      required: [true, 'Please specify floor']
    },
    roomNumber: {
      type: String
    }
  },
  capacity: {
    type: Number,
    required: function() {
      return this.type === 'classroom' || this.type === 'laboratory';
    }
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  features: [{
    type: String
  }],
  availability: {
    type: Boolean,
    default: true
  },
  maintenanceSchedule: [{
    startDate: Date,
    endDate: Date,
    description: String
  }],
  images: [{
    type: String
  }],
  reservationRequiresApproval: {
    type: Boolean,
    default: false
  },
  allowedRoles: {
    type: [String],
    enum: ['student', 'lecturer', 'admin'],
    default: ['lecturer', 'admin']
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for efficient querying
ResourceSchema.index({ type: 1, 'location.building': 1, 'location.floor': 1 });

module.exports = mongoose.model('Resource', ResourceSchema); 