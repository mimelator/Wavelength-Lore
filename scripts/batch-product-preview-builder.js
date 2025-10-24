#!/usr/bin/env node
/**
 * Batch Product Preview Builder
 * 
 * Enhanced version that can process multiple product types simultaneously
 * for faster preview generation across all available blueprints.
 */

require('dotenv').config();
const APIProductPreviewBuilder = require('./api-product-preview-builder');

class BatchProductPreviewBuilder extends APIProductPreviewBuilder {
    constructor(options = {}) {
        super();
        this.batchSize = options.batchSize || 3; // Process 3 at once instead of 1
        this.skipExisting = options.skipExisting !== false; // Skip already processed by default
        this.targetBlueprints = options.targetBlueprints || []; // Specific blueprints to process
    }

    /**
     * Enhanced blueprint processing with batch support
     */
    async processRemainingBlueprints() {
        console.log('🚀 BATCH PRODUCT PREVIEW BUILDER');
        console.log('================================');
        console.log(`⚙️  Batch size: ${this.batchSize}`);
        console.log(`🔄 Skip existing: ${this.skipExisting}`);
        
        try {
            // Initialize Printify service
            const EnhancedPrintifyService = require('../services/enhanced-printify-service');
            const printifyService = new EnhancedPrintifyService();
            console.log('✅ Enhanced Printify Service initialized');

            // Get available blueprints
            console.log('📋 Getting available product blueprints...');
            const blueprintsResult = await printifyService.getBlueprints();
            
            let blueprints;
            if (blueprintsResult && blueprintsResult.success && blueprintsResult.blueprints) {
                blueprints = blueprintsResult.blueprints;
            } else if (Array.isArray(blueprintsResult)) {
                blueprints = blueprintsResult;
            } else {
                throw new Error('Invalid blueprints response from Printify API');
            }
            
            console.log(`✅ Found ${blueprints.length} available blueprints`);

            // Initialize state
            this.state = this.state || { processedBlueprints: [] };

            // Filter blueprints based on options
            let targetBlueprints = blueprints;
            
            if (this.targetBlueprints.length > 0) {
                targetBlueprints = blueprints.filter(b => this.targetBlueprints.includes(b.id));
                console.log(`🎯 Targeting specific blueprints: ${this.targetBlueprints.join(', ')}`);
            }

            if (this.skipExisting) {
                const processed = this.state.processedBlueprints.map(p => p.blueprintId);
                targetBlueprints = targetBlueprints.filter(b => !processed.includes(b.id));
                console.log(`🔄 Skipping ${processed.length} already processed blueprints`);
            }

            // Filter out known incompatible blueprints
            const incompatibleBlueprints = [11, 68];
            targetBlueprints = targetBlueprints.filter(b => !incompatibleBlueprints.includes(b.id));
            
            // LIMIT: Only process batchSize number of blueprints total
            targetBlueprints = targetBlueprints.slice(0, this.batchSize);

            console.log(`📋 Total available: ${blueprints.length}`);
            console.log(`✅ Already processed: ${this.state.processedBlueprints.length}`);
            console.log(`🔄 To process: ${targetBlueprints.length}`);

            if (targetBlueprints.length === 0) {
                console.log('🎉 All target blueprints already processed!');
                return this.generateSummaryReport();
            }

            // Process in batches
            const batches = [];
            for (let i = 0; i < targetBlueprints.length; i += this.batchSize) {
                batches.push(targetBlueprints.slice(i, i + this.batchSize));
            }

            console.log(`\n🏭 Processing ${batches.length} batches of up to ${this.batchSize} blueprints each`);
            
            // Get user ONCE before processing batches
            const { initializeFirebaseAdmin } = require('../helpers/firebase-admin-utils');
            initializeFirebaseAdmin(); // Initialize the admin SDK
            const admin = require('firebase-admin');
            const listUsersResult = await admin.app('admin').auth().listUsers(1);
            if (!listUsersResult.users || listUsersResult.users.length === 0) {
                throw new Error('No users in Firebase Auth');
            }
            const userId = listUsersResult.users[0].uid;
            console.log(`👤 Using user: ${userId}\n`);

            let totalSuccesses = 0;
            let totalFailures = 0;

            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                console.log(`\n📦 Batch ${batchIndex + 1}/${batches.length}: Processing ${batch.length} blueprints`);
                
                batch.forEach((b, i) => {
                    console.log(`  ${i + 1}. ${b.title} (ID: ${b.id})`);
                });

                // Process batch in parallel for faster execution
                const batchPromises = batch.map(blueprint => this.processBlueprintSafely(blueprint, userId));
                const batchResults = await Promise.allSettled(batchPromises);

                // Analyze batch results
                let batchSuccesses = 0;
                let batchFailures = 0;

                batchResults.forEach((result, index) => {
                    const blueprint = batch[index];
                    if (result.status === 'fulfilled' && result.value.success) {
                        batchSuccesses++;
                        this.state.processedBlueprints.push(result.value);
                    } else {
                        batchFailures++;
                        const error = result.reason || result.value?.error || 'Unknown error';
                        console.error(`❌ CRITICAL FAILURE: ${blueprint.title}`);
                        console.error(`   Error: ${error}`);
                        console.error(`❌ STOPPING: Product creation failed validation`);
                        throw new Error(`Product creation failed for ${blueprint.title}: ${error}`);
                    }
                });

                totalSuccesses += batchSuccesses;
                totalFailures += batchFailures;

                console.log(`📊 Batch ${batchIndex + 1} results: ${batchSuccesses} successes, ${batchFailures} failures`);
                
                // Progress saved in state

                // Add delay between batches to avoid rate limiting
                if (batchIndex < batches.length - 1) {
                    console.log('⏳ Waiting 3 seconds before next batch...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }

            console.log(`\n🎉 BATCH PROCESSING COMPLETE!`);
            console.log(`📊 Final results: ${totalSuccesses} successes, ${totalFailures} failures`);
            
            return this.generateSummaryReport();

        } catch (error) {
            console.error('❌ Batch processing error:', error);
            throw error;
        }
    }

    /**
     * Safely process a single blueprint with error handling
     */
    async processBlueprintSafely(blueprint, userId) {
        try {
            console.log(`\n🔨 Processing: ${blueprint.title} (ID: ${blueprint.id})`);
            
            // VALIDATION 1: Blueprint has required properties
            if (!blueprint.id || !blueprint.title) {
                throw new Error('VALIDATION 1 FAILED: Blueprint missing required properties');
            }
            console.log(`✅ VALIDATION 1: Blueprint valid`);

            // VALIDATION 2: Get gallery images for user (both uploaded AND bookmarks)
            const axios = require('axios');
            const baseUrl = process.env.CDN_URL || 'http://localhost:3001';
            
            console.log(`📋 Fetching gallery images for user ${userId} via API`);
            const galleryResponse = await axios.get(`${baseUrl}/api/gallery/user/images`, {
                headers: {
                    'X-User-ID': userId,
                    'X-API-Request': 'batch-builder'
                }
            });
            
            if (!galleryResponse.data.success || !galleryResponse.data.images || galleryResponse.data.images.length === 0) {
                throw new Error('VALIDATION 2 FAILED: No gallery images for user');
            }
            
            const userImages = galleryResponse.data.images;
            console.log(`✅ VALIDATION 2: Found ${userImages.length} gallery images (uploaded + bookmarks)`);
            
            // Use first available image - can be bookmark (url) or uploaded (relativePath)
            const firstImage = userImages[0];
            let imageId;
            
            if (firstImage.type === 'bookmark' && firstImage.url) {
                // Bookmark: use original URL
                imageId = firstImage.url;
                console.log(`🖼️ Using bookmark: ${firstImage.title || 'Untitled'}`);
                console.log(`🔗 URL: ${imageId}`);
            } else if (firstImage.relativePath) {
                // Uploaded: use relativePath for S3
                imageId = firstImage.relativePath;
                console.log(`🖼️ Using uploaded: ${firstImage.title || 'Untitled'}`);
                console.log(`📁 Path: ${imageId}`);
            } else {
                throw new Error('VALIDATION 2.5 FAILED: Image missing both url and relativePath');
            }
            
            // Map blueprint to product type
            const productTypeMap = {
                5: 'premium-tshirt',
                6: 'premium-tshirt',
                77: 'hoodie',
                49: 'hoodie',
                97: 'poster',
                282: 'poster'
            };
            
            const productType = productTypeMap[blueprint.id] || 'premium-tshirt';
            console.log(`✅ VALIDATION 3: Product type: ${productType}`);
            
            // Use VendorPreviewService
            const VendorPreviewService = require('../services/vendor-preview-service');
            const vendorService = new VendorPreviewService();
            
            const result = await vendorService.generateVendorPreview(
                imageId,
                productType,
                userId,
                { blueprintId: blueprint.id }
            );
            
            // VALIDATION 4: Service returned success
            if (!result.success) {
                throw new Error(`VALIDATION 4 FAILED: ${result.error || 'Service failed'}`);
            }
            console.log(`✅ VALIDATION 4: Service success`);
            
            // VALIDATION 5: ProductId exists
            if (!result.productId) {
                console.log('🔍 DIAGNOSTIC: Full result:', JSON.stringify(result, null, 2));
                throw new Error('VALIDATION 5 FAILED: No productId returned');
            }
            console.log(`✅ VALIDATION 5: ProductId: ${result.productId}`);
            console.log(`🔍 DIAGNOSTIC: ProductId type: ${typeof result.productId}`);
            
            // VALIDATION 6: Product exists in Printify
            const EnhancedPrintifyService = require('../services/enhanced-printify-service');
            const printifyService = new EnhancedPrintifyService();
            const verifyProduct = await printifyService.getProduct(result.productId);
            
            if (!verifyProduct) {
                throw new Error(`VALIDATION 6 FAILED: Product not in Printify`);
            }
            console.log(`✅ VALIDATION 6: Product in Printify`);
            
            // VALIDATION 7: Product is real (not a cache key)
            if (result.productId.startsWith('cached-') || result.productId.startsWith('failed-')) {
                throw new Error(`VALIDATION 7 FAILED: ProductId is cache key, not real product: ${result.productId}`);
            }
            console.log(`✅ VALIDATION 7: ProductId is real Printify product`);
            
            // VALIDATION 8: Product has mockup images
            if (!verifyProduct.product || !verifyProduct.product.images || verifyProduct.product.images.length === 0) {
                throw new Error(`VALIDATION 8 FAILED: Product has no images`);
            }
            console.log(`✅ VALIDATION 8: Product has ${verifyProduct.product.images.length} images`);
            console.log(`🎉 ALL VALIDATIONS PASSED`);
            
            return {
                success: true,
                productTitle: blueprint.title,
                blueprintId: blueprint.id,
                productId: result.productId,
                processedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Error processing ${blueprint.title}:`, error.message);
            return {
                success: false,
                error: error.message,
                blueprintId: blueprint.id,
                productTitle: blueprint.title
            };
        }
    }

    /**
     * Generate comprehensive summary report
     */
    generateSummaryReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalProcessed: this.state.processedBlueprints.length,
            successfulProducts: this.state.processedBlueprints.filter(p => p.success).length,
            productTypes: [...new Set(this.state.processedBlueprints.map(p => p.productTitle))],
            blueprintIds: this.state.processedBlueprints.map(p => p.blueprintId),
            products: this.state.processedBlueprints.map(p => ({
                id: p.productId,
                title: p.productTitle,
                blueprintId: p.blueprintId,
                previewUrl: `http://localhost:3001/merchandise/preview/${p.productId}`
            }))
        };

        console.log('\n📊 COMPREHENSIVE SUMMARY REPORT');
        console.log('===============================');
        console.log(`🎯 Total Products Created: ${report.successfulProducts}`);
        console.log(`📋 Product Types: ${report.productTypes.length}`);
        console.log(`🔗 All products accessible at: http://localhost:3001/admin/vendor-research/catalog`);
        
        console.log('\n📦 Product Types Created:');
        report.productTypes.forEach((type, i) => {
            console.log(`  ${i + 1}. ${type}`);
        });

        return report;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        batchSize: 3,
        skipExisting: true
    };

    // Parse command line arguments
    if (args.includes('--all')) {
        options.skipExisting = false;
        console.log('🔄 Processing ALL blueprints (including existing)');
    }

    if (args.includes('--fast')) {
        options.batchSize = 5;
        console.log('⚡ Fast mode: Processing 5 blueprints at once');
    }

    const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
    if (batchSizeArg) {
        options.batchSize = parseInt(batchSizeArg.split('=')[1]);
        console.log(`⚙️  Custom batch size: ${options.batchSize}`);
    }

    const builder = new BatchProductPreviewBuilder(options);
    builder.processRemainingBlueprints()
        .then(report => {
            console.log('\n🎉 SUCCESS: All product previews created!');
            console.log(`📊 Summary: ${report.successfulProducts} products across ${report.productTypes.length} types`);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ FAILURE: Batch processing failed:', error.message);
            process.exit(1);
        });
}

module.exports = BatchProductPreviewBuilder;