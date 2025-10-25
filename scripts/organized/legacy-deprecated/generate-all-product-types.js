#!/usr/bin/env node
/**
 * Enhanced Product Types Generator
 * Creates vendor preview products with restart capability, image variety, and overlay system
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class EnhancedProductTypesGenerator {
    constructor(options = {}) {
        this.runId = options.runId || `enhanced-products-${Date.now()}`;
        this.generatedProducts = [];
        this.stateFile = path.join(__dirname, '..', 'temp', `generator-state-${this.runId}.json`);
        this.useVarietyImages = options.useVarietyImages !== false;
        this.useOverlays = options.useOverlays !== false;
        this.skipExisting = options.skipExisting !== false;
    }

    async run() {
        console.log('🏭 ENHANCED PRODUCT TYPES GENERATOR');
        console.log('===================================');
        console.log(`🔄 Skip existing: ${this.skipExisting}`);
        console.log(`🖼️ Image variety: ${this.useVarietyImages}`);
        console.log(`🎨 Use overlays: ${this.useOverlays}`);
        
        try {
            // Load existing state if available
            await this.loadState();
            // Get enhanced Printify service
            const EnhancedPrintifyService = require('../services/enhanced-printify-service');
            const printifyService = new EnhancedPrintifyService();
            
            // Get all available blueprints
            console.log('📋 Fetching available blueprints...');
            const blueprintsResult = await printifyService.getBlueprints();
            const blueprints = blueprintsResult.success ? blueprintsResult.blueprints : blueprintsResult;
            
            // Enhanced blueprint list with categories
            const targetBlueprints = [
                { id: 5, title: 'Unisex Heavy Cotton Tee', category: 'apparel', overlayType: 'center' },
                { id: 6, title: 'Women\'s Favorite Tee', category: 'apparel', overlayType: 'center' },
                { id: 9, title: 'Unisex Cotton Crew Tee', category: 'apparel', overlayType: 'center' },
                { id: 17, title: 'Coffee Mug', category: 'drinkware', overlayType: 'wrap' },
                { id: 7, title: 'Poster', category: 'wall-art', overlayType: 'full' },
                { id: 77, title: 'Unisex Heavy Blend Hoodie', category: 'apparel', overlayType: 'center' },
                { id: 49, title: 'Unisex Pullover Hoodie', category: 'apparel', overlayType: 'center' },
                { id: 282, title: 'Premium Poster', category: 'wall-art', overlayType: 'full' },
                { id: 97, title: 'Canvas Print', category: 'wall-art', overlayType: 'full' },
                { id: 46, title: 'Unisex Tank Top', category: 'apparel', overlayType: 'center' },
                { id: 71, title: 'Premium Pillow', category: 'home', overlayType: 'center' }
            ];
            
            // Filter out already completed blueprints if skipExisting is true
            const remainingBlueprints = this.skipExisting ? 
                targetBlueprints.filter(bp => !this.generatedProducts.find(p => p.blueprintId === bp.id)) :
                targetBlueprints;
            
            console.log(`🎯 Total blueprints: ${targetBlueprints.length}`);
            console.log(`📋 Remaining to process: ${remainingBlueprints.length}`);
            console.log(`✅ Already completed: ${this.generatedProducts.length}`);
            
            if (remainingBlueprints.length === 0) {
                console.log('🎉 All products already generated!');
                return this.generateReport();
            }
            
            // Get user for product creation
            const { initializeFirebaseAdmin } = require('../helpers/firebase-admin-utils');
            initializeFirebaseAdmin();
            const admin = require('firebase-admin');
            const listUsersResult = await admin.app('admin').auth().listUsers(1);
            const userId = listUsersResult.users[0].uid;
            console.log(`👤 Using user: ${userId}`);
            
            // Get diverse gallery images
            console.log('🖼️ Fetching gallery images...');
            const axios = require('axios');
            const galleryResponse = await axios.get(`http://localhost:3001/api/gallery/user/images`, {
                headers: { 'X-User-ID': userId }
            });
            
            const allImages = galleryResponse.data.images || [];
            console.log(`📸 Found ${allImages.length} total images`);
            
            if (allImages.length === 0) {
                throw new Error('No images available for product creation');
            }
            
            // Filter for variety if enabled
            const images = this.useVarietyImages ? 
                this.selectVarietyImages(allImages) : 
                [allImages[0]];
            
            console.log(`🎨 Using ${images.length} images for variety`);
            
            // Process remaining blueprints
            for (let i = 0; i < remainingBlueprints.length; i++) {
                const blueprint = remainingBlueprints[i];
                const progress = Math.round(((i + 1) / remainingBlueprints.length) * 100);
                
                console.log(`\n🔨 [${progress}%] Creating ${blueprint.title}...`);
                
                try {
                    // Select image for this blueprint (variety or rotation)
                    const selectedImage = this.selectImageForBlueprint(images, blueprint, i);
                    const imageId = selectedImage.type === 'bookmark' ? selectedImage.url : selectedImage.relativePath;
                    
                    console.log(`   🖼️ Using: ${selectedImage.title || 'Untitled'} (${selectedImage.type})`);
                    
                    // Apply overlay if enabled
                    let finalImageId = imageId;
                    if (this.useOverlays) {
                        finalImageId = await this.applyOverlay(imageId, blueprint, userId);
                    }
                    
                    // Generate product
                    const VendorPreviewService = require('../services/vendor-preview-service');
                    const vendorService = new VendorPreviewService();
                    
                    const result = await vendorService.generateVendorPreview(
                        finalImageId,
                        this.mapBlueprintToProductType(blueprint.id),
                        userId,
                        { 
                            blueprintId: blueprint.id,
                            title: `${blueprint.title} - Enhanced`,
                            runId: this.runId,
                            category: blueprint.category
                        }
                    );
                    
                    if (result.success && result.productId) {
                        console.log(`   ✅ Created: ${result.productId}`);
                        const productData = {
                            blueprintId: blueprint.id,
                            title: blueprint.title,
                            productId: result.productId,
                            category: blueprint.category,
                            imageUsed: selectedImage.title || 'Untitled',
                            overlayApplied: this.useOverlays,
                            createdAt: new Date().toISOString()
                        };
                        
                        this.generatedProducts.push(productData);
                        await this.saveState(); // Save progress
                    } else {
                        console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
                    }
                    
                    // Delay to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                } catch (error) {
                    console.log(`   ❌ Error: ${error.message}`);
                }
            }
            
            return this.generateReport();
            
        } catch (error) {
            console.error('❌ Generation failed:', error.message);
            await this.saveState(); // Save progress even on failure
            throw error;
        }
    }
    
    // Load previous state if exists
    async loadState() {
        try {
            const stateData = await fs.readFile(this.stateFile, 'utf8');
            const state = JSON.parse(stateData);
            this.generatedProducts = state.generatedProducts || [];
            console.log(`📂 Loaded previous state: ${this.generatedProducts.length} products`);
        } catch (error) {
            console.log('📂 No previous state found, starting fresh');
        }
    }
    
    // Save current state
    async saveState() {
        try {
            const tempDir = path.dirname(this.stateFile);
            await fs.mkdir(tempDir, { recursive: true });
            
            const state = {
                runId: this.runId,
                generatedProducts: this.generatedProducts,
                lastUpdated: new Date().toISOString()
            };
            
            await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save state:', error.message);
        }
    }
    
    // Select variety of images for different products
    selectVarietyImages(allImages) {
        const categories = {
            characters: allImages.filter(img => img.url && img.url.includes('/characters/')),
            locations: allImages.filter(img => img.url && img.url.includes('/locations/')),
            items: allImages.filter(img => img.url && img.url.includes('/items/')),
            other: allImages.filter(img => !img.url || (!img.url.includes('/characters/') && !img.url.includes('/locations/') && !img.url.includes('/items/')))
        };
        
        const selected = [];
        
        // Take 2-3 from each category if available
        Object.values(categories).forEach(category => {
            if (category.length > 0) {
                selected.push(...category.slice(0, Math.min(3, category.length)));
            }
        });
        
        return selected.length > 0 ? selected : allImages.slice(0, 5);
    }
    
    // Select appropriate image for blueprint
    selectImageForBlueprint(images, blueprint, index) {
        if (!this.useVarietyImages) {
            return images[0];
        }
        
        // Rotate through images
        return images[index % images.length];
    }
    
    // Apply overlay based on blueprint type
    async applyOverlay(imageId, blueprint, userId) {
        try {
            console.log(`   🎨 Applying ${blueprint.overlayType} overlay...`);
            
            const BorderSelectionService = require('../services/border-selection-service');
            const borderService = new BorderSelectionService();
            
            const overlayOptions = {
                borderType: this.getOverlayTypeForBlueprint(blueprint),
                productType: blueprint.category,
                title: `${blueprint.title} Enhanced`
            };
            
            const result = await borderService.applyBorderToImage(imageId, overlayOptions, userId);
            
            if (result.success && result.enhancedImageUrl) {
                console.log(`   ✅ Overlay applied successfully`);
                return result.enhancedImageUrl;
            } else {
                console.log(`   ⚠️ Overlay failed, using original image`);
                return imageId;
            }
        } catch (error) {
            console.log(`   ⚠️ Overlay error: ${error.message}, using original`);
            return imageId;
        }
    }
    
    // Map overlay types to border types
    getOverlayTypeForBlueprint(blueprint) {
        const overlayMap = {
            'center': 'solid',
            'wrap': 'rounded',
            'full': 'gradient'
        };
        return overlayMap[blueprint.overlayType] || 'solid';
    }
    
    // Map blueprint ID to product type
    mapBlueprintToProductType(blueprintId) {
        const typeMap = {
            5: 'premium-tshirt',
            6: 'premium-tshirt', 
            9: 'premium-tshirt',
            17: 'mug',
            7: 'poster',
            77: 'hoodie',
            49: 'hoodie',
            282: 'poster',
            97: 'poster',
            46: 'premium-tshirt',
            71: 'pillow'
        };
        return typeMap[blueprintId] || 'premium-tshirt';
    }
    
    // Generate comprehensive report
    generateReport() {
        console.log(`\n🎉 GENERATION COMPLETE`);
        console.log(`📊 Created ${this.generatedProducts.length} products`);
        
        // Group by category
        const byCategory = {};
        this.generatedProducts.forEach(product => {
            const cat = product.category || 'other';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(product);
        });
        
        console.log(`\n📦 Products by Category:`);
        Object.entries(byCategory).forEach(([category, products]) => {
            console.log(`  ${category}: ${products.length} products`);
            products.forEach((product, i) => {
                console.log(`    ${i + 1}. ${product.title} - ${product.productId}`);
            });
        });
        
        console.log(`\n🔗 View catalog: http://localhost:3001/admin/vendor-catalog`);
        
        return {
            total: this.generatedProducts.length,
            byCategory,
            products: this.generatedProducts
        };
    }
}

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        skipExisting: !args.includes('--recreate'),
        useVarietyImages: !args.includes('--single-image'),
        useOverlays: !args.includes('--no-overlays')
    };
    
    // Custom run ID for restart capability
    if (args.includes('--continue')) {
        const runIdArg = args.find(arg => arg.startsWith('--run-id='));
        if (runIdArg) {
            options.runId = runIdArg.split('=')[1];
        }
    }
    
    console.log('🚀 Enhanced Product Generator Options:');
    console.log(`   --recreate: ${args.includes('--recreate')} (recreate existing products)`);
    console.log(`   --single-image: ${args.includes('--single-image')} (use same image for all)`);
    console.log(`   --no-overlays: ${args.includes('--no-overlays')} (skip overlay system)`);
    console.log(`   --continue: ${args.includes('--continue')} (continue previous run)`);
    
    const generator = new EnhancedProductTypesGenerator(options);
    generator.run()
        .then((report) => {
            console.log('✅ Enhanced product generation completed successfully');
            console.log(`📊 Final count: ${report.total} products`);
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Failed:', error.message);
            process.exit(1);
        });
}

module.exports = EnhancedProductTypesGenerator;