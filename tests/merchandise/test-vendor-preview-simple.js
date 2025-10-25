#!/usr/bin/env node

/**
 * SIMPLE VENDOR PREVIEW TEST
 * 
 * Tests the VendorPreviewService with a known good image to isolate the issue
 */

require('dotenv').config();

async function testVendorPreviewSimple() {
    console.log('\n🧪 SIMPLE VENDOR PREVIEW TEST');
    console.log('=============================\n');

    try {
        // Get a gallery image
        const axios = require('axios');
        const userId = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';
        
        console.log('1️⃣ Getting gallery images...');
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
        console.log(`   📎 Type: ${firstImage.type}`);
        console.log(`   🔗 URL: ${firstImage.url}`);

        // Test VendorPreviewService
        console.log('\n2️⃣ Testing VendorPreviewService...');
        const VendorPreviewService = require('../../services/vendor-preview-service');
        const vendorService = new VendorPreviewService();
        
        console.log('   🔧 Service initialized');
        
        // Use the image URL directly
        const imageId = firstImage.url;
        const productType = 'premium-tshirt';
        
        console.log(`   🖼️ Using image: ${imageId}`);
        console.log(`   📦 Product type: ${productType}`);
        
        const result = await vendorService.generateVendorPreview(
            imageId,
            productType,
            userId,
            { blueprintId: 5 } // Unisex Cotton Crew Tee
        );
        
        console.log('\n3️⃣ VendorPreviewService result:');
        console.log(`   Success: ${result.success ? '✅' : '❌'}`);
        
        if (result.success) {
            console.log(`   Product ID: ${result.productId}`);
            console.log(`   Preview URL: ${result.previewUrl || 'N/A'}`);
        } else {
            console.log(`   Error: ${result.error}`);
            console.log(`   Details: ${JSON.stringify(result, null, 2)}`);
        }
        
        // If successful, verify the product exists
        if (result.success && result.productId) {
            console.log('\n4️⃣ Verifying product in Printify...');
            const EnhancedPrintifyService = require('../../services/enhanced-printify-service');
            const printifyService = new EnhancedPrintifyService();
            
            try {
                const product = await printifyService.getProduct(result.productId);
                if (product && product.product) {
                    console.log(`   ✅ Product exists: ${product.product.title}`);
                    console.log(`   🖼️ Images: ${product.product.images?.length || 0}`);
                } else {
                    console.log(`   ❌ Product not found in Printify`);
                }
            } catch (error) {
                console.log(`   ❌ Error verifying product: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response?.data) {
            console.error('   API Error:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

if (require.main === module) {
    testVendorPreviewSimple();
}

module.exports = { testVendorPreviewSimple };