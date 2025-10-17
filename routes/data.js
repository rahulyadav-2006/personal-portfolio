const express = require('express');
const router = express.Router();
const scraperService = require('../services/scraperService');
const ScrapedData = require('../models/ScrapedData');
const ScrapingLog = require('../models/ScrapingLog');

// Get all data with optional filtering
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      source, 
      limit = 50, 
      page = 1, 
      sort = 'publishedAt',
      order = 'desc'
    } = req.query;

    let query = { isActive: true };
    
    if (type) {
      query.dataType = type;
    }
    
    if (source) {
      query.source = source;
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj = { [sort]: sortOrder };
    
    // Add secondary sort by priority for better results
    if (sort !== 'priority') {
      sortObj.priority = -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [data, total] = await Promise.all([
      ScrapedData.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ScrapedData.countDocuments(query)
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Get data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data',
      error: error.message
    });
  }
});

// Get data by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 20 } = req.query;

    const data = await ScrapedData.getLatestByType(type, parseInt(limit));

    res.json({
      success: true,
      dataType: type,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('❌ Get data by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data by type',
      error: error.message
    });
  }
});

// Get data by source
router.get('/source/:source', async (req, res) => {
  try {
    const { source } = req.params;
    const { limit = 20 } = req.query;

    const data = await ScrapedData.getBySource(source, parseInt(limit));

    res.json({
      success: true,
      source,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('❌ Get data by source error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data by source',
      error: error.message
    });
  }
});

// Search data
router.get('/search', async (req, res) => {
  try {
    const { q, type, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const result = await scraperService.searchData(q, type, parseInt(limit));

    if (result.success) {
      res.json({
        success: true,
        query: q,
        dataType: type,
        data: result.data,
        count: result.data.length
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Search failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// Get single data item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const data = await ScrapedData.findById(id).lean();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data item not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ Get single data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data item',
      error: error.message
    });
  }
});

// Get statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const result = await scraperService.getStats();

    if (result.success) {
      res.json({
        success: true,
        stats: result.dataStats,
        performance: result.performanceStats
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Get recent scraping logs
router.get('/logs/recent', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const logs = await ScrapingLog.getRecent(parseInt(limit));

    res.json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    console.error('❌ Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs',
      error: error.message
    });
  }
});

// Get logs by data type
router.get('/logs/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 20 } = req.query;

    const logs = await ScrapingLog.getByDataType(type, parseInt(limit));

    res.json({
      success: true,
      dataType: type,
      logs,
      count: logs.length
    });
  } catch (error) {
    console.error('❌ Get logs by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs by type',
      error: error.message
    });
  }
});

// Get performance statistics
router.get('/logs/performance', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await ScrapingLog.getPerformanceStats(parseInt(days));

    res.json({
      success: true,
      period: `${days} days`,
      stats
    });
  } catch (error) {
    console.error('❌ Get performance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance statistics',
      error: error.message
    });
  }
});

// Get error logs
router.get('/logs/errors', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const errors = await ScrapingLog.getErrors(parseInt(limit));

    res.json({
      success: true,
      errors,
      count: errors.length
    });
  } catch (error) {
    console.error('❌ Get error logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch error logs',
      error: error.message
    });
  }
});

// Update data item (mark as inactive, update priority, etc.)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const data = await ScrapedData.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data item not found'
      });
    }

    res.json({
      success: true,
      message: 'Data item updated successfully',
      data
    });
  } catch (error) {
    console.error('❌ Update data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update data item',
      error: error.message
    });
  }
});

// Delete data item (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const data = await ScrapedData.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    ).lean();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Data item not found'
      });
    }

    res.json({
      success: true,
      message: 'Data item deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete data item',
      error: error.message
    });
  }
});

module.exports = router;
