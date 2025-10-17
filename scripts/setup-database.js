const mongoose = require('mongoose');
require('dotenv').config();

const ScrapedData = require('../models/ScrapedData');
const ScrapingLog = require('../models/ScrapingLog');

async function setupDatabase() {
    try {
        console.log('🔧 Setting up database...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/live-data-scraper', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Create indexes for better performance
        console.log('📊 Creating database indexes...');
        
        // ScrapedData indexes
        await ScrapedData.collection.createIndex({ dataType: 1, publishedAt: -1 });
        await ScrapedData.collection.createIndex({ source: 1, scrapedAt: -1 });
        await ScrapedData.collection.createIndex({ publishedAt: -1, priority: -1 });
        await ScrapedData.collection.createIndex({ isActive: 1, dataType: 1 });
        await ScrapedData.collection.createIndex({ url: 1, dataType: 1 });
        await ScrapedData.collection.createIndex({ 
            title: 'text', 
            description: 'text', 
            tags: 'text' 
        });
        
        // ScrapingLog indexes
        await ScrapingLog.collection.createIndex({ dataType: 1, completedAt: -1 });
        await ScrapingLog.collection.createIndex({ source: 1, completedAt: -1 });
        await ScrapingLog.collection.createIndex({ status: 1, completedAt: -1 });
        await ScrapingLog.collection.createIndex({ completedAt: -1 });
        
        console.log('✅ Database indexes created');
        
        // Insert sample data for testing
        console.log('📝 Inserting sample data...');
        
        const sampleData = [
            {
                dataType: 'news',
                source: 'Sample News',
                title: 'Sample News Article 1',
                description: 'This is a sample news article for testing purposes.',
                url: 'https://example.com/news/1',
                publishedAt: new Date(),
                tags: ['sample', 'test', 'news'],
                priority: 5,
                metadata: {
                    category: 'technology',
                    author: 'Sample Author'
                }
            },
            {
                dataType: 'crypto',
                source: 'Sample Crypto',
                title: 'Bitcoin (BTC) - $45,000',
                description: '24h Change: +2.5% | Market Cap: $850B | Volume: $25B',
                url: 'https://example.com/crypto/bitcoin',
                publishedAt: new Date(),
                tags: ['cryptocurrency', 'bitcoin', 'btc'],
                priority: 8,
                metadata: {
                    symbol: 'BTC',
                    price: '$45,000',
                    change24h: '+2.5%',
                    marketCap: '$850B',
                    volume: '$25B',
                    rank: 1
                }
            },
            {
                dataType: 'weather',
                source: 'Sample Weather',
                title: 'New York, US - 22°C',
                description: 'Partly cloudy | Humidity: 65% | Wind: 12 km/h',
                url: 'https://example.com/weather/new-york',
                publishedAt: new Date(),
                tags: ['weather', 'new-york', 'us'],
                priority: 5,
                metadata: {
                    city: 'New York',
                    country: 'US',
                    temperature: 22,
                    description: 'Partly cloudy',
                    humidity: 65,
                    windSpeed: 12,
                    pressure: 1013,
                    visibility: 10
                }
            }
        ];
        
        // Insert sample data if collection is empty
        const existingData = await ScrapedData.countDocuments();
        if (existingData === 0) {
            await ScrapedData.insertMany(sampleData);
            console.log('✅ Sample data inserted');
        } else {
            console.log('ℹ️ Sample data already exists, skipping insertion');
        }
        
        // Insert sample log entry
        const sampleLog = {
            dataType: 'news',
            source: 'Sample Setup',
            status: 'success',
            itemsScraped: 3,
            itemsProcessed: 3,
            itemsSaved: 3,
            duration: 5000,
            startedAt: new Date(Date.now() - 60000),
            completedAt: new Date()
        };
        
        await ScrapingLog.create(sampleLog);
        console.log('✅ Sample log entry created');
        
        console.log('🎉 Database setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase();
}

module.exports = setupDatabase;
