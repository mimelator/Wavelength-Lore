#!/usr/bin/env node

/**
 * Quick Static Asset Validation
 * Tests a small sample of static assets to verify they're working
 */

const fetch = require('node-fetch');

const testUrls = [
    // CSS files
    'http://localhost:3001/static/css/styles.css',
    'http://localhost:3001/static/css/lore_styles.css',
    'http://localhost:3001/static/css/modal_styles.css',
    'http://localhost:3001/static/css/carousel.css',
    
    // Icon files  
    'http://localhost:3001/static/icons/favicon.svg',
    'http://localhost:3001/static/icons/episode-icon.svg',
    
    // Test both image serving paths
    'http://localhost:3001/images/seasons/season1/episodes/episode1/image.webp',
    'http://localhost:3001/static/images/seasons/season1/episodes/episode1/image.webp'
];

async function validateStaticAssets() {
    console.log('🧪 Testing static asset URLs...\n');
    
    let working = 0;
    let broken = 0;
    
    for (const url of testUrls) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            const status = response.status;
            const filename = url.split('/').pop();
            
            if (status === 200) {
                console.log(`✅ ${filename}: ${status}`);
                working++;
            } else {
                console.log(`❌ ${filename}: ${status}`);
                broken++;
            }
        } catch (error) {
            const filename = url.split('/').pop();
            console.log(`❌ ${filename}: ${error.message}`);
            broken++;
        }
    }
    
    console.log(`\n📊 Static Assets Summary: ${working} working, ${broken} broken (${Math.round(working/(working+broken)*100)}% success rate)`);
}

validateStaticAssets().catch(console.error);