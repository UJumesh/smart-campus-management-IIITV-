const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  conversation: {
    type: mongoose.Schema.ObjectId,
    ref: 'Conversation'
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot be more than 2000 characters']
  },
  attachments: [{
    name: String,
    file: String,
    type: String, // 'image', 'document', 'other'
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isSystemMessage: {
    type: Boolean,
    default: false
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
MessageSchema.index({ conversation: 1, createdAt: 1 });
MessageSchema.index({ sender: 1, recipient: 1, createdAt: 1 });

// Pre-save hook to update the updatedAt field
MessageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Message', MessageSchema); 