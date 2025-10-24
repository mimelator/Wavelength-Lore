#!/usr/bin/env node

/**
 * USER GALLERY DIRECTORY INVESTIGATION
 * Find the actual source images in the user gallery
 */

const AWS = require('aws-sdk');

async function investigateUserGallery() {
    console.log('🔍 USER GALLERY DIRECTORY INVESTIGATION\n');
    
    const s3 = new AWS.S3({
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
        region: 'us-east-1'
    });
    
    const bucket = 'wavelength-gallery-346923';
    const userDir = 'images/gallery/4fdbYxJHjEP4xksk9sgFE3lgYUs2/';
    
    console.log(`📁 Investigating: ${userDir}\n`);
    
    const testImages = [
        '-daphne-.png',
        'battle-scene-for-product-previ.webp',
        'daphne.webp',
        'goblin-king.webp',
        'ice-blue-diamond.webp',
        'ice-dragons.webp',
        'jewel.webp',
        'misery-of-goblins.webp'
    ];
    
    try {
        const params = {
            Bucket: bucket,
            Prefix: userDir,
            MaxKeys: 100
        };
        
        const result = await s3.listObjectsV2(params).promise();
        console.log(`📦 Found ${result.Contents.length} files in user gallery:\n`);
        
        const matches = {};
        const allFiles = [];
        
        result.Contents.forEach(obj => {
            const fullKey = obj.Key;
            const filename = fullKey.split('/').pop();
            allFiles.push({ key: fullKey, filename, size: obj.Size, modified: obj.LastModified });
            
            // Check for exact matches
            testImages.forEach(testImage => {
                if (filename === testImage) {
                    if (!matches[testImage]) matches[testImage] = [];
                    matches[testImage].push({ key: fullKey, type: 'exact' });
                }
            });
            
            // Check for base name matches (without extension)
            testImages.forEach(testImage => {
                const baseName = testImage.replace(/\.[^.]+$/, '');
                const fileBaseName = filename.replace(/\.[^.]+$/, '');
                if (fileBaseName === baseName && filename !== testImage) {
                    if (!matches[testImage]) matches[testImage] = [];
                    matches[testImage].push({ key: fullKey, type: 'base_match' });
                }
            });
        });
        
        // Show all files
        console.log('📋 ALL FILES IN USER GALLERY:');
        allFiles.forEach(file => {
            console.log(`   📄 ${file.filename}`);
            console.log(`      Key: ${file.key}`);
            console.log(`      Size: ${file.size} bytes`);
            console.log(`      Modified: ${file.modified}`);
            console.log('');
        });
        
        // Show matches
        console.log('🎯 MATCHES FOR TEST IMAGES:');
        console.log('='.repeat(50));
        
        testImages.forEach(testImage => {
            console.log(`\n📸 ${testImage}:`);
            if (matches[testImage]) {
                matches[testImage].forEach(match => {
                    console.log(`   ✅ ${match.type}: ${match.key}`);
                });
            } else {
                console.log(`   ❌ No matches found`);
            }
        });
        
        // Construct proper URLs
        console.log('\n\n🔗 CORRECT URLS FOR RESOLVER:');
        console.log('='.repeat(50));
        
        const cdnUrl = 'https://d3ohg9sf8htmwk.cloudfront.net';
        
        Object.keys(matches).forEach(testImage => {
            console.log(`\n${testImage}:`);
            matches[testImage].forEach(match => {
                const correctUrl = `${cdnUrl}/${match.key}`;
                console.log(`   🔗 ${correctUrl}`);
            });
        });
        
        // Fix recommendation
        console.log('\n\n🔧 RESOLVER FIX NEEDED:');
        console.log('='.repeat(50));
        console.log('');
        console.log('The ProductImageUrlResolver must be updated to:');
        console.log('1. Search user gallery directories for source images');
        console.log('2. Use the full S3 key path in the CDN URL');
        console.log('3. Handle user-specific gallery paths properly');
        console.log('');
        console.log('Current fallback: https://d3ohg9sf8htmwk.cloudfront.net/filename.ext');
        console.log('Should be: https://d3ohg9sf8htmwk.cloudfront.net/images/gallery/userId/filename.ext');
        
    } catch (error) {
        console.error('❌ Investigation failed:', error);
    }
}

investigateUserGallery();