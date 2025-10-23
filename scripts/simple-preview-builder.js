#!/usr/bin/env node
/**
 * Simple Preview Product Builder
 * Creates one preview product that can be viewed in the UI
 */

const axios = require('axios');
const EnhancedPrintifyService = require('../services/enhanced-printify-service');

const BASE_URL = 'http://localhost:3001';

class SimplePreviewBuilder {
    constructor() {
        this.runId = `simple-preview-${Date.now()}`;
    }

    async run() {
        try {
            console.log('🎯 CREATING SINGLE PREVIEW PRODUCT');
            console.log('==================================');

            // Get gallery images
            const response = await axios.get(`${BASE_URL}/api/gallery/user/images`, {
                headers: { 'User-Agent': 'Simple-Preview-Builder' },
                timeout: 30000
            });

            if (!response.data.success || !response.data.images.length) {
                throw new Error('No gallery images found');
            }

            const images = response.data.images;
            const randomImage = images[Math.floor(Math.random() * images.length)];
            
            console.log(`🎨 Using image: ${randomImage.title}`);
            console.log(`🖼️ URL: ${randomImage.url}`);

            // Download image
            const imageResponse = await axios.get(randomImage.url, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            const imageBuffer = Buffer.from(imageResponse.data);

            // Create product
            const printifyService = new EnhancedPrintifyService();
            const fileName = randomImage.url.split('/').pop();
            
            const preview = await printifyService.createProductWithBlueprint(
                imageBuffer,
                fileName,
                68, // Mug blueprint
                {
                    title: `Preview: ${randomImage.title}`,
                    description: `Custom mug from gallery`,
                    providerId: 3,
                    runId: this.runId
                }
            );

            if (preview && preview.success) {
                const productId = preview.product?.productId;
                const viewUrl = `${BASE_URL}/merchandise/product/${productId}`;
                
                console.log('✅ SUCCESS!');
                console.log(`📦 Product ID: ${productId}`);
                console.log(`🔗 View at: ${viewUrl}`);
                
                return { success: true, productId, viewUrl };
            } else {
                throw new Error(`Product creation failed: ${preview.error}`);
            }

        } catch (error) {
            console.error('❌ Failed:', error.message);
            return { success: false, error: error.message };
        }
    }
}

if (require.main === module) {
    const builder = new SimplePreviewBuilder();
    builder.run()
        .then(result => {
            console.log('\n🎊 RESULT:', JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Error:', error.message);
            process.exit(1);
        });
}

module.exports = SimplePreviewBuilder;