#!/usr/bin/env node
/**
 * Generate Diverse Product Types
 * Creates products using actual working blueprint/vendor combinations
 */

require('dotenv').config();

class DiverseProductGenerator {
    constructor() {
        this.runId = `diverse-products-${Date.now()}`;
        this.generatedProducts = [];
    }

    async run() {
        console.log('🎨 GENERATING DIVERSE PRODUCT TYPES');
        console.log('===================================');
        
        try {
            // Get user
            const { initializeFirebaseAdmin } = require('../helpers/firebase-admin-utils');
            initializeFirebaseAdmin();
            const admin = require('firebase-admin');
            const listUsersResult = await admin.app('admin').auth().listUsers(1);
            const userId = listUsersResult.users[0].uid;
            
            // Get gallery images
            const axios = require('axios');
            const galleryResponse = await axios.get(`http://localhost:3001/api/gallery/user/images`, {
                headers: { 'X-User-ID': userId }
            });
            const images = galleryResponse.data.images || [];
            
            if (images.length === 0) {
                throw new Error('No images available');
            }
            
            // Use different images for variety
            const imageOptions = images.slice(0, 3);
            console.log(`📸 Using ${imageOptions.length} different images for variety`);
            
            // Working combinations based on actual system capabilities
            const productConfigs = [
                { type: 'premium-tshirt', vendor: 1, name: 'Premium T-Shirt (Vendor 1)' },
                { type: 'premium-tshirt', vendor: 3, name: 'Premium T-Shirt (Vendor 3)' },
                { type: 'premium-tshirt', vendor: 4, name: 'Premium T-Shirt (Vendor 4)' },
                { type: 'premium-tshirt', vendor: 7, name: 'Premium T-Shirt (Vendor 7)' },
                { type: 'hoodie', vendor: 1, name: 'Hoodie (Vendor 1)' },
                { type: 'hoodie', vendor: 3, name: 'Hoodie (Vendor 3)' },
                { type: 'poster', vendor: 1, name: 'Poster (Vendor 1)' },
                { type: 'poster', vendor: 3, name: 'Poster (Vendor 3)' },
                { type: 'mug', vendor: 1, name: 'Coffee Mug (Vendor 1)' }
            ];
            
            console.log(`🎯 Creating ${productConfigs.length} diverse products`);
            
            const VendorPreviewService = require('../services/vendor-preview-service');
            const vendorService = new VendorPreviewService();
            
            for (let i = 0; i < productConfigs.length; i++) {
                const config = productConfigs[i];
                const image = imageOptions[i % imageOptions.length]; // Cycle through images
                
                console.log(`\n🔨 Creating ${config.name}...`);
                
                try {
                    const imageId = image.type === 'bookmark' ? image.url : image.relativePath;
                    
                    const result = await vendorService.generateVendorPreviewForVendor(
                        imageId,
                        config.type,
                        config.vendor,
                        userId,
                        { 
                            title: config.name,
                            runId: this.runId,
                            previewMode: true
                        }
                    );
                    
                    if (result.success && result.productId) {
                        console.log(`   ✅ Created: ${result.productId}`);
                        this.generatedProducts.push({
                            name: config.name,
                            type: config.type,
                            vendor: config.vendor,
                            productId: result.productId,
                            imageUsed: image.title || image.fileName || 'Unknown'
                        });
                    } else {
                        console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
                    }
                    
                    // Delay to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                } catch (error) {
                    console.log(`   ❌ Error: ${error.message}`);
                }
            }
            
            console.log(`\n🎉 DIVERSE GENERATION COMPLETE`);
            console.log(`📊 Created ${this.generatedProducts.length}/${productConfigs.length} products`);
            
            // Group by type for summary
            const byType = {};
            this.generatedProducts.forEach(product => {
                if (!byType[product.type]) byType[product.type] = [];
                byType[product.type].push(product);
            });
            
            console.log('\n📋 Products by Type:');
            Object.keys(byType).forEach(type => {
                console.log(`  ${type}: ${byType[type].length} products`);
                byType[type].forEach(p => {
                    console.log(`    - ${p.name} (${p.productId})`);
                });
            });
            
            console.log(`\n🔗 View catalog: http://localhost:3001/admin/vendor-catalog`);
            
        } catch (error) {
            console.error('❌ Generation failed:', error.message);
            throw error;
        }
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new DiverseProductGenerator();
    generator.run()
        .then(() => {
            console.log('✅ Diverse product generation completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Failed:', error.message);
            process.exit(1);
        });
}

module.exports = DiverseProductGenerator;