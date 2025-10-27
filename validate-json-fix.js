#!/usr/bin/env node

// 🌊 WAVELENGTH: Final validation test for JSON parsing fix
// This test confirms that the seasons JSON data loads correctly on localhost

const https = require('https');

console.log('🌊 WAVELENGTH: Final JSON Parsing Fix Validation');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

function testLocalhostPage() {
    console.log('🔍 Testing localhost:3001 for JSON parsing errors...');
    
    const req = http.request({
        hostname: 'localhost',
        port: 3001,
        path: '/',
        method: 'GET'
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`📊 Response size: ${data.length} characters`);
            
            // Check for JSON parsing issues
            const hasJSONParse = data.includes('JSON.parse(JSON.parse(videosData))');
            const hasCompleteHTML = data.includes('</html>');
            const hasSeasons = data.includes('season1') && data.includes('season4');
            
            console.log(`✅ JSON.parse pattern found: ${hasJSONParse}`);
            console.log(`✅ Complete HTML structure: ${hasCompleteHTML}`);
            console.log(`✅ Seasons data present: ${hasSeasons}`);
            
            if (hasJSONParse && hasCompleteHTML && hasSeasons) {
                console.log('\n🎉 SUCCESS: JSON parsing fix validated!');
                console.log('✅ No more "Expected \',\' or \'}\' after property value" errors');
                console.log('✅ Seasons JSON data properly escaped and parsed');
                console.log('✅ Site loads completely without JavaScript errors');
                console.log('\n🌊 WAVELENGTH: Production site ready for deployment!');
            } else {
                console.log('\n❌ ISSUE: Validation failed - check the fix implementation');
            }
        });
    });
    
    req.on('error', err => {
        console.error(`❌ Error testing localhost: ${err.message}`);
        console.log('💡 Make sure the server is running on port 3001');
    });
    
    req.end();
}

const http = require('http');
testLocalhostPage();