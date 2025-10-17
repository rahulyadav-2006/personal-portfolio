# Live Data Scraper - Setup Guide

This guide will help you set up and run the Live Data Scraper application locally and deploy it to various cloud platforms.

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (local or cloud) - [MongoDB Atlas](https://www.mongodb.com/atlas) (recommended)
- **Git** - [Download](https://git-scm.com/)

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/live-data-scraper.git
cd live-data-scraper

# Install dependencies
npm install

# Copy environment file
cp env.example .env
```

### 2. Configure Environment
Edit `.env` file with your settings:
```env
MONGODB_URI=mongodb://localhost:27017/live-data-scraper
PORT=3000
NODE_ENV=development
```

### 3. Setup Database
```bash
# Setup database and indexes
npm run setup-db
```

### 4. Start Application
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 5. Access Dashboard
Open your browser and go to `http://localhost:3000`

## 📊 Features Overview

### 🕷️ Web Scraping
- **News Articles**: BBC, CNN, Reuters
- **Cryptocurrency**: Real-time prices from CoinGecko
- **Weather Data**: Multiple cities worldwide
- **Automated Updates**: Cron jobs every 15-60 minutes

### 🗄️ Database Storage
- **MongoDB**: Efficient data storage and retrieval
- **Indexing**: Optimized for fast queries
- **Data Models**: Structured schemas for different data types
- **Logging**: Comprehensive scraping logs

### 🎛️ Dashboard Features
- **Real-time Updates**: WebSocket integration
- **Data Visualization**: Interactive charts and tables
- **Search & Filter**: Advanced data filtering
- **Manual Controls**: Trigger scraping manually
- **Performance Monitoring**: System health and metrics

### 🔌 API Endpoints
- **REST API**: Complete data access
- **Real-time**: WebSocket for live updates
- **Filtering**: Search, pagination, sorting
- **Statistics**: Performance and usage metrics

## 🛠️ Development Setup

### Project Structure
```
live-data-scraper/
├── models/              # Database models
│   ├── ScrapedData.js   # Main data model
│   └── ScrapingLog.js   # Logging model
├── services/            # Business logic
│   ├── scraperService.js # Scraping logic
│   └── cronService.js   # Scheduling logic
├── routes/              # API routes
│   ├── data.js         # Data endpoints
│   └── scraper.js      # Scraping endpoints
├── public/              # Frontend files
│   ├── index.html      # Main dashboard
│   ├── styles.css      # Styling
│   └── app.js          # Frontend logic
├── scripts/             # Utility scripts
│   ├── setup-database.js
│   └── scraper.js
├── server.js            # Main server file
├── package.json         # Dependencies
└── README.md           # Documentation
```

### Available Scripts
```bash
npm start              # Start production server
npm run dev            # Start development server
npm run scrape news    # Scrape news manually
npm run scrape crypto  # Scrape crypto manually
npm run scrape weather # Scrape weather manually
npm run scrape all     # Scrape all sources
npm run setup-db       # Setup database
npm test               # Run tests
```

## 🌐 Deployment Options

### 1. Vercel (Recommended)
- **Best for**: Quick deployment, automatic scaling
- **Setup**: Connect GitHub repository
- **Database**: Use MongoDB Atlas
- **Cost**: Free tier available

### 2. Railway
- **Best for**: Full-stack with database
- **Setup**: Connect GitHub, add MongoDB service
- **Features**: Built-in database, cron jobs
- **Cost**: Pay-as-you-go

### 3. Heroku
- **Best for**: Traditional hosting
- **Setup**: Connect GitHub, add MongoDB addon
- **Features**: Add-on marketplace
- **Cost**: Paid plans

### 4. Docker
- **Best for**: Containerized deployment
- **Setup**: Build and push to registry
- **Features**: Consistent environments
- **Cost**: Varies by platform

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | Database connection | `mongodb://localhost:27017/live-data-scraper` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | CORS origin | `http://localhost:3000` |
| `OPENWEATHER_API_KEY` | Weather API key | Optional |

### Scraping Configuration
- **News**: Every 30 minutes
- **Crypto**: Every 15 minutes
- **Weather**: Every hour
- **Cleanup**: Daily at 2 AM

### Database Configuration
- **MongoDB**: Primary database
- **Indexes**: Optimized for queries
- **Collections**: `scrapeddata`, `scrapinglogs`
- **TTL**: Automatic cleanup of old data

## 📱 Frontend Features

### Dashboard
- Real-time statistics
- Recent data from all sources
- System health monitoring
- Quick access to controls

### Data Management
- View all scraped data
- Search and filter functionality
- Pagination for large datasets
- Real-time updates

### Scraper Controls
- Manual scraping triggers
- Cron job management
- System maintenance tools
- Performance monitoring

### Logs and Analytics
- Detailed scraping logs
- Performance statistics
- Error tracking
- Success rates

## 🔍 API Usage

### Get All Data
```bash
curl "http://localhost:3000/api/data?limit=10&type=news"
```

### Search Data
```bash
curl "http://localhost:3000/api/data/search?q=bitcoin&type=crypto"
```

### Trigger Scraping
```bash
curl -X POST "http://localhost:3000/api/scraper/news"
```

### Get Statistics
```bash
curl "http://localhost:3000/api/data/stats/overview"
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB URI format
   - Verify database is running
   - Check network connectivity

2. **Scraping Failures**
   - Check target website accessibility
   - Verify user agent strings
   - Monitor rate limiting

3. **Frontend Not Loading**
   - Check server is running
   - Verify port configuration
   - Check browser console for errors

4. **Memory Issues**
   - Optimize Puppeteer usage
   - Implement proper cleanup
   - Monitor memory usage

### Debug Commands
```bash
# Check application health
curl http://localhost:3000/health

# Test scraping
npm run scrape news

# Check logs
tail -f logs/app.log
```

## 📈 Performance Optimization

### Database
- Use appropriate indexes
- Implement query optimization
- Regular cleanup of old data
- Connection pooling

### Scraping
- Implement rate limiting
- Use efficient selectors
- Optimize Puppeteer usage
- Error handling and retries

### Frontend
- Optimize bundle size
- Implement caching
- Use CDN for static assets
- Minimize API calls

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env` files
- Use platform-specific secret management
- Rotate API keys regularly

### Database Security
- Use authentication
- Enable IP whitelisting
- Regular security updates
- Backup strategies

### API Security
- Implement rate limiting
- Use HTTPS everywhere
- Validate all inputs
- Error handling without sensitive data

## 📚 Additional Resources

### Documentation
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/guide/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Puppeteer API](https://pptr.dev/)

### Tools
- [MongoDB Compass](https://www.mongodb.com/products/compass)
- [Postman](https://www.postman.com/) for API testing
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)

### Community
- [Node.js Community](https://nodejs.org/en/community/)
- [MongoDB Community](https://community.mongodb.com/)
- [Stack Overflow](https://stackoverflow.com/)

## 🆘 Getting Help

1. **Check Documentation**: Review README.md and DEPLOYMENT.md
2. **Check Logs**: Look for error messages in console
3. **Test Locally**: Verify everything works locally first
4. **Create Issue**: Use GitHub issues for bug reports
5. **Community**: Ask questions in relevant communities

## 🎯 Next Steps

After successful setup:

1. **Customize Scraping**: Modify sources and intervals
2. **Add Features**: Implement additional data sources
3. **Deploy**: Choose a platform and deploy
4. **Monitor**: Set up monitoring and alerts
5. **Scale**: Optimize for production usage

---

**Happy Scraping! 🕷️**