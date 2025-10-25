#!/usr/bin/env node

/**
 * VENDOR-BLUEPRINT COMBINATION TEST
 * 
 * Tests different vendor/blueprint combinations to find what works vs what fails
 */

require('dotenv').config();

async function testVendorBlueprintCombinations() {
    console.log('🧪 VENDOR-BLUEPRINT COMBINATION TEST');
    console.log('===================================\n');

    try {
        // Initialize services
        console.log('1️⃣ Initializing services...');
        const EnhancedPrintifyService = require('../../services/enhanced-printify-service');
        const printifyService = new EnhancedPrintifyService();
        console.log('   ✅ Service initialized');

        // Get a test image
        console.log('\n2️⃣ Getting test image...');
        const axios = require('axios');
        const userId = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';
        
        const galleryResponse = await axios.get('http://localhost:3001/api/gallery/user/images', {
            headers: {
                'X-User-ID': userId,
                'X-API-Request': 'test'
            }
        });
        
        const firstImage = galleryResponse.data.images[0];
        console.log(`   ✅ Using: ${firstImage.title}`);

        // Download image
        const imageResponse = await axios.get(firstImage.url, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        const imageBuffer = Buffer.from(imageResponse.data);
        console.log(`   📦 Size: ${Math.round(imageBuffer.length / 1024)}KB`);

        // Test combinations that we know have worked before
        console.log('\n3️⃣ Testing known working combinations...');
        
        const knownWorkingCombinations = [
            { blueprintId: 5, vendorId: 1, name: 'Unisex Cotton Crew Tee + Printful' },
            { blueprintId: 5, vendorId: 3, name: 'Unisex Cotton Crew Tee + Marco Fine Arts' },
            { blueprintId: 6, vendorId: 1, name: 'Unisex Heavy Cotton Tee + Printful' },
            { blueprintId: 6, vendorId: 3, name: 'Unisex Heavy Cotton Tee + Marco Fine Arts' }
        ];

        const results = [];

        for (const combo of knownWorkingCombinations) {
            console.log(`\n🔍 Testing: ${combo.name}`);
            
            try {
                // Test image upload first
                const uploadResult = await printifyService.uploadImage(
                    imageBuffer, 
                    `test-${combo.blueprintId}-${combo.vendorId}.png`, 
                    `Test for ${combo.name}`
                );
                
                if (uploadResult.success) {
                    console.log(`   ✅ Image upload: SUCCESS`);
                    
                    // Test product creation
                    const productResult = await printifyService.createCustomProductWithBlueprint(uploadResult.imageId, {
                        title: `Test ${combo.name}`,
                        description: `Test product for combination testing`,
                        blueprintId: combo.blueprintId,
                        printProviderId: combo.vendorId,
                        basePrice: 2000
                    });
                    
                    console.log(`   ✅ Product creation: SUCCESS - ${productResult.productId}`);
                    
                    results.push({
                        ...combo,
                        status: 'SUCCESS',
                        productId: productResult.productId,
                        imageId: uploadResult.imageId
                    });
                    
                    // Clean up immediately
                    try {
                        await printifyService.deleteProduct(productResult.productId);
                        console.log(`   🗑️ Cleaned up product`);
                    } catch (cleanupError) {
                        console.warn(`   ⚠️ Cleanup warning: ${cleanupError.message}`);
                    }
                    
                } else {
                    console.log(`   ❌ Image upload: FAILED - ${uploadResult.error}`);
                    results.push({
                        ...combo,
                        status: 'UPLOAD_FAILED',
                        error: uploadResult.error
                    });
                }
                
            } catch (error) {
                console.log(`   ❌ FAILED: ${error.message}`);
                results.push({
                    ...combo,
                    status: 'FAILED',
                    error: error.message,
                    errorCode: error.response?.data?.code || 'UNKNOWN'
                });
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Test some potentially problematic combinations
        console.log('\n4️⃣ Testing potentially problematic combinations...');
        
        const problematicCombinations = [
            { blueprintId: 68, vendorId: 3, name: 'Mug + Marco Fine Arts (known issue)' },
            { blueprintId: 77, vendorId: 3, name: 'Hoodie + Marco Fine Arts' },
            { blueprintId: 97, vendorId: 3, name: 'Poster + Marco Fine Arts' }
        ];

        for (const combo of problematicCombinations) {
            console.log(`\n🔍 Testing: ${combo.name}`);
            
            try {
                const uploadResult = await printifyService.uploadImage(
                    imageBuffer, 
                    `test-prob-${combo.blueprintId}-${combo.vendorId}.png`, 
                    `Problematic test for ${combo.name}`
                );
                
                if (uploadResult.success) {
                    console.log(`   ✅ Image upload: SUCCESS`);
                    
                    const productResult = await printifyService.createCustomProductWithBlueprint(uploadResult.imageId, {
                        title: `Test ${combo.name}`,
                        description: `Problematic combination test`,
                        blueprintId: combo.blueprintId,
                        printProviderId: combo.vendorId,
                        basePrice: 2000
                    });
                    
                    console.log(`   ✅ Product creation: SUCCESS - ${productResult.productId}`);
                    
                    results.push({
                        ...combo,
                        status: 'SUCCESS',
                        productId: productResult.productId,
                        imageId: uploadResult.imageId
                    });
                    
                    // Clean up
                    try {
                        await printifyService.deleteProduct(productResult.productId);
                        console.log(`   🗑️ Cleaned up product`);
                    } catch (cleanupError) {
                        console.warn(`   ⚠️ Cleanup warning: ${cleanupError.message}`);
                    }
                    
                } else {
                    console.log(`   ❌ Image upload: FAILED - ${uploadResult.error}`);
                    results.push({
                        ...combo,
                        status: 'UPLOAD_FAILED',
                        error: uploadResult.error
                    });
                }
                
            } catch (error) {
                console.log(`   ❌ FAILED: ${error.message}`);
                results.push({
                    ...combo,
                    status: 'FAILED',
                    error: error.message,
                    errorCode: error.response?.data?.code || 'UNKNOWN'
                });
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Analyze results
        console.log('\n📊 RESULTS ANALYSIS');
        console.log('===================');
        
        const successful = results.filter(r => r.status === 'SUCCESS');
        const uploadFailed = results.filter(r => r.status === 'UPLOAD_FAILED');
        const productFailed = results.filter(r => r.status === 'FAILED');
        
        console.log(`✅ Successful: ${successful.length}`);
        console.log(`❌ Upload Failed: ${uploadFailed.length}`);
        console.log(`❌ Product Failed: ${productFailed.length}`);
        
        if (successful.length > 0) {
            console.log('\n✅ WORKING COMBINATIONS:');
            successful.forEach(r => {
                console.log(`   • ${r.name} (Blueprint ${r.blueprintId}, Vendor ${r.vendorId})`);
            });
        }
        
        if (uploadFailed.length > 0) {
            console.log('\n❌ UPLOAD FAILURES:');
            uploadFailed.forEach(r => {
                console.log(`   • ${r.name}: ${r.error}`);
            });
        }
        
        if (productFailed.length > 0) {
            console.log('\n❌ PRODUCT CREATION FAILURES:');
            productFailed.forEach(r => {
                console.log(`   • ${r.name}: ${r.error} (Code: ${r.errorCode})`);
            });
        }

        // Determine if it's a global issue or specific combinations
        if (uploadFailed.length === results.length) {
            console.log('\n🚨 DIAGNOSIS: GLOBAL IMAGE UPLOAD ISSUE');
            console.log('   All combinations failed at upload stage');
            console.log('   This suggests a Printify API service issue');
        } else if (successful.length > 0) {
            console.log('\n✅ DIAGNOSIS: SPECIFIC COMBINATION ISSUES');
            console.log('   Some combinations work, others fail');
            console.log('   This suggests vendor/blueprint compatibility issues');
        }

    } catch (error) {
        console.error('❌ Test setup failed:', error.message);
    } finally {
        // Force cleanup
        setTimeout(() => {
            console.log('\n🔧 Forcing process exit...');
            process.exit(0);
        }, 2000);
    }
}

testVendorBlueprintCombinations();