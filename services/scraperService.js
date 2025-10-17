const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const ScrapedData = require('../models/ScrapedData');
const ScrapingLog = require('../models/ScrapingLog');
const moment = require('moment');

class ScraperService {
  constructor() {
    this.browser = null;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  async initializeBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeNews() {
    const startTime = Date.now();
    const logData = {
      dataType: 'news',
      source: 'multiple',
      status: 'success',
      itemsScraped: 0,
      itemsProcessed: 0,
      itemsSaved: 0,
      startedAt: new Date(),
      completedAt: new Date(),
      duration: 0,
      metadata: {}
    };

    try {
      console.log('📰 Starting news scraping...');
      
      // Scrape from multiple news sources
      const newsSources = [
        { name: 'BBC News', url: 'https://www.bbc.com/news', selector: '.gs-c-promo' },
        { name: 'CNN', url: 'https://www.cnn.com', selector: '.container__item' },
        { name: 'Reuters', url: 'https://www.reuters.com', selector: '[data-testid="MediaStoryCard"]' }
      ];

      const allNews = [];

      for (const source of newsSources) {
        try {
          const news = await this.scrapeNewsSource(source);
          allNews.push(...news);
          logData.itemsScraped += news.length;
        } catch (error) {
          console.error(`❌ Error scraping ${source.name}:`, error.message);
        }
      }

      // Process and save news
      for (const newsItem of allNews) {
        try {
          const existingNews = await ScrapedData.findOne({
            url: newsItem.url,
            dataType: 'news'
          });

          if (!existingNews) {
            const scrapedData = new ScrapedData({
              dataType: 'news',
              source: newsItem.source,
              title: newsItem.title,
              description: newsItem.description,
              url: newsItem.url,
              imageUrl: newsItem.imageUrl,
              publishedAt: newsItem.publishedAt,
              tags: newsItem.tags || [],
              priority: newsItem.priority || 0,
              metadata: {
                category: newsItem.category,
                author: newsItem.author
              }
            });

            await scrapedData.save();
            logData.itemsSaved++;
          }
          logData.itemsProcessed++;
        } catch (error) {
          console.error('❌ Error saving news item:', error.message);
        }
      }

      logData.status = logData.itemsSaved > 0 ? 'success' : 'error';
      logData.completedAt = new Date();
      logData.duration = Date.now() - startTime;

      await this.logScrapingResult(logData);
      console.log(`✅ News scraping completed: ${logData.itemsSaved} items saved`);

      return { success: true, itemsSaved: logData.itemsSaved };

    } catch (error) {
      logData.status = 'error';
      logData.errorMessage = error.message;
      logData.errorStack = error.stack;
      logData.completedAt = new Date();
      logData.duration = Date.now() - startTime;

      await this.logScrapingResult(logData);
      console.error('❌ News scraping failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async scrapeNewsSource(source) {
    const news = [];
    
    try {
      const response = await axios.get(source.url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);

      $(source.selector).each((index, element) => {
        try {
          const $el = $(element);
          
          const title = $el.find('h3, h2, .promo-title, .headline').first().text().trim();
          const description = $el.find('p, .summary, .description').first().text().trim();
          const link = $el.find('a').first().attr('href');
          const image = $el.find('img').first().attr('src');
          
          if (title && link) {
            const fullUrl = link.startsWith('http') ? link : new URL(link, source.url).href;
            
            news.push({
              source: source.name,
              title,
              description: description || '',
              url: fullUrl,
              imageUrl: image ? (image.startsWith('http') ? image : new URL(image, source.url).href) : null,
              publishedAt: new Date(),
              tags: this.extractTags(title + ' ' + description),
              priority: this.calculatePriority(title, description),
              category: this.categorizeNews(title, description)
            });
          }
        } catch (error) {
          console.error('Error processing news item:', error.message);
        }
      });

    } catch (error) {
      console.error(`Error scraping ${source.name}:`, error.message);
    }

    return news.slice(0, 10); // Limit to 10 items per source
  }

  async scrapeCrypto() {
    const startTime = Date.now();
    const logData = {
      dataType: 'crypto',
      source: 'CoinGecko',
      status: 'success',
      itemsScraped: 0,
      itemsProcessed: 0,
      itemsSaved: 0,
      startedAt: new Date(),
      completedAt: new Date(),
      duration: 0,
      metadata: {}
    };

    try {
      console.log('💰 Starting crypto scraping...');
      
      const browser = await this.initializeBrowser();
      const page = await browser.newPage();
      
      await page.setUserAgent(this.userAgent);
      await page.goto('https://www.coingecko.com/en/coins/trending', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      const cryptoData = await page.evaluate(() => {
        const coins = [];
        const rows = document.querySelectorAll('tbody tr');
        
        rows.forEach((row, index) => {
          if (index >= 20) return; // Limit to top 20
          
          const name = row.querySelector('td:nth-child(2) .font-bold')?.textContent?.trim();
          const symbol = row.querySelector('td:nth-child(2) .text-sm')?.textContent?.trim();
          const price = row.querySelector('td:nth-child(3) .font-bold')?.textContent?.trim();
          const change24h = row.querySelector('td:nth-child(4) .font-bold')?.textContent?.trim();
          const marketCap = row.querySelector('td:nth-child(5) .font-bold')?.textContent?.trim();
          const volume = row.querySelector('td:nth-child(6) .font-bold')?.textContent?.trim();
          
          if (name && price) {
            coins.push({
              name,
              symbol,
              price,
              change24h,
              marketCap,
              volume,
              rank: index + 1
            });
          }
        });
        
        return coins;
      });

      await page.close();

      // Process and save crypto data
      for (const coin of cryptoData) {
        try {
          const title = `${coin.name} (${coin.symbol}) - $${coin.price}`;
          const description = `24h Change: ${coin.change24h} | Market Cap: ${coin.marketCap} | Volume: ${coin.volume}`;
          
          const existingCrypto = await ScrapedData.findOne({
            title: { $regex: new RegExp(coin.name, 'i') },
            dataType: 'crypto',
            'metadata.rank': coin.rank
          });

          if (!existingCrypto) {
            const scrapedData = new ScrapedData({
              dataType: 'crypto',
              source: 'CoinGecko',
              title,
              description,
              url: `https://www.coingecko.com/en/coins/${coin.name.toLowerCase().replace(/\s+/g, '-')}`,
              publishedAt: new Date(),
              tags: ['cryptocurrency', coin.symbol.toLowerCase(), 'trending'],
              priority: 10 - coin.rank, // Higher priority for top coins
              metadata: {
                symbol: coin.symbol,
                price: coin.price,
                change24h: coin.change24h,
                marketCap: coin.marketCap,
                volume: coin.volume,
                rank: coin.rank
              }
            });

            await scrapedData.save();
            logData.itemsSaved++;
          }
          logData.itemsProcessed++;
        } catch (error) {
          console.error('❌ Error saving crypto item:', error.message);
        }
      }

      logData.itemsScraped = cryptoData.length;
      logData.status = logData.itemsSaved > 0 ? 'success' : 'error';
      logData.completedAt = new Date();
      logData.duration = Date.now() - startTime;

      await this.logScrapingResult(logData);
      console.log(`✅ Crypto scraping completed: ${logData.itemsSaved} items saved`);

      return { success: true, itemsSaved: logData.itemsSaved };

    } catch (error) {
      logData.status = 'error';
      logData.errorMessage = error.message;
      logData.errorStack = error.stack;
      logData.completedAt = new Date();
      logData.duration = Date.now() - startTime;

      await this.logScrapingResult(logData);
      console.error('❌ Crypto scraping failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async scrapeWeather() {
    const startTime = Date.now();
    const logData = {
      dataType: 'weather',
      source: 'OpenWeatherMap',
      status: 'success',
      itemsScraped: 0,
      itemsProcessed: 0,
      itemsSaved: 0,
      startedAt: new Date(),
      completedAt: new Date(),
      duration: 0,
      metadata: {}
    };

    try {
      console.log('🌤️ Starting weather scraping...');
      
      // Major cities for weather data
      const cities = [
        { name: 'New York', country: 'US', lat: 40.7128, lon: -74.0060 },
        { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
        { name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
        { name: 'Sydney', country: 'AU', lat: -33.8688, lon: 151.2093 },
        { name: 'Mumbai', country: 'IN', lat: 19.0760, lon: 72.8777 }
      ];

      const weatherData = [];

      for (const city of cities) {
        try {
          // Using a free weather API (you can replace with OpenWeatherMap API key)
          const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
            params: {
              lat: city.lat,
              lon: city.lon,
              appid: process.env.OPENWEATHER_API_KEY || 'demo_key',
              units: 'metric'
            },
            timeout: 10000
          });

          const weather = response.data;
          weatherData.push({
            city: city.name,
            country: city.country,
            temperature: Math.round(weather.main.temp),
            description: weather.weather[0].description,
            humidity: weather.main.humidity,
            windSpeed: weather.wind.speed,
            pressure: weather.main.pressure,
            visibility: weather.visibility / 1000, // Convert to km
            timestamp: new Date()
          });

        } catch (error) {
          console.error(`Error fetching weather for ${city.name}:`, error.message);
        }
      }

      // Process and save weather data
      for (const weather of weatherData) {
        try {
          const title = `${weather.city}, ${weather.country} - ${weather.temperature}°C`;
          const description = `${weather.description} | Humidity: ${weather.humidity}% | Wind: ${weather.windSpeed} m/s`;

          const existingWeather = await ScrapedData.findOne({
            title: { $regex: new RegExp(weather.city, 'i') },
            dataType: 'weather',
            'metadata.city': weather.city
          });

          if (!existingWeather) {
            const scrapedData = new ScrapedData({
              dataType: 'weather',
              source: 'OpenWeatherMap',
              title,
              description,
              url: `https://openweathermap.org/city/${weather.city.toLowerCase().replace(/\s+/g, '-')}`,
              publishedAt: weather.timestamp,
              tags: ['weather', weather.city.toLowerCase(), weather.country.toLowerCase()],
              priority: 5,
              metadata: {
                city: weather.city,
                country: weather.country,
                temperature: weather.temperature,
                description: weather.description,
                humidity: weather.humidity,
                windSpeed: weather.windSpeed,
                pressure: weather.pressure,
                visibility: weather.visibility
              }
            });

            await scrapedData.save();
            logData.itemsSaved++;
          }
          logData.itemsProcessed++;
        } catch (error) {
          console.error('❌ Error saving weather item:', error.message);
        }
      }

      logData.itemsScraped = weatherData.length;
      logData.status = logData.itemsSaved > 0 ? 'success' : 'error';
      logData.completedAt = new Date();
      logData.duration = Date.now() - startTime;

      await this.logScrapingResult(logData);
      console.log(`✅ Weather scraping completed: ${logData.itemsSaved} items saved`);

      return { success: true, itemsSaved: logData.itemsSaved };

    } catch (error) {
      logData.status = 'error';
      logData.errorMessage = error.message;
      logData.errorStack = error.stack;
      logData.completedAt = new Date();
      logData.duration = Date.now() - startTime;

      await this.logScrapingResult(logData);
      console.error('❌ Weather scraping failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  extractTags(text) {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word));
    
    return [...new Set(words)].slice(0, 5);
  }

  calculatePriority(title, description) {
    const highPriorityKeywords = ['breaking', 'urgent', 'crisis', 'emergency', 'alert'];
    const text = (title + ' ' + description).toLowerCase();
    
    if (highPriorityKeywords.some(keyword => text.includes(keyword))) {
      return 10;
    }
    
    return Math.floor(Math.random() * 5) + 1; // Random priority 1-5
  }

  categorizeNews(title, description) {
    const categories = {
      'politics': ['government', 'election', 'president', 'minister', 'parliament'],
      'technology': ['tech', 'software', 'ai', 'artificial intelligence', 'computer'],
      'business': ['economy', 'market', 'stock', 'company', 'business'],
      'sports': ['football', 'soccer', 'basketball', 'tennis', 'olympics'],
      'health': ['health', 'medical', 'doctor', 'hospital', 'disease'],
      'entertainment': ['movie', 'music', 'celebrity', 'entertainment', 'show']
    };

    const text = (title + ' ' + description).toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  async logScrapingResult(logData) {
    try {
      const log = new ScrapingLog(logData);
      await log.save();
    } catch (error) {
      console.error('❌ Error saving scraping log:', error.message);
    }
  }

  async getAllData(dataType = null, limit = 50) {
    try {
      let query = { isActive: true };
      if (dataType) {
        query.dataType = dataType;
      }

      const data = await ScrapedData.find(query)
        .sort({ publishedAt: -1, priority: -1 })
        .limit(limit)
        .lean();

      return { success: true, data };
    } catch (error) {
      console.error('❌ Error fetching data:', error.message);
      return { success: false, error: error.message };
    }
  }

  async searchData(query, dataType = null, limit = 20) {
    try {
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

      const data = await ScrapedData.find(searchQuery)
        .sort({ publishedAt: -1, priority: -1 })
        .limit(limit)
        .lean();

      return { success: true, data };
    } catch (error) {
      console.error('❌ Error searching data:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getStats() {
    try {
      const stats = await ScrapedData.getStats();
      const performanceStats = await ScrapingLog.getPerformanceStats();
      
      return {
        success: true,
        dataStats: stats,
        performanceStats
      };
    } catch (error) {
      console.error('❌ Error fetching stats:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ScraperService();
