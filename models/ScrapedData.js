const mongoose = require('mongoose');

const scrapedDataSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  },
  publishedAt: {
    type: Date,
    required: true,
    index: true
  },
  scrapedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tags: [{
    type: String,
    trim: true
  }],
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
scrapedDataSchema.index({ dataType: 1, publishedAt: -1 });
scrapedDataSchema.index({ source: 1, scrapedAt: -1 });
scrapedDataSchema.index({ publishedAt: -1, priority: -1 });
scrapedDataSchema.index({ isActive: 1, dataType: 1 });

// Virtual for formatted date
scrapedDataSchema.virtual('formattedDate').get(function() {
  return this.publishedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Method to get summary
scrapedDataSchema.methods.getSummary = function() {
  return {
    id: this._id,
    dataType: this.dataType,
    source: this.source,
    title: this.title,
    description: this.description?.substring(0, 150) + '...',
    url: this.url,
    imageUrl: this.imageUrl,
    publishedAt: this.publishedAt,
    formattedDate: this.formattedDate,
    tags: this.tags,
    priority: this.priority
  };
};

// Static method to get latest data by type
scrapedDataSchema.statics.getLatestByType = function(dataType, limit = 10) {
  return this.find({ 
    dataType, 
    isActive: true 
  })
  .sort({ publishedAt: -1, priority: -1 })
  .limit(limit)
  .lean();
};

// Static method to get data by source
scrapedDataSchema.statics.getBySource = function(source, limit = 10) {
  return this.find({ 
    source, 
    isActive: true 
  })
  .sort({ publishedAt: -1 })
  .limit(limit)
  .lean();
};

// Static method to search data
scrapedDataSchema.statics.search = function(query, dataType = null, limit = 20) {
  const searchQuery = {
    isActive: true,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  };
  
  if (dataType) {
    searchQuery.dataType = dataType;
  }
  
  return this.find(searchQuery)
    .sort({ publishedAt: -1, priority: -1 })
    .limit(limit)
    .lean();
};

// Static method to get statistics
scrapedDataSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: '$dataType',
        count: { $sum: 1 },
        latestScrape: { $max: '$scrapedAt' },
        sources: { $addToSet: '$source' }
      }
    },
    {
      $project: {
        dataType: '$_id',
        count: 1,
        latestScrape: 1,
        sourceCount: { $size: '$sources' },
        sources: 1
      }
    }
  ]);
};

module.exports = mongoose.model('ScrapedData', scrapedDataSchema);
