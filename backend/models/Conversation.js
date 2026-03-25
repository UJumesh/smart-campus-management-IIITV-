const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  type: {
    type: String,
    enum: ['direct', 'group', 'course'],
    default: 'direct'
  },
  participants: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date
    }
  }],
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Schedule'
  },
  avatar: {
    type: String
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  lastMessage: {
    type: mongoose.Schema.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
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

// Create index for efficient querying
ConversationSchema.index({ 'participants.user': 1 });
ConversationSchema.index({ course: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

// Pre-save hook to update the updatedAt field
ConversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for unread messages count (to be implemented in the controller)
ConversationSchema.virtual('unreadCount').get(function() {
  return 0; // Placeholder, actual implementation in controller
});

// Set virtuals to be included in JSON output
ConversationSchema.set('toJSON', { virtuals: true });
ConversationSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Conversation', ConversationSchema); 