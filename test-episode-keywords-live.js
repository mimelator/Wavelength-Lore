const http = require('http');

async function testEpisodeKeywords() {
    console.log('🎬 Testing Episode Keywords via HTTP requests\n');
    
    // Test 1: Check a page with episode content
    console.log('1. Testing episode linking on character page...');
    
    try {
        const response = await makeRequest('/character/lucky');
        
        if (response.includes('class="episode-link"')) {
            console.log('   ✅ Found episode links with correct CSS class');
            
            // Extract episode links
            const episodeLinks = response.match(/<a[^>]*class="episode-link"[^>]*>([^<]+)<\/a>/g);
            if (episodeLinks) {
                console.log(`   Found ${episodeLinks.length} episode links:`);
                episodeLinks.forEach(link => {
                    console.log(`      ${link}`);
                });
            }
        } else {
            console.log('   ⚪ No episode links found on Lucky\'s page');
        }
        
        // Test 2: Check for character links too
        if (response.includes('class="character-link"')) {
            console.log('   ✅ Character links are working');
        }
        
        // Test 3: Check for lore links
        if (response.includes('class="lore-link"')) {
            console.log('   ✅ Lore links are working');
        }
        
        console.log('\n2. Testing episode linking on lore page...');
        
        const loreResponse = await makeRequest('/lore/shire');
        
        if (loreResponse.includes('class="episode-link"')) {
            console.log('   ✅ Found episode links on Shire lore page');
            
            // Extract episode links
            const loreEpisodeLinks = loreResponse.match(/<a[^>]*class="episode-link"[^>]*>([^<]+)<\/a>/g);
            if (loreEpisodeLinks) {
                console.log(`   Found ${loreEpisodeLinks.length} episode links:`);
                loreEpisodeLinks.forEach(link => {
                    console.log(`      ${link}`);
                });
            }
        } else {
            console.log('   ⚪ No episode links found on Shire lore page');
        }
        
        console.log('\n3. Testing comprehensive linking...');
        
        // Test a page that should have all types of links
        const mauriceResponse = await makeRequest('/character/maurice');
        
        let linkTypes = [];
        if (mauriceResponse.includes('class="character-link"')) linkTypes.push('character');
        if (mauriceResponse.includes('class="lore-link"')) linkTypes.push('lore');
        if (mauriceResponse.includes('class="episode-link"')) linkTypes.push('episode');
        
        console.log(`   Maurice page has: ${linkTypes.join(', ')} links`);
        
        console.log('\n🎉 Episode keyword testing completed!\n');
        
    } catch (error) {
        console.error('❌ Error testing episode keywords:', error);
    }
}

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: 'GET'
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        req.end();
    });
}

// Run the test
testEpisodeKeywords().then(() => {
    console.log('Test completed');
    process.exit(0);
}).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});