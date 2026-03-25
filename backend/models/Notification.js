const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'event_invitation',
      'event_reminder',
      'schedule_change',
      'resource_approval',
      'resource_rejection',
      'message',
      'announcement',
      'system',
      'other'
    ],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a notification title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Please add notification content'],
    trim: true,
    maxlength: [500, 'Content cannot be more than 500 characters']
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  link: {
    type: String
  },
  relatedModel: {
    type: String,
    enum: ['Event', 'Schedule', 'Resource', 'Reservation', 'Message', 'Conversation', 'User', null],
    default: null
  },
  relatedId: {
    type: mongoose.Schema.ObjectId
  },
  deliveryStatus: {
    inApp: {
      delivered: {
        type: Boolean,
        default: true
      },
      deliveredAt: {
        type: Date,
        default: Date.now
      }
    },
    email: {
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: {
        type: Date
      }
    },
    sms: {
      delivered: {
        type: Boolean,
        default: false
      },
      deliveredAt: {
        type: Date
      }
    }
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for efficient querying
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, priority: 1 });
NotificationSchema.index({ relatedModel: 1, relatedId: 1 });

module.exports = mongoose.model('Notification', NotificationSchema); 