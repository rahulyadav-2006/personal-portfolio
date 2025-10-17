const cron = require('node-cron');
const scraperService = require('./scraperService');

class CronService {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  initializeCronJobs() {
    if (this.isInitialized) {
      console.log('⚠️ Cron jobs already initialized');
      return;
    }

    console.log('⏰ Initializing cron jobs...');

    // News scraping - every 30 minutes
    this.scheduleJob('news-scraper', '*/30 * * * *', async () => {
      console.log('📰 Running scheduled news scraping...');
      try {
        const result = await scraperService.scrapeNews();
        console.log(`📰 News scraping result: ${result.itemsSaved} items saved`);
      } catch (error) {
        console.error('❌ Scheduled news scraping failed:', error.message);
      }
    });

    // Crypto scraping - every 15 minutes
    this.scheduleJob('crypto-scraper', '*/15 * * * *', async () => {
      console.log('💰 Running scheduled crypto scraping...');
      try {
        const result = await scraperService.scrapeCrypto();
        console.log(`💰 Crypto scraping result: ${result.itemsSaved} items saved`);
      } catch (error) {
        console.error('❌ Scheduled crypto scraping failed:', error.message);
      }
    });

    // Weather scraping - every hour
    this.scheduleJob('weather-scraper', '0 * * * *', async () => {
      console.log('🌤️ Running scheduled weather scraping...');
      try {
        const result = await scraperService.scrapeWeather();
        console.log(`🌤️ Weather scraping result: ${result.itemsSaved} items saved`);
      } catch (error) {
        console.error('❌ Scheduled weather scraping failed:', error.message);
      }
    });

    // Cleanup old data - daily at 2 AM
    this.scheduleJob('cleanup', '0 2 * * *', async () => {
      console.log('🧹 Running scheduled cleanup...');
      try {
        await this.cleanupOldData();
        console.log('🧹 Cleanup completed');
      } catch (error) {
        console.error('❌ Scheduled cleanup failed:', error.message);
      }
    });

    // Health check - every 5 minutes
    this.scheduleJob('health-check', '*/5 * * * *', async () => {
      console.log('💓 Running health check...');
      try {
        await this.healthCheck();
      } catch (error) {
        console.error('❌ Health check failed:', error.message);
      }
    });

    this.isInitialized = true;
    console.log('✅ All cron jobs initialized successfully');
  }

  scheduleJob(name, schedule, task) {
    try {
      const job = cron.schedule(schedule, task, {
        scheduled: false,
        timezone: 'UTC'
      });

      this.jobs.set(name, job);
      job.start();
      
      console.log(`✅ Scheduled job '${name}' with pattern '${schedule}'`);
    } catch (error) {
      console.error(`❌ Failed to schedule job '${name}':`, error.message);
    }
  }

  stopJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      console.log(`⏹️ Stopped job '${name}'`);
    } else {
      console.log(`⚠️ Job '${name}' not found`);
    }
  }

  stopAllJobs() {
    console.log('⏹️ Stopping all cron jobs...');
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`⏹️ Stopped job '${name}'`);
    }
    this.jobs.clear();
    this.isInitialized = false;
  }

  getJobStatus() {
    const status = {};
    for (const [name, job] of this.jobs) {
      status[name] = {
        running: job.running,
        scheduled: job.scheduled
      };
    }
    return status;
  }

  async cleanupOldData() {
    const ScrapedData = require('../models/ScrapedData');
    const ScrapingLog = require('../models/ScrapingLog');
    
    try {
      // Delete scraped data older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const deletedData = await ScrapedData.deleteMany({
        scrapedAt: { $lt: thirtyDaysAgo },
        isActive: true
      });
      
      console.log(`🗑️ Deleted ${deletedData.deletedCount} old scraped data items`);

      // Delete scraping logs older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const deletedLogs = await ScrapingLog.deleteMany({
        completedAt: { $lt: sevenDaysAgo }
      });
      
      console.log(`🗑️ Deleted ${deletedLogs.deletedCount} old scraping logs`);

      // Mark duplicate entries as inactive
      const duplicates = await ScrapedData.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $group: {
            _id: { url: '$url', dataType: '$dataType' },
            count: { $sum: 1 },
            ids: { $push: '$_id' }
          }
        },
        {
          $match: { count: { $gt: 1 } }
        }
      ]);

      for (const duplicate of duplicates) {
        const idsToDeactivate = duplicate.ids.slice(1); // Keep the first one
        await ScrapedData.updateMany(
          { _id: { $in: idsToDeactivate } },
          { $set: { isActive: false } }
        );
      }

      console.log(`🔄 Deactivated ${duplicates.length} duplicate entries`);

    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      throw error;
    }
  }

  async healthCheck() {
    const ScrapedData = require('../models/ScrapedData');
    const ScrapingLog = require('../models/ScrapingLog');
    
    try {
      // Check database connection
      const dataCount = await ScrapedData.countDocuments({ isActive: true });
      const recentLogs = await ScrapingLog.find({
        completedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).countDocuments();

      console.log(`💓 Health check - Data items: ${dataCount}, Recent logs: ${recentLogs}`);

      // Check if any jobs are failing
      const recentErrors = await ScrapingLog.find({
        status: 'error',
        completedAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) } // Last 2 hours
      }).countDocuments();

      if (recentErrors > 5) {
        console.warn(`⚠️ High error rate detected: ${recentErrors} errors in last 2 hours`);
      }

    } catch (error) {
      console.error('❌ Health check failed:', error.message);
    }
  }

  // Manual trigger methods for testing
  async triggerNewsScraping() {
    console.log('🔄 Manually triggering news scraping...');
    return await scraperService.scrapeNews();
  }

  async triggerCryptoScraping() {
    console.log('🔄 Manually triggering crypto scraping...');
    return await scraperService.scrapeCrypto();
  }

  async triggerWeatherScraping() {
    console.log('🔄 Manually triggering weather scraping...');
    return await scraperService.scrapeWeather();
  }

  async triggerAllScraping() {
    console.log('🔄 Manually triggering all scraping...');
    const results = {};
    
    try {
      results.news = await scraperService.scrapeNews();
    } catch (error) {
      results.news = { success: false, error: error.message };
    }

    try {
      results.crypto = await scraperService.scrapeCrypto();
    } catch (error) {
      results.crypto = { success: false, error: error.message };
    }

    try {
      results.weather = await scraperService.scrapeWeather();
    } catch (error) {
      results.weather = { success: false, error: error.message };
    }

    return results;
  }
}

module.exports = new CronService();
