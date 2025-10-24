#!/usr/bin/env node

/**
 * CRITICAL S3 BUCKET INVESTIGATION
 * Direct probe of S3 to find WHERE the product images actually are
 */

const AWS = require('aws-sdk');

async function investigateS3Bucket() {
    console.log('🚨 CRITICAL S3 BUCKET INVESTIGATION\n');
    console.log('Finding WHERE the product images actually exist...\n');
    
    // Initialize S3 with same config as resolver
    const s3 = new AWS.S3({
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
        region: 'us-east-1'
    });
    
    const bucket = 'wavelength-gallery-346923';
    
    console.log(`🪣 Investigating bucket: ${bucket}\n`);
    
    // Our test images from the catalog
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
        // 1. FULL BUCKET SCAN - Find ALL upscaled images
        console.log('1️⃣ FULL UPSCALED DIRECTORY SCAN');
        console.log('='.repeat(50));
        
        const upscaledParams = {
            Bucket: bucket,
            Prefix: 'upscaled/',
            MaxKeys: 1000
        };
        
        const upscaledResult = await s3.listObjectsV2(upscaledParams).promise();
        console.log(`📦 Found ${upscaledResult.Contents.length} objects in upscaled/ directory\n`);
        
        const upscaledImages = {};
        upscaledResult.Contents.forEach(obj => {
            const key = obj.Key;
            const filename = key.split('/').pop();
            
            // Look for base names that match our test images
            testImages.forEach(testImage => {
                const baseName = testImage.replace(/\.[^.]+$/, ''); // Remove extension
                if (filename.includes(baseName) || key.includes(testImage)) {
                    if (!upscaledImages[testImage]) upscaledImages[testImage] = [];
                    upscaledImages[testImage].push(key);
                }
            });
            
            console.log(`   📁 ${key} (${obj.Size} bytes, ${obj.LastModified})`);
        });
        
        // 2. ROOT LEVEL SCAN - Find original images
        console.log('\n\n2️⃣ ROOT LEVEL IMAGE SCAN');
        console.log('='.repeat(50));
        
        for (const testImage of testImages) {
            console.log(`\n🔍 Searching for: ${testImage}`);
            
            try {
                // Check exact match in root
                const rootParams = {
                    Bucket: bucket,
                    Key: testImage
                };
                
                await s3.headObject(rootParams).promise();
                console.log(`   ✅ Found in root: ${testImage}`);
            } catch (error) {
                console.log(`   ❌ NOT in root: ${testImage}`);
            }
            
            // Check with various prefixes
            const prefixes = ['images/', 'gallery/', 'anonymous/', 'products/', ''];
            
            for (const prefix of prefixes) {
                try {
                    const prefixParams = {
                        Bucket: bucket,
                        Key: `${prefix}${testImage}`
                    };
                    
                    await s3.headObject(prefixParams).promise();
                    console.log(`   ✅ Found with prefix: ${prefix}${testImage}`);
                } catch (error) {
                    // Silent - we expect most to fail
                }
            }
        }
        
        // 3. GALLERY USER DIRECTORIES SCAN
        console.log('\n\n3️⃣ GALLERY USER DIRECTORIES SCAN');
        console.log('='.repeat(50));
        
        const galleryParams = {
            Bucket: bucket,
            Prefix: 'images/gallery/',
            Delimiter: '/',
            MaxKeys: 50
        };
        
        const galleryResult = await s3.listObjectsV2(galleryParams).promise();
        console.log(`📁 Found ${galleryResult.CommonPrefixes?.length || 0} user directories in gallery\n`);
        
        if (galleryResult.CommonPrefixes) {
            for (const prefix of galleryResult.CommonPrefixes.slice(0, 5)) { // Check first 5 users
                const userDir = prefix.Prefix;
                console.log(`\n👤 Checking user directory: ${userDir}`);
                
                const userParams = {
                    Bucket: bucket,
                    Prefix: userDir,
                    MaxKeys: 100
                };
                
                const userResult = await s3.listObjectsV2(userParams).promise();
                console.log(`   📦 ${userResult.Contents.length} files in user directory`);
                
                userResult.Contents.forEach(obj => {
                    const filename = obj.Key.split('/').pop();
                    testImages.forEach(testImage => {
                        if (filename === testImage || filename.includes(testImage.replace(/\.[^.]+$/, ''))) {
                            console.log(`   🎯 MATCH: ${obj.Key} → ${testImage}`);
                        }
                    });
                });
            }
        }
        
        // 4. SUMMARY ANALYSIS
        console.log('\n\n4️⃣ CRITICAL FINDINGS SUMMARY');
        console.log('='.repeat(50));
        
        console.log(`\n📊 UPSCALED IMAGES FOUND:`);
        Object.keys(upscaledImages).forEach(testImage => {
            console.log(`   ${testImage}:`);
            upscaledImages[testImage].forEach(path => {
                console.log(`      → ${path}`);
            });
        });
        
        const foundUpscaled = Object.keys(upscaledImages).length;
        const missingUpscaled = testImages.length - foundUpscaled;
        
        console.log(`\n🎯 RESOLUTION ANALYSIS:`);
        console.log(`   ✅ Images with upscaled versions: ${foundUpscaled}/${testImages.length}`);
        console.log(`   ❌ Images WITHOUT upscaled versions: ${missingUpscaled}/${testImages.length}`);
        
        if (missingUpscaled > 0) {
            console.log(`\n🚨 CRITICAL FINDING:`);
            console.log(`   ${missingUpscaled} images are missing upscaled versions!`);
            console.log(`   These products should NOT exist if upscaling was required.`);
            console.log(`   This suggests the product creation process bypassed upscaling.`);
        }
        
        // 5. RESOLVER FIX RECOMMENDATIONS
        console.log('\n\n5️⃣ RESOLVER FIX RECOMMENDATIONS');
        console.log('='.repeat(50));
        
        console.log('\n🔧 Based on findings, the resolver should:');
        console.log('   1. Search user gallery directories for source images');
        console.log('   2. Check multiple path patterns in S3');
        console.log('   3. Handle cases where products exist without upscaled versions');
        console.log('   4. Improve fallback URL construction');
        
        console.log('\n' + '='.repeat(70));
        console.log('🎯 INVESTIGATION COMPLETE - Now we know where images actually are!');
        console.log('='.repeat(70));
        
    } catch (error) {
        console.error('❌ S3 Investigation failed:', error);
    }
}

// Run the investigation
if (require.main === module) {
    investigateS3Bucket().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('❌ Investigation failed:', error);
        process.exit(1);
    });
}

module.exports = investigateS3Bucket;