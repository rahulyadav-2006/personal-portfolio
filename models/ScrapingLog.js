const mongoose = require('mongoose');

const scrapingLogSchema = new mongoose.Schema({
  dataType: {
    type: String,
    required: true,
    enum: ['news', 'weather', 'crypto', 'stocks', 'sports'],
    index: true
  },
  source: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'error', 'partial'],
    index: true
  },
  itemsScraped: {
    type: Number,
    default: 0
  },
  itemsProcessed: {
    type: Number,
    default: 0
  },
  itemsSaved: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number, // in milliseconds
    required: true
  },
  errorMessage: {
    type: String
  },
  errorStack: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  startedAt: {
    type: Date,
    required: true,
    index: true
  },
  completedAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
scrapingLogSchema.index({ dataType: 1, completedAt: -1 });
scrapingLogSchema.index({ source: 1, completedAt: -1 });
scrapingLogSchema.index({ status: 1, completedAt: -1 });
scrapingLogSchema.index({ completedAt: -1 });

// Virtual for success rate
scrapingLogSchema.virtual('successRate').get(function() {
  if (this.itemsScraped === 0) return 0;
  return ((this.itemsSaved / this.itemsScraped) * 100).toFixed(2);
});

// Virtual for formatted duration
scrapingLogSchema.virtual('formattedDuration').get(function() {
  const seconds = Math.floor(this.duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
});

// Static method to get recent logs
scrapingLogSchema.statics.getRecent = function(limit = 50) {
  return this.find()
    .sort({ completedAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to get logs by data type
scrapingLogSchema.statics.getByDataType = function(dataType, limit = 20) {
  return this.find({ dataType })
    .sort({ completedAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to get performance statistics
scrapingLogSchema.statics.getPerformanceStats = function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$dataType',
        totalRuns: { $sum: 1 },
        successfulRuns: {
          $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
        },
        errorRuns: {
          $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
        },
        totalItemsScraped: { $sum: '$itemsScraped' },
        totalItemsSaved: { $sum: '$itemsSaved' },
        avgDuration: { $avg: '$duration' },
        lastRun: { $max: '$completedAt' }
      }
    },
    {
      $project: {
        dataType: '$_id',
        totalRuns: 1,
        successfulRuns: 1,
        errorRuns: 1,
        successRate: {
          $multiply: [
            { $divide: ['$successfulRuns', '$totalRuns'] },
            100
          ]
        },
        totalItemsScraped: 1,
        totalItemsSaved: 1,
        saveRate: {
          $multiply: [
            { $divide: ['$totalItemsSaved', '$totalItemsScraped'] },
            100
          ]
        },
        avgDuration: 1,
        lastRun: 1
      }
    }
  ]);
};

// Static method to get error logs
scrapingLogSchema.statics.getErrors = function(limit = 20) {
  return this.find({ status: 'error' })
    .sort({ completedAt: -1 })
    .limit(limit)
    .lean();
};

module.exports = mongoose.model('ScrapingLog', scrapingLogSchema);
