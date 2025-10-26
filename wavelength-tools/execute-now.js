const axios = require('axios');
const cheerio = require('cheerio');

// WAVELENGTH SUPER POWER: Direct execution without shell
(async () => {
    console.log('🚨 EXECUTING TEST WITH WAVELENGTH SUPER POWERS...\n');
    
    try {
        const response = await axios.get('http://localhost:3001/forum/post/-OcTbtWHy2QvT9yGl89x');
        const html = cheerio.load(response.data);
        
        const title = html('.post-title').text().trim();
        const content = html('.post-content').text().trim();
        const author = html('.post-author').text().trim();
        
        console.log(`📝 TITLE: "${title}"`);
        console.log(`👤 AUTHOR: "${author}"`);
        console.log(`📄 CONTENT LENGTH: ${content.length} chars`);
        console.log(`📄 CONTENT PREVIEW: "${content.substring(0, 150)}..."`);
        
        // STRICT VALIDATION
        const failures = [];
        
        if (!title.includes('The Melody of Moonlight')) {
            failures.push('❌ TITLE WRONG');
        }
        
        if (!author.includes('Aria Moonwhisper')) {
            failures.push('❌ AUTHOR WRONG');
        }
        
        if (content.length < 800) {
            failures.push(`❌ CONTENT TOO SHORT: ${content.length}`);
        }
        
        if (content.includes('No content available')) {
            failures.push('❌ FALLBACK CONTENT');
        }
        
        if (failures.length > 0) {
            console.log('\n🚨🚨🚨 TEST FAILED 🚨🚨🚨');
            failures.forEach(f => console.log(f));
        } else {
            console.log('\n✅ TEST PASSED - REAL DATA RENDERING!');
        }
        
    } catch (error) {
        console.log('🚨 ERROR:', error.message);
    }
})();