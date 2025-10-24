#!/usr/bin/env node
/**
 * Batch Product Preview Builder
 * 
 * Enhanced version that can process multiple product types simultaneously
 * for faster preview generation across all available blueprints.
 */

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

            // Load previous progress
            const progress = await this.loadProgress();
            if (progress) {
                this.state.processedBlueprints = progress.processedBlueprints || [];
            }

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

            let totalSuccesses = 0;
            let totalFailures = 0;

            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                console.log(`\n📦 Batch ${batchIndex + 1}/${batches.length}: Processing ${batch.length} blueprints`);
                
                batch.forEach((b, i) => {
                    console.log(`  ${i + 1}. ${b.title} (ID: ${b.id})`);
                });

                // Process batch in parallel for faster execution
                const batchPromises = batch.map(blueprint => this.processBlueprintSafely(blueprint));
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
                        console.error(`❌ Failed to process ${blueprint.title}:`, 
                            result.reason || result.value?.error || 'Unknown error');
                    }
                });

                totalSuccesses += batchSuccesses;
                totalFailures += batchFailures;

                console.log(`📊 Batch ${batchIndex + 1} results: ${batchSuccesses} successes, ${batchFailures} failures`);
                
                // Save progress after each batch
                await this.saveProgress();

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
    async processBlueprintSafely(blueprint) {
        try {
            console.log(`🔨 Processing: ${blueprint.title}`);
            
            // VALIDATION: Ensure blueprint has required properties
            if (!blueprint.id || !blueprint.title) {
                throw new Error('Blueprint missing required properties (id, title)');
            }

            // Use the existing creation logic from the parent class
            const result = await this.createSinglePreview(blueprint);
            
            if (result.success) {
                console.log(`✅ ${blueprint.title} - Product created: ${result.productId}`);
                return {
                    success: true,
                    productTitle: blueprint.title,
                    blueprintId: blueprint.id,
                    productId: result.productId,
                    sourceImage: result.sourceImage,
                    processedAt: new Date().toISOString(),
                    enhancementUsed: result.enhancementUsed || false
                };
            } else {
                throw new Error(result.error || 'Unknown creation error');
            }

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