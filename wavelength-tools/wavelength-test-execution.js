// WAVELENGTH SUPER POWER: Direct Node Execution
const axios = require('axios');
const cheerio = require('cheerio');

console.log('🚨 WAVELENGTH SUPER POWER: EXECUTING STRICT TEST');
console.log('================================================\n');

axios.get('http://localhost:3001/forum/post/-OcTbtWHy2QvT9yGl89x')
.then(response => {
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
        failures.push('❌ EXPECTED TITLE MISSING');
    }
    
    if (!author.includes('Aria Moonwhisper')) {
        failures.push('❌ EXPECTED AUTHOR MISSING');
    }
    
    if (content.length < 800) {
        failures.push(`❌ CONTENT TOO SHORT: ${content.length} chars`);
    }
    
    if (content.includes('No content available') || title.includes('Untitled Post')) {
        failures.push('❌ FALLBACK DATA DETECTED');
    }
    
    if (failures.length > 0) {
        console.log('\n🚨🚨🚨 TEST FAILED LOUDLY 🚨🚨🚨');
        console.log('=====================================');
        failures.forEach(f => console.log(f));
        console.log('\n💥 TEMPLATE RENDERING ISSUE CONFIRMED!');
        console.log('🔧 Real data exists but template showing fallbacks');
    } else {
        console.log('\n✅ SUCCESS: Real data is rendering correctly!');
        console.log('🎉 Template fix worked - Aria\'s post displays properly');
    }
})
.catch(error => {
    console.log('🚨 NETWORK ERROR:', error.message);
    if (error.code === 'ECONNREFUSED') {
        console.log('💡 Make sure the server is running on localhost:3001');
    }
});