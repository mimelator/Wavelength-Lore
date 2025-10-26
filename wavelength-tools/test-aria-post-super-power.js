// WAVELENGTH SUPER POWER: HTTP Request Test
const https = require('https');
const http = require('http');

console.log('🚀 WAVELENGTH SUPER POWER: HTTP REQUEST TEST');
console.log('============================================\n');

const url = 'http://localhost:3001/forum/post/-OcTbtWHy2QvT9yGl89x';

const req = http.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`📏 Content Length: ${data.length} chars`);
        
        // Extract key elements
        const titleMatch = data.match(/<h1[^>]*class="post-title"[^>]*>([^<]+)<\/h1>/);
        const contentMatch = data.match(/<div[^>]*class="post-content"[^>]*>([^<]+)<\/div>/);
        const authorMatch = data.match(/By ([^•]+)•/);
        
        const title = titleMatch ? titleMatch[1].trim() : 'NOT FOUND';
        const content = contentMatch ? contentMatch[1].trim() : 'NOT FOUND';
        const author = authorMatch ? authorMatch[1].trim() : 'NOT FOUND';
        
        console.log(`📝 TITLE: "${title}"`);
        console.log(`👤 AUTHOR: "${author}"`);
        console.log(`📄 CONTENT: "${content.substring(0, 100)}..."`);
        
        // STRICT VALIDATION
        const failures = [];
        
        if (!title.includes('The Melody of Moonlight')) {
            failures.push('❌ EXPECTED TITLE MISSING');
        }
        
        if (!author.includes('Aria Moonwhisper')) {
            failures.push('❌ EXPECTED AUTHOR MISSING');
        }
        
        if (content.length < 100 || content.includes('No content available')) {
            failures.push('❌ CONTENT ISSUE');
        }
        
        if (failures.length > 0) {
            console.log('\n🚨🚨🚨 TEST FAILED LOUDLY 🚨🚨🚨');
            console.log('=====================================');
            failures.forEach(f => console.log(f));
            console.log('\n💥 TEMPLATE RENDERING ISSUE CONFIRMED!');
        } else {
            console.log('\n✅ SUCCESS: Real data is rendering correctly!');
            console.log('🎉 Template fix worked - Aria\'s post displays properly');
        }
    });
}).on('error', (err) => {
    console.log('🚨 ERROR:', err.message);
    if (err.code === 'ECONNREFUSED') {
        console.log('💡 Make sure the server is running on localhost:3001');
    }
});