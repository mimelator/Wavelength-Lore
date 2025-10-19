#!/usr/bin/env node

/**
 * Simple Modal Image Test
 * Tests a few specific modal images to verify they're working correctly
 */

const fetch = require('node-fetch');

const testUrls = [
    'http://localhost:3001/images/seasons/season1/episodes/episode1/image.webp',
    'http://localhost:3001/images/seasons/season3/episodes/episode3/images/Sneak_Attack-16.webp',
    'http://localhost:3001/images/characters/wavelength/jewel-5.webp'
];

async function testImages() {
    console.log('🧪 Testing modal image URLs...\n');
    
    for (const url of testUrls) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            const status = response.status;
            const statusText = response.statusText;
            
            if (status === 200) {
                console.log(`✅ ${url}`);
                console.log(`   Status: ${status} ${statusText}\n`);
            } else {
                console.log(`❌ ${url}`);
                console.log(`   Status: ${status} ${statusText}\n`);
            }
        } catch (error) {
            console.log(`❌ ${url}`);
            console.log(`   Error: ${error.message}\n`);
        }
    }
}

testImages().catch(console.error);