#!/usr/bin/env node

/**
 * Targeted Page Image Validation
 * Tests a sample of pages to understand remaining image issues
 */

const fetch = require('node-fetch');
const cheerio = require('cheerio');

const testPages = [
    'http://localhost:3001/',
    'http://localhost:3001/character/andrew',
    'http://localhost:3001/lore/goblin',
    'http://localhost:3001/season/1/episode/1',
    'http://localhost:3001/season/4/episode/6', // Known to have many broken images
    'http://localhost:3001/characters',
    'http://localhost:3001/lore'
];

async function validatePageImages(url) {
    try {
        console.log(`\n🔍 Checking ${url}`);
        
        const response = await fetch(url);
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const images = [];
        $('img').each((i, elem) => {
            const src = $(elem).attr('src');
            if (src && src.startsWith('http://localhost:3001/images/')) {
                images.push(src);
            }
        });
        
        console.log(`   📸 Found ${images.length} local images to test`);
        
        let working = 0;
        let broken = 0;
        const brokenUrls = [];
        
        // Test a sample of images (max 10 per page to avoid overwhelming)
        const sampleImages = images.slice(0, 10);
        
        for (const imageUrl of sampleImages) {
            try {
                const imgResponse = await fetch(imageUrl, { method: 'HEAD' });
                if (imgResponse.status === 200) {
                    working++;
                } else {
                    broken++;
                    brokenUrls.push(`${imageUrl.split('/').pop()} (${imgResponse.status})`);
                }
            } catch (error) {
                broken++;
                brokenUrls.push(`${imageUrl.split('/').pop()} (error)`);
            }
        }
        
        console.log(`   ✅ Working: ${working}, ❌ Broken: ${broken}`);
        if (brokenUrls.length > 0) {
            console.log(`   Broken images: ${brokenUrls.slice(0, 3).join(', ')}${brokenUrls.length > 3 ? ` ...and ${brokenUrls.length - 3} more` : ''}`);
        }
        
        return { working, broken, total: sampleImages.length };
        
    } catch (error) {
        console.log(`   ❌ Error testing page: ${error.message}`);
        return { working: 0, broken: 0, total: 0 };
    }
}

async function runTargetedValidation() {
    console.log('🧪 Running targeted page image validation...');
    
    let totalWorking = 0;
    let totalBroken = 0;
    let totalImages = 0;
    
    for (const url of testPages) {
        const results = await validatePageImages(url);
        totalWorking += results.working;
        totalBroken += results.broken;
        totalImages += results.total;
    }
    
    console.log(`\n📊 Targeted Validation Summary:`);
    console.log(`   📸 Total images tested: ${totalImages}`);
    console.log(`   ✅ Working: ${totalWorking} (${Math.round(totalWorking/totalImages*100)}%)`);
    console.log(`   ❌ Broken: ${totalBroken} (${Math.round(totalBroken/totalImages*100)}%)`);
}

runTargetedValidation().catch(console.error);