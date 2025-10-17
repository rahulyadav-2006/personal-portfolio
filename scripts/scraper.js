const scraperService = require('../services/scraperService');
const cronService = require('../services/cronService');
require('dotenv').config();

async function runScraper() {
    const args = process.argv.slice(2);
    const type = args[0] || 'all';
    
    console.log(`🚀 Starting scraper for type: ${type}`);
    console.log(`📅 Time: ${new Date().toISOString()}`);
    
    try {
        let result;
        
        switch (type) {
            case 'news':
                result = await scraperService.scrapeNews();
                break;
            case 'crypto':
                result = await scraperService.scrapeCrypto();
                break;
            case 'weather':
                result = await scraperService.scrapeWeather();
                break;
            case 'all':
                result = await cronService.triggerAllScraping();
                break;
            default:
                console.error('❌ Invalid scraper type. Use: news, crypto, weather, or all');
                process.exit(1);
        }
        
        if (result.success) {
            console.log('✅ Scraping completed successfully');
            if (result.itemsSaved) {
                console.log(`📊 Items saved: ${result.itemsSaved}`);
            }
            if (result.results) {
                console.log('📊 Results by type:');
                Object.entries(result.results).forEach(([type, result]) => {
                    console.log(`  ${type}: ${result.itemsSaved || 0} items saved`);
                });
            }
        } else {
            console.error('❌ Scraping failed:', result.error);
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Scraper error:', error.message);
        process.exit(1);
    }
}

// Run scraper if this file is executed directly
if (require.main === module) {
    runScraper();
}

module.exports = runScraper;
