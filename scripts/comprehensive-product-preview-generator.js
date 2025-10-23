#!/usr/bin/env node
/**
 * Comprehensive Product Preview Generator
 * 
 * Creates multiple product previews using blueprint discovery data
 * and enhanced images from the Global Cache system
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;

// Import validation and services
const InputValidator = require('../utils/input-validator');
const ValidationHelpers = require('../utils/validation-helpers');
const ImageUpscalingService = require('../services/image-upscaling-service');
const EnhancedPrintifyService = require('../services/enhanced-printify-service');

const BASE_URL = 'http://localhost:3001';
const TEST_USER_ID = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';

class ComprehensiveProductPreviewGenerator {
    constructor() {
        this.runId = `preview-gen-${Date.now()}`;
        this.blueprintData = null;
        this.enhancedImages = [];
        this.generatedPreviews = [];
        this.operations = [];
        
        console.log('\n🏭 COMPREHENSIVE PRODUCT PREVIEW GENERATOR');
        console.log('============================================================');
        console.log(`Started: ${new Date().toISOString()}`);
        console.log(`Run ID: ${this.runId}`);
    }

    logOperation(operation, details, success = true) {
        const entry = {
            timestamp: new Date().toISOString(),
            runId: this.runId,
            operation,
            details,
            success
        };
        this.operations.push(entry);
        
        const status = success ? '✅' : '❌';
        console.log(`${status} OPERATION: ${operation}`);
    }

    logError(operation, error) {
        this.logOperation(operation, { error: error.message }, false);
        console.error(`❌ ERROR in ${operation}:`, error.message);
    }

    /**
     * Load and validate blueprint discovery data
     */
    async loadBlueprintData() {
        console.log('\n📋 LOADING BLUEPRINT DISCOVERY DATA');
        console.log('==================================================');

        try {
            const blueprintPath = path.join(__dirname, '..', 'config', 'printify-blueprints-discovered.json');
            const rawData = await fs.readFile(blueprintPath, 'utf8');
            this.blueprintData = JSON.parse(rawData);

            console.log(`📊 Loaded blueprint data:`)
            console.log(`   Total blueprints: ${this.blueprintData.totalBlueprints}`);
            console.log(`   Working configurations: ${this.blueprintData.workingConfigurations.length}`);
            console.log(`   Categories: ${Object.keys(this.blueprintData.categories).join(', ')}`);
            console.log(`   Discovery date: ${this.blueprintData.discoveredAt}`);

            // Validate blueprint structure
            if (!this.blueprintData.workingConfigurations || this.blueprintData.workingConfigurations.length === 0) {
                throw new Error('No working configurations found in blueprint data');
            }

            this.logOperation('blueprint_data_loaded', {
                totalBlueprints: this.blueprintData.totalBlueprints,
                workingConfigurations: this.blueprintData.workingConfigurations.length,
                categories: Object.keys(this.blueprintData.categories)
            });

            return this.blueprintData;

        } catch (error) {
            this.logError('blueprint_data_load', error);
            throw error;
        }
    }

    /**
     * Get enhanced images from gallery
     */
    async getEnhancedImagesFromGallery() {
        console.log('\n🎨 FETCHING ENHANCED IMAGES FROM GALLERY');
        console.log('==================================================');

        try {
            const response = await axios.get(`${BASE_URL}/api/gallery/user/images`, {
                headers: {
                    'User-Agent': 'ComprehensiveProductPreviewGenerator/1.0'
                },
                timeout: 10000
            });

            if (!response.data.success || !response.data.images) {
                throw new Error('Gallery API returned invalid response');
            }

            // Filter and validate images
            const validImages = InputValidator.filterValidImages(response.data.images, 'getEnhancedImagesFromGallery');
            console.log(`🔍 VALIDATION: ${validImages.length}/${response.data.images.length} images passed validation`);

            // Prioritize images for product previews
            const prioritizedImages = this.prioritizeImagesForPreviews(validImages);
            
            this.enhancedImages = prioritizedImages;
            
            console.log(`📊 Enhanced images available: ${this.enhancedImages.length}`);
            this.enhancedImages.forEach((img, index) => {
                const safeName = InputValidator.getStringProperty(img, 'title', 
                    InputValidator.getStringProperty(img, 'fileName', 'unknown'));
                console.log(`  ${index + 1}. ${safeName} - ${img.url}`);
            });

            this.logOperation('enhanced_images_fetched', {
                totalImages: response.data.images.length,
                validImages: validImages.length,
                prioritizedImages: this.enhancedImages.length
            });

            return this.enhancedImages;

        } catch (error) {
            this.logError('enhanced_images_fetch', error);
            throw error;
        }
    }

    /**
     * Prioritize images for product previews
     */
    prioritizeImagesForPreviews(images) {
        return images
            .map(img => ({
                ...img,
                priority: this.calculateImagePriority(img)
            }))
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 5); // Top 5 images for previews
    }

    /**
     * Calculate priority score for image suitability for product previews
     */
    calculateImagePriority(image) {
        let score = 0;
        
        const name = InputValidator.getStringProperty(image, 'title', 
            InputValidator.getStringProperty(image, 'fileName', '')).toLowerCase();
        
        // Prioritize battle scenes and character art
        if (name.includes('battle') || name.includes('character') || name.includes('hero')) score += 10;
        if (name.includes('scene') || name.includes('art') || name.includes('design')) score += 5;
        
        // Size considerations (larger images generally better for products)
        if (image.size > 100000) score += 3; // > 100KB
        if (image.size > 500000) score += 2; // > 500KB
        
        // Recent images get slight preference
        if (image.lastModified) {
            const daysSinceModified = (Date.now() - new Date(image.lastModified).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceModified < 7) score += 1; // Recent images
        }
        
        return score;
    }

    /**
     * Generate previews for multiple product types
     */
    async generateMultipleProductPreviews() {
        console.log('\n🏭 GENERATING MULTIPLE PRODUCT PREVIEWS');
        console.log('==================================================');

        if (this.enhancedImages.length === 0) {
            throw new Error('No enhanced images available for preview generation');
        }

        if (!this.blueprintData || this.blueprintData.workingConfigurations.length === 0) {
            throw new Error('No blueprint configurations available');
        }

        try {
            const enhancedPrintifyService = new EnhancedPrintifyService();
            
            // Select diverse product types for previews
            const selectedBlueprints = this.selectDiverseBlueprints();
            console.log(`🎯 Selected ${selectedBlueprints.length} diverse product types for previews`);
            
            selectedBlueprints.forEach((blueprint, index) => {
                console.log(`  ${index + 1}. ${blueprint.title} (ID: ${blueprint.id}) - ${blueprint.category}`);
            });

            // Generate previews for each image x product combination
            for (const image of this.enhancedImages.slice(0, 2)) { // Top 2 images
                console.log(`\n🖼️  Generating previews for: ${InputValidator.getStringProperty(image, 'title', 'unknown')}`);
                
                for (const blueprint of selectedBlueprints) {
                    try {
                        console.log(`   🔨 Creating ${blueprint.title} preview...`);
                        
                        const preview = await this.createSingleProductPreview(image, blueprint, enhancedPrintifyService);
                        if (preview && preview.success) {
                            this.generatedPreviews.push(preview);
                            console.log(`   ✅ Preview created successfully - ID: ${preview.id}`);
                        } else {
                            console.log(`   ⚠️  Preview creation failed for ${blueprint.title}`);
                        }
                        
                        // Add delay to avoid API rate limits
                        await this.delay(1000);
                        
                    } catch (error) {
                        console.log(`   ❌ Error creating ${blueprint.title} preview: ${error.message}`);
                        this.logError(`preview_creation_${blueprint.id}`, error);
                    }
                }
            }

            console.log(`\n🎉 PREVIEW GENERATION COMPLETE`);
            console.log(`   Total previews generated: ${this.generatedPreviews.length}`);
            
            this.logOperation('multiple_previews_generated', {
                totalPreviews: this.generatedPreviews.length,
                imagesUsed: Math.min(this.enhancedImages.length, 2),
                blueprintsUsed: selectedBlueprints.length
            });

            return this.generatedPreviews;

        } catch (error) {
            this.logError('multiple_preview_generation', error);
            throw error;
        }
    }

    /**
     * Select diverse blueprint types for comprehensive previews
     */
    selectDiverseBlueprints() {
        const workingConfigs = this.blueprintData.workingConfigurations.filter(config => 
            config.providers && config.providers.length > 0
        );

        // Group by category for diversity
        const byCategory = {};
        workingConfigs.forEach(config => {
            if (!byCategory[config.category]) {
                byCategory[config.category] = [];
            }
            byCategory[config.category].push(config);
        });

        const selected = [];
        
        // Select at least one from each category
        Object.keys(byCategory).forEach(category => {
            const categoryConfigs = byCategory[category];
            // Pick the one with most variants for better options
            const best = categoryConfigs.reduce((prev, current) => {
                const prevVariants = prev.providers.reduce((sum, p) => sum + (p.variantCount || 0), 0);
                const currentVariants = current.providers.reduce((sum, p) => sum + (p.variantCount || 0), 0);
                return currentVariants > prevVariants ? current : prev;
            });
            selected.push(best);
        });

        // Add popular specific items if we have room
        const popularItems = workingConfigs
            .filter(config => 
                config.title.toLowerCase().includes('cotton') || 
                config.title.toLowerCase().includes('heavy') ||
                config.title.toLowerCase().includes('unisex')
            )
            .slice(0, 2);

        popularItems.forEach(item => {
            if (!selected.find(s => s.id === item.id)) {
                selected.push(item);
            }
        });

        return selected.slice(0, 6); // Max 6 different product types
    }

    /**
     * Create a single product preview
     */
    async createSingleProductPreview(image, blueprint, enhancedPrintifyService) {
        try {
            // Download image to buffer
            const imageResponse = await axios.get(image.url, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'ProductPreviewGenerator-ImageDownload'
                }
            });

            const imageBuffer = Buffer.from(imageResponse.data);
            const safeName = InputValidator.getStringProperty(image, 'title', 'preview-image');

            // Use enhanced service to create product with the specific blueprint
            const result = await enhancedPrintifyService.createProductWithBlueprint(
                imageBuffer,
                safeName,
                blueprint.id,
                {
                    title: `${safeName} - ${blueprint.title}`,
                    description: `Custom ${blueprint.title} featuring ${safeName}`,
                    tags: ['wavelength-lore', 'custom', blueprint.category, 'preview'],
                    blueprintId: blueprint.id,
                    providerId: blueprint.providers[0]?.id,
                    runId: this.runId
                }
            );

            return {
                ...result,
                blueprintTitle: blueprint.title,
                blueprintCategory: blueprint.category,
                imageTitle: safeName,
                imageUrl: image.url,
                generatedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Error creating preview for ${blueprint.title}:`, error.message);
            return null;
        }
    }

    /**
     * Delay utility for rate limiting
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate summary report
     */
    generateSummaryReport() {
        console.log('\n📊 COMPREHENSIVE PREVIEW GENERATION SUMMARY');
        console.log('============================================================');
        
        const report = {
            runId: this.runId,
            timestamp: new Date().toISOString(),
            blueprintsAnalyzed: this.blueprintData?.totalBlueprints || 0,
            workingConfigurations: this.blueprintData?.workingConfigurations?.length || 0,
            imagesProcessed: this.enhancedImages.length,
            previewsGenerated: this.generatedPreviews.length,
            successRate: this.generatedPreviews.length > 0 ? 
                ((this.generatedPreviews.filter(p => p.success).length / this.generatedPreviews.length) * 100).toFixed(1) : 0,
            categoriesUsed: [...new Set(this.generatedPreviews.map(p => p.blueprintCategory))],
            operations: this.operations,
            previews: this.generatedPreviews.map(p => ({
                id: p.id,
                title: p.title || p.blueprintTitle,
                category: p.blueprintCategory,
                image: p.imageTitle,
                success: p.success,
                previewUrl: p.preview_url || 'N/A'
            }))
        };

        console.log(`🎯 Generation Results:`);
        console.log(`   Blueprints analyzed: ${report.blueprintsAnalyzed}`);
        console.log(`   Working configurations: ${report.workingConfigurations}`);
        console.log(`   Images processed: ${report.imagesProcessed}`);
        console.log(`   Previews generated: ${report.previewsGenerated}`);
        console.log(`   Success rate: ${report.successRate}%`);
        console.log(`   Categories used: ${report.categoriesUsed.join(', ')}`);

        if (this.generatedPreviews.length > 0) {
            console.log(`\n🏆 Generated Previews:`);
            this.generatedPreviews.forEach((preview, index) => {
                const status = preview.success ? '✅' : '❌';
                console.log(`   ${index + 1}. ${status} ${preview.blueprintTitle} - ${preview.imageTitle}`);
                if (preview.preview_url) {
                    console.log(`      Preview: ${preview.preview_url}`);
                }
            });
        }

        return report;
    }

    /**
     * Main execution flow
     */
    async run() {
        try {
            // Step 1: Load blueprint data
            await this.loadBlueprintData();

            // Step 2: Get enhanced images from gallery
            await this.getEnhancedImagesFromGallery();

            // Step 3: Generate multiple product previews
            await this.generateMultipleProductPreviews();

            // Step 4: Generate summary report
            const report = this.generateSummaryReport();

            console.log('\n🎉 COMPREHENSIVE PRODUCT PREVIEW GENERATION COMPLETED');
            console.log('============================================================');

            return {
                success: true,
                runId: this.runId,
                report,
                previewsGenerated: this.generatedPreviews.length
            };

        } catch (error) {
            this.logError('workflow_execution', error);
            console.log('\n💥 COMPREHENSIVE PREVIEW GENERATION FAILED');
            console.log('============================================================');
            console.error('❌ Error:', error.message);

            return {
                success: false,
                runId: this.runId,
                error: error.message,
                operations: this.operations
            };
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const generator = new ComprehensiveProductPreviewGenerator();
    generator.run()
        .then(result => {
            if (result.success) {
                console.log(`🎊 SUCCESS: Generated ${result.previewsGenerated} product previews`);
                process.exit(0);
            } else {
                console.error('❌ FAILED:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 CRITICAL ERROR:', error.message);
            process.exit(1);
        });
}

module.exports = ComprehensiveProductPreviewGenerator;