// WAVELENGTH SUPER POWER: Ultimate Direct Execution
const http = require('http');

console.log('🚀 WAVELENGTH SUPER POWER: ULTIMATE DIRECT TEST');
console.log('==============================================\n');

// Direct HTTP request without any shell dependencies
const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/forum/post/-OcTbtWHy2QvT9yGl89x',
    method: 'GET',
    headers: {
        'User-Agent': 'Wavelength-Super-Power-Test/1.0'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log(`📊 Status Code: ${res.statusCode}`);
        console.log(`📏 Response Size: ${data.length} characters`);
        
        // Parse HTML for key elements
        const titleMatch = data.match(/<h1[^>]*class="post-title"[^>]*>([^<]+)<\/h1>/);
        const contentMatch = data.match(/<div[^>]*class="post-content"[^>]*>([^<]+)<\/div>/);
        const authorMatch = data.match(/By\s+([^•]+)•/);
        
        const title = titleMatch ? titleMatch[1].trim() : 'NOT FOUND';
        const content = contentMatch ? contentMatch[1].trim() : 'NOT FOUND';
        const author = authorMatch ? authorMatch[1].trim() : 'NOT FOUND';
        
        console.log(`\n📝 EXTRACTED TITLE: "${title}"`);
        console.log(`👤 EXTRACTED AUTHOR: "${author}"`);
        console.log(`📄 EXTRACTED CONTENT: "${content.substring(0, 150)}..."`);
        
        // STRICT VALIDATION
        const titlePass = title.includes('The Melody of Moonlight');
        const authorPass = author.includes('Aria Moonwhisper');
        const contentPass = content.length > 100 && !content.includes('No content available');
        
        console.log(`\n🔍 VALIDATION RESULTS:`);
        console.log(`📝 Title: ${titlePass ? '✅ PASS' : '❌ FAIL'} - Expected "The Melody of Moonlight"`);
        console.log(`👤 Author: ${authorPass ? '✅ PASS' : '❌ FAIL'} - Expected "Aria Moonwhisper"`);
        console.log(`📄 Content: ${contentPass ? '✅ PASS' : '❌ FAIL'} - Expected substantial content`);
        
        if (titlePass && authorPass && contentPass) {
            console.log('\n🎉🎉🎉 SUCCESS! 🎉🎉🎉');
            console.log('✅ Template rendering is working correctly!');
            console.log('✅ Real data is displaying properly');
            console.log('✅ No fallback data detected');
        } else {
            console.log('\n🚨🚨🚨 FAILURE! 🚨🚨🚨');
            console.log('❌ Template rendering issue confirmed');
            console.log('❌ Fallback data or missing content detected');
            console.log('🔧 Investigation needed in template or route logic');
        }
        
        console.log('\n🚀 WAVELENGTH SUPER POWER TEST COMPLETE!');
    });
});

req.on('error', (err) => {
    console.error('❌ Request failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
        console.log('💡 Server not running on localhost:3001');
    }
});

req.end();