const mongoose = require('mongoose');

const AnalyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['event', 'resource', 'user', 'system'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    default: 1
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  userRole: {
    type: String,
    enum: ['student', 'lecturer', 'admin', 'anonymous']
  },
  relatedModel: {
    type: String,
    enum: ['Event', 'Schedule', 'Resource', 'Reservation', 'User', null],
    default: null
  },
  relatedId: {
    type: mongoose.Schema.ObjectId
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create index for efficient querying
AnalyticsSchema.index({ type: 1, category: 1, action: 1 });
AnalyticsSchema.index({ timestamp: 1 });
AnalyticsSchema.index({ user: 1, timestamp: 1 });
AnalyticsSchema.index({ relatedModel: 1, relatedId: 1 });

// Static method to record an analytics event
AnalyticsSchema.statics.record = async function(data) {
  return await this.create(data);
};

// Static method to get aggregated analytics by type and category
AnalyticsSchema.statics.getAggregatedByTypeAndCategory = async function(type, category, startDate, endDate) {
  const match = { type };
  
  if (category) {
    match.category = category;
  }
  
  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) {
      match.timestamp.$gte = new Date(startDate);
    }
    if (endDate) {
      match.timestamp.$lte = new Date(endDate);
    }
  }
  
  return await this.aggregate([
    { $match: match },
    { $group: {
        _id: { action: '$action' },
        count: { $sum: 1 },
        totalValue: { $sum: '$value' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Static method to get time series data
AnalyticsSchema.statics.getTimeSeries = async function(type, category, action, interval, startDate, endDate) {
  const match = {};
  
  if (type) match.type = type;
  if (category) match.category = category;
  if (action) match.action = action;
  
  if (startDate || endDate) {
    match.timestamp = {};
    if (startDate) {
      match.timestamp.$gte = new Date(startDate);
    }
    if (endDate) {
      match.timestamp.$lte = new Date(endDate);
    }
  }
  
  let dateFormat;
  switch (interval) {
    case 'hour':
      dateFormat = { year: '$year', month: '$month', day: '$dayOfMonth', hour: '$hour' };
      break;
    case 'day':
      dateFormat = { year: '$year', month: '$month', day: '$dayOfMonth' };
      break;
    case 'week':
      dateFormat = { year: '$year', week: '$week' };
      break;
    case 'month':
      dateFormat = { year: '$year', month: '$month' };
      break;
    default:
      dateFormat = { year: '$year', month: '$month', day: '$dayOfMonth' };
  }
  
  return await this.aggregate([
    { $match: match },
    { $group: {
        _id: {
          date: {
            $dateToString: {
              format: interval === 'hour' ? '%Y-%m-%d %H:00' : 
                      interval === 'day' ? '%Y-%m-%d' : 
                      interval === 'week' ? '%Y-W%V' : '%Y-%m',
              date: '$timestamp'
            }
          }
        },
        count: { $sum: 1 },
        totalValue: { $sum: '$value' }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);
};

module.exports = mongoose.model('Analytics', AnalyticsSchema); 