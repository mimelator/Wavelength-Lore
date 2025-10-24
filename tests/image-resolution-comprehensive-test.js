#!/usr/bin/env node

/**
 * Comprehensive Image Resolution Test Suite
 * Tests actual catalog data to prove image resolution logic works for ALL images
 */

const axios = require('axios');

async function testImageResolutionLogic() {
    console.log('🔍 COMPREHENSIVE IMAGE RESOLUTION TEST SUITE\n');
    console.log('Testing actual catalog data to diagnose resolution failures...\n');
    
    const baseUrl = 'http://localhost:3001';
    
    // Real source image IDs from the catalog
    const realSourceImages = [
        '-daphne-.png',
        'battle-scene-for-product-previ.webp',
        'daphne.webp',
        'goblin-king.webp',
        'ice-blue-diamond.webp',
        'ice-dragons.webp',
        'jewel.webp',
        'misery-of-goblins.webp'
    ];
    
    console.log(`📋 Testing ${realSourceImages.length} real source images from catalog:\n`);
    
    const results = {
        successful: [],
        failed: [],
        errors: []
    };
    
    // Test 1: Individual Resolution Testing
    console.log('1️⃣ INDIVIDUAL RESOLUTION TESTING');
    console.log('='.repeat(50));
    
    for (const sourceImage of realSourceImages) {
        try {
            console.log(`\n🔍 Testing: ${sourceImage}`);
            const response = await axios.get(`${baseUrl}/api/product-image/resolve/${encodeURIComponent(sourceImage)}`);
            
            if (response.status === 200 && response.data.success) {
                const resolution = response.data.resolution;
                results.successful.push({
                    sourceImage,
                    type: resolution.type,
                    url: resolution.url,
                    success: resolution.success
                });
                
                console.log(`   ✅ SUCCESS: ${resolution.type}`);
                console.log(`   🔗 URL: ${resolution.url?.substring(0, 80)}...`);
                
                if (resolution.type === 'upscaled') {
                    console.log(`   🎯 UPSCALED image found!`);
                } else if (resolution.type === 'original') {
                    console.log(`   📸 Original image found`);
                } else {
                    console.log(`   🔄 Fallback used`);
                }
            } else {
                results.failed.push({
                    sourceImage,
                    error: 'API returned unsuccessful response',
                    data: response.data
                });
                console.log(`   ❌ FAILED: API returned unsuccessful response`);
            }
            
        } catch (error) {
            results.errors.push({
                sourceImage,
                error: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
            console.log(`   ❌ ERROR: ${error.message}`);
            if (error.response?.status) {
                console.log(`   📊 Status: ${error.response.status}`);
            }
        }
    }
    
    // Test 2: Batch Resolution Testing
    console.log('\n\n2️⃣ BATCH RESOLUTION TESTING');
    console.log('='.repeat(50));
    
    try {
        console.log(`\n🔍 Testing batch resolution of all ${realSourceImages.length} images...`);
        const batchResponse = await axios.post(`${baseUrl}/api/product-image/resolve-batch`, {
            sourceImageIds: realSourceImages
        });
        
        if (batchResponse.status === 200 && batchResponse.data.success) {
            console.log(`✅ Batch API succeeded`);
            console.log(`📦 Processed ${batchResponse.data.resolutions.length} images`);
            
            batchResponse.data.resolutions.forEach((resolution, index) => {
                const sourceImage = realSourceImages[index];
                console.log(`\n   📸 ${sourceImage}:`);
                console.log(`      Type: ${resolution.type}`);
                console.log(`      Success: ${resolution.success}`);
                console.log(`      URL: ${resolution.url?.substring(0, 60)}...`);
            });
        } else {
            console.log(`❌ Batch API failed`);
            console.log(`Data:`, batchResponse.data);
        }
    } catch (error) {
        console.log(`❌ Batch API error: ${error.message}`);
        if (error.response?.data) {
            console.log(`Data:`, error.response.data);
        }
    }
    
    // Test 3: S3 Bucket Direct Investigation
    console.log('\n\n3️⃣ S3 BUCKET DIRECT INVESTIGATION');
    console.log('='.repeat(50));
    
    try {
        console.log('\n🪣 Investigating S3 bucket contents...');
        const s3Response = await axios.get(`${baseUrl}/api/debug/s3-bucket-contents`);
        
        if (s3Response.status === 200) {
            console.log('✅ S3 bucket investigation successful');
            // This endpoint doesn't exist yet, we'll create it
        }
    } catch (error) {
        console.log('⚠️ S3 investigation endpoint not available (expected)');
    }
    
    // Test 4: Results Summary and Diagnosis
    console.log('\n\n4️⃣ RESULTS SUMMARY AND DIAGNOSIS');
    console.log('='.repeat(50));
    
    console.log(`\n📊 RESOLUTION STATISTICS:`);
    console.log(`   ✅ Successful: ${results.successful.length}/${realSourceImages.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}/${realSourceImages.length}`);
    console.log(`   🚨 Errors: ${results.errors.length}/${realSourceImages.length}`);
    
    if (results.successful.length > 0) {
        console.log(`\n✅ SUCCESSFUL RESOLUTIONS:`);
        results.successful.forEach(result => {
            console.log(`   • ${result.sourceImage} → ${result.type} (${result.success ? 'success' : 'fallback'})`);
        });
    }
    
    if (results.failed.length > 0) {
        console.log(`\n❌ FAILED RESOLUTIONS:`);
        results.failed.forEach(result => {
            console.log(`   • ${result.sourceImage} → ${result.error}`);
        });
    }
    
    if (results.errors.length > 0) {
        console.log(`\n🚨 ERROR RESOLUTIONS:`);
        results.errors.forEach(result => {
            console.log(`   • ${result.sourceImage} → ${result.error} (Status: ${result.status})`);
        });
    }
    
    // Test 5: Root Cause Analysis
    console.log('\n\n5️⃣ ROOT CAUSE ANALYSIS');
    console.log('='.repeat(50));
    
    const successRate = results.successful.length / realSourceImages.length;
    
    if (successRate < 0.5) {
        console.log('\n🚨 CRITICAL ISSUE DETECTED:');
        console.log(`   Success rate: ${(successRate * 100).toFixed(1)}% (Below 50%)`);
        console.log('\n🔍 Possible causes:');
        console.log('   1. S3 bucket path mapping incorrect');
        console.log('   2. File extension handling broken');
        console.log('   3. URL encoding issues');
        console.log('   4. CDN path construction problems');
        console.log('   5. AWS credentials/permissions issues');
    } else if (successRate < 1.0) {
        console.log('\n⚠️ PARTIAL FAILURE DETECTED:');
        console.log(`   Success rate: ${(successRate * 100).toFixed(1)}%`);
        console.log('\n🔍 Some images failing - likely specific file issues');
    } else {
        console.log('\n✅ ALL RESOLUTIONS SUCCESSFUL');
        console.log('   Image resolution logic is working correctly!');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📋 DIAGNOSTIC COMPLETE - Use results to fix resolution logic');
    console.log('='.repeat(70));
}

// Run the comprehensive test
if (require.main === module) {
    testImageResolutionLogic().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = testImageResolutionLogic;