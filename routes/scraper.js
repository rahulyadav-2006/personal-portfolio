const express = require('express');
const router = express.Router();
const scraperService = require('../services/scraperService');
const cronService = require('../services/cronService');

// Manual scraping endpoints
router.post('/news', async (req, res) => {
  try {
    console.log('📰 Manual news scraping requested');
    const result = await scraperService.scrapeNews();
    
    if (result.success) {
      res.json({
        success: true,
        message: `News scraping completed successfully. ${result.itemsSaved} items saved.`,
        itemsSaved: result.itemsSaved
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'News scraping failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ News scraping error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.post('/crypto', async (req, res) => {
  try {
    console.log('💰 Manual crypto scraping requested');
    const result = await scraperService.scrapeCrypto();
    
    if (result.success) {
      res.json({
        success: true,
        message: `Crypto scraping completed successfully. ${result.itemsSaved} items saved.`,
        itemsSaved: result.itemsSaved
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Crypto scraping failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Crypto scraping error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.post('/weather', async (req, res) => {
  try {
    console.log('🌤️ Manual weather scraping requested');
    const result = await scraperService.scrapeWeather();
    
    if (result.success) {
      res.json({
        success: true,
        message: `Weather scraping completed successfully. ${result.itemsSaved} items saved.`,
        itemsSaved: result.itemsSaved
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Weather scraping failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Weather scraping error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.post('/all', async (req, res) => {
  try {
    console.log('🔄 Manual all scraping requested');
    const results = await cronService.triggerAllScraping();
    
    const totalItems = Object.values(results).reduce((sum, result) => {
      return sum + (result.itemsSaved || 0);
    }, 0);
    
    res.json({
      success: true,
      message: `All scraping completed. Total items saved: ${totalItems}`,
      results,
      totalItems
    });
  } catch (error) {
    console.error('❌ All scraping error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Cron job management endpoints
router.get('/cron/status', (req, res) => {
  try {
    const status = cronService.getJobStatus();
    res.json({
      success: true,
      jobs: status
    });
  } catch (error) {
    console.error('❌ Cron status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cron status',
      error: error.message
    });
  }
});

router.post('/cron/stop/:jobName', (req, res) => {
  try {
    const { jobName } = req.params;
    cronService.stopJob(jobName);
    
    res.json({
      success: true,
      message: `Job '${jobName}' stopped successfully`
    });
  } catch (error) {
    console.error('❌ Stop job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop job',
      error: error.message
    });
  }
});

router.post('/cron/restart', (req, res) => {
  try {
    cronService.stopAllJobs();
    cronService.initializeCronJobs();
    
    res.json({
      success: true,
      message: 'All cron jobs restarted successfully'
    });
  } catch (error) {
    console.error('❌ Restart jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restart jobs',
      error: error.message
    });
  }
});

// Cleanup endpoint
router.post('/cleanup', async (req, res) => {
  try {
    console.log('🧹 Manual cleanup requested');
    await cronService.cleanupOldData();
    
    res.json({
      success: true,
      message: 'Cleanup completed successfully'
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Cleanup failed',
      error: error.message
    });
  }
});

module.exports = router;
