#!/usr/bin/env node

/**
 * DIRECT PRODUCT CREATION TEST
 * 
 * Bypasses VendorPreviewService and tests direct Printify product creation
 */

require('dotenv').config();

async function testDirectProductCreation() {
    console.log('🧪 DIRECT PRODUCT CREATION TEST');
    console.log('===============================\n');

    try {
        // Test 1: Initialize EnhancedPrintifyService directly
        console.log('1️⃣ Initializing EnhancedPrintifyService...');
        const EnhancedPrintifyService = require('../../services/enhanced-printify-service');
        const printifyService = new EnhancedPrintifyService();
        console.log('   ✅ Service initialized');

        // Test 2: Get a simple image from gallery
        console.log('\n2️⃣ Getting gallery image...');
        const axios = require('axios');
        const userId = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';
        
        const galleryResponse = await axios.get('http://localhost:3001/api/gallery/user/images', {
            headers: {
                'X-User-ID': userId,
                'X-API-Request': 'test'
            }
        });
        
        if (!galleryResponse.data.success || !galleryResponse.data.images.length) {
            throw new Error('No gallery images available');
        }
        
        const firstImage = galleryResponse.data.images[0];
        console.log(`   ✅ Found image: ${firstImage.title}`);
        console.log(`   🔗 URL: ${firstImage.url}`);

        // Test 3: Download the image directly
        console.log('\n3️⃣ Downloading image...');
        const imageResponse = await axios.get(firstImage.url, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        
        const imageBuffer = Buffer.from(imageResponse.data);
        console.log(`   ✅ Downloaded: ${Math.round(imageBuffer.length / 1024)}KB`);

        // Test 4: Upload image to Printify
        console.log('\n4️⃣ Uploading to Printify...');
        const uploadResult = await printifyService.uploadImage(
            imageBuffer, 
            'test-direct.png', 
            'Direct test image'
        );
        
        if (!uploadResult.success) {
            throw new Error(`Upload failed: ${uploadResult.error}`);
        }
        
        console.log(`   ✅ Uploaded: ${uploadResult.imageId}`);

        // Test 5: Create simple product
        console.log('\n5️⃣ Creating product...');
        const productResult = await printifyService.createCustomProductWithBlueprint(uploadResult.imageId, {
            title: 'Direct Test Product',
            description: 'Test product created directly',
            blueprintId: 5, // Unisex Cotton Crew Tee
            printProviderId: 3, // Known working provider
            basePrice: 2000
        });
        
        console.log(`   ✅ Product created: ${productResult.productId}`);
        console.log(`   🖼️ Images: ${productResult.images?.length || 0}`);

        // Test 6: Verify product exists
        console.log('\n6️⃣ Verifying product...');
        const verifyProduct = await printifyService.getProduct(productResult.productId);
        
        if (verifyProduct && verifyProduct.product) {
            console.log(`   ✅ Product verified: ${verifyProduct.product.title}`);
            console.log(`   📊 Variants: ${verifyProduct.product.variants?.length || 0}`);
        } else {
            throw new Error('Product verification failed');
        }

        console.log('\n🎉 SUCCESS: Direct product creation works!');
        console.log(`📦 Product ID: ${productResult.productId}`);

        // Cleanup
        console.log('\n🗑️ Cleaning up test product...');
        try {
            await printifyService.deleteProduct(productResult.productId);
            console.log('   ✅ Test product deleted');
        } catch (cleanupError) {
            console.warn('   ⚠️ Cleanup warning:', cleanupError.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response?.data) {
            console.error('   API Error:', JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        // Force cleanup
        setTimeout(() => {
            console.log('🔧 Forcing process exit...');
            process.exit(0);
        }, 2000);
    }
}

testDirectProductCreation();