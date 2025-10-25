#!/usr/bin/env node

/**
 * Simple Image Validation Script
 * Tests a small sample of images to identify real issues
 */

const fetch = require('node-fetch');

const testUrls = [
    // Episode main images
    'http://localhost:3001/images/seasons/season1/episodes/episode1/image.webp',
    'http://localhost:3001/images/seasons/season2/episodes/episode1/image.webp',
    'http://localhost:3001/images/seasons/season3/episodes/episode1/image.webp',
    'http://localhost:3001/images/seasons/season4/episodes/episode1/image.webp',
    
    // Carousel images
    'http://localhost:3001/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-10.webp',
    'http://localhost:3001/images/seasons/season1/episodes/episode1/images/MyLuckyCharm-11.webp',
    
    // Character images
    'http://localhost:3001/images/characters/wavelength/andrew-4.webp',
    'http://localhost:3001/images/characters/wavelength/jewel-5.webp',
    
    // Lore images
    'http://localhost:3001/images/seasons/season3/episodes/episode3/images/Sneak_Attack-16.webp',
    'http://localhost:3001/images/seasons/season4/episodes/episode3/images/GoblinsRule-17.webp'
];

async function validateImages() {
    console.log('🧪 Testing sample image URLs...\n');
    
    let working = 0;
    let broken = 0;
    
    for (const url of testUrls) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            const status = response.status;
            
            if (status === 200) {
                console.log(`✅ ${url.split('/').pop()}: ${status}`);
                working++;
            } else {
                console.log(`❌ ${url.split('/').pop()}: ${status}`);
                broken++;
            }
        } catch (error) {
            console.log(`❌ ${url.split('/').pop()}: ${error.message}`);
            broken++;
        }
    }
    
    console.log(`\n📊 Summary: ${working} working, ${broken} broken (${Math.round(working/(working+broken)*100)}% success rate)`);
}

validateImages().catch(console.error);