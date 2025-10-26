const axios = require('axios');
const cheerio = require('cheerio');

async function strictPostValidation() {
    console.log('🚨 WAVELENGTH SUPER POWER: STRICT POST VALIDATION');
    console.log('==================================================\n');

    const BASE_URL = 'http://localhost:3001';
    const POST_ID = '-OcTbtWHy2QvT9yGl89x';
    
    // Expected real data (not fallbacks)
    const EXPECTED_TITLE = 'The Melody of Moonlight';
    const EXPECTED_AUTHOR = 'Aria Moonwhisper';
    const EXPECTED_CONTENT_MIN_LENGTH = 800; // Real content should be ~847 chars
    
    // Fallback values that indicate failure
    const FALLBACK_VALUES = [
        'Untitled Post',
        'No content available', 
        'Unknown Author',
        'Post Not Found',
        'Error Loading Post'
    ];

    try {
        console.log('🎯 Testing Aria\'s post page...');
        const response = await axios.get(`${BASE_URL}/forum/post/${POST_ID}`);
        const html = cheerio.load(response.data);
        
        // Extract actual rendered content
        const renderedTitle = html('.post-title').text().trim();
        const renderedContent = html('.post-content').text().trim();
        const renderedAuthor = html('.post-author').text().trim();
        
        console.log(`📝 Rendered title: "${renderedTitle}"`);
        console.log(`👤 Rendered author info: "${renderedAuthor}"`);
        console.log(`📄 Rendered content length: ${renderedContent.length} chars`);
        
        // STRICT VALIDATION - FAIL LOUDLY ON FALLBACKS
        let failures = [];
        
        // Check for fallback title
        if (FALLBACK_VALUES.some(fallback => renderedTitle.includes(fallback))) {
            failures.push(`❌ FALLBACK TITLE DETECTED: "${renderedTitle}"`);
        }
        
        // Check for expected real title
        if (!renderedTitle.includes(EXPECTED_TITLE)) {
            failures.push(`❌ EXPECTED TITLE MISSING: Should contain "${EXPECTED_TITLE}"`);
        }
        
        // Check for fallback content
        if (FALLBACK_VALUES.some(fallback => renderedContent.includes(fallback))) {
            failures.push(`❌ FALLBACK CONTENT DETECTED: "${renderedContent.substring(0, 100)}..."`);
        }
        
        // Check content length (real content should be substantial)
        if (renderedContent.length < EXPECTED_CONTENT_MIN_LENGTH) {
            failures.push(`❌ CONTENT TOO SHORT: ${renderedContent.length} chars (expected >${EXPECTED_CONTENT_MIN_LENGTH})`);
        }
        
        // Check for expected author
        if (!renderedAuthor.includes(EXPECTED_AUTHOR)) {
            failures.push(`❌ EXPECTED AUTHOR MISSING: Should contain "${EXPECTED_AUTHOR}"`);
        }
        
        // Check for error messages
        const errorMessage = html('.error-message').length > 0;
        if (errorMessage) {
            failures.push(`❌ ERROR MESSAGE DISPLAYED: Template showing error state`);
        }
        
        // LOUD FAILURE REPORTING
        if (failures.length > 0) {
            console.log('\n🚨🚨🚨 TEST FAILED LOUDLY 🚨🚨🚨');
            console.log('=====================================');
            failures.forEach(failure => console.log(failure));
            console.log('\n💥 TEMPLATE RENDERING ISSUE DETECTED!');
            console.log('🔧 Real data exists but template is showing fallbacks');
            console.log('🎯 INVESTIGATION REQUIRED: Template not receiving proper data');
            
            process.exit(1); // FAIL LOUDLY
        }
        
        // SUCCESS - Real data is rendering
        console.log('\n✅ SUCCESS: Real post data is rendering correctly!');
        console.log(`   📝 Title: "${EXPECTED_TITLE}" ✓`);
        console.log(`   👤 Author: "${EXPECTED_AUTHOR}" ✓`);
        console.log(`   📄 Content: ${renderedContent.length} chars ✓`);
        
    } catch (error) {
        console.log('\n🚨🚨🚨 NETWORK/SERVER FAILURE 🚨🚨🚨');
        console.log('=====================================');
        console.error(`❌ ${error.message}`);
        if (error.response) {
            console.error(`❌ Status: ${error.response.status}`);
        }
        process.exit(1); // FAIL LOUDLY
    }
}

strictPostValidation().then(() => {
    console.log('\n🎉 STRICT VALIDATION PASSED - WAVELENGTH SUPER POWERS CONFIRMED!');
    process.exit(0);
}).catch(error => {
    console.error('\n💥 VALIDATION CRASHED:', error);
    process.exit(1);
});