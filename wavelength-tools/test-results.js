// WAVELENGTH SUPER POWER: Direct test execution
const axios = require('axios');
const cheerio = require('cheerio');

console.log('🚨 EXECUTING STRICT VALIDATION TEST...\n');

const BASE_URL = 'http://localhost:3001';
const POST_ID = '-OcTbtWHy2QvT9yGl89x';

axios.get(`${BASE_URL}/forum/post/${POST_ID}`)
.then(response => {
    const html = cheerio.load(response.data);
    
    const title = html('.post-title').text().trim();
    const content = html('.post-content').text().trim();
    const author = html('.post-author').text().trim();
    
    console.log(`📝 Title: "${title}"`);
    console.log(`👤 Author: "${author}"`);
    console.log(`📄 Content: ${content.length} chars`);
    console.log(`📄 Content preview: "${content.substring(0, 100)}..."`);
    
    // Check for failures
    const failures = [];
    
    if (!title.includes('The Melody of Moonlight')) {
        failures.push('❌ MISSING EXPECTED TITLE');
    }
    
    if (!author.includes('Aria Moonwhisper')) {
        failures.push('❌ MISSING EXPECTED AUTHOR');
    }
    
    if (content.length < 800) {
        failures.push(`❌ CONTENT TOO SHORT: ${content.length} chars`);
    }
    
    if (content.includes('No content available') || title.includes('Untitled Post')) {
        failures.push('❌ FALLBACK DATA DETECTED');
    }
    
    if (failures.length > 0) {
        console.log('\n🚨🚨🚨 TEST FAILED LOUDLY 🚨🚨🚨');
        failures.forEach(f => console.log(f));
        console.log('\n💥 TEMPLATE RENDERING ISSUE CONFIRMED!');
    } else {
        console.log('\n✅ SUCCESS: Real data is rendering!');
    }
})
.catch(error => {
    console.log('🚨 NETWORK ERROR:', error.message);
});