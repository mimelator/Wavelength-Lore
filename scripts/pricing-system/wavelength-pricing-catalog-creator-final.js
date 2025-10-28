#!/usr/bin/env node
require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * WAVELENGTH PRICING CATALOG CREATOR - FINAL VERSION
 * =================================================
 * 
 * SOLUTION: Use existing uploaded images instead of creating new ones.
 * This eliminates image upload failures and uses proven working images.
 * 
 * Phase 1 of 4-Phase Pricing System:
 * Creates reference products with [PRICING-REF] titles containing:
 * - All available variants with placeholder pricing
 * - Existing uploaded images for all print areas
 * - Proper print area configurations
 * 
 * Usage:
 * node wavelength-pricing-catalog-creator-final.js [--dry-run]
 * 
 * Output: pricing-reference-products.json for Phase 2
 */

class PricingCatalogCreator {
    constructor() {
        this.apiToken = process.env.PRINTIFY_API_TOKEN;
        this.baseUrl = 'https://api.printify.com/v1';
        this.shopId = process.env.PRINTIFY_SHOP_ID;
        this.dryRun = process.argv.includes('--dry-run');
        this.createdProducts = [];
        this.errors = [];
        this.rateLimitDelay = 5000; // 5 seconds between batches
        this.batchSize = 5; // Process 5 products at a time
        this.existingImageId = null; // Will be loaded from API
        
        // Load product catalog
        this.productCatalog = this.loadProductCatalog();
        
        console.log('🌊 WAVELENGTH PRICING CATALOG CREATOR - FINAL VERSION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🎯 Mode: ${this.dryRun ? 'DRY RUN (no products created)' : 'LIVE EXECUTION'}`);
        console.log(`📊 Products to process: ${this.productCatalog.length}`);
        console.log(`⚡ Batch size: ${this.batchSize}, Delay: ${this.rateLimitDelay}ms`);
        console.log('🔧 SOLUTION: Using existing uploaded images (no upload needed)');
        console.log('');
    }

    loadProductCatalog() {
        try {
            const configPath = path.join(__dirname, '../../config/product-types.js');
            delete require.cache[require.resolve(configPath)];
            const config = require(configPath);
            
            // Convert the ProductTypes object to an array
            const productTypes = config.ProductTypes || config.productTypes;
            if (!productTypes) {
                throw new Error('No ProductTypes or productTypes found in config');
            }
            
            return Object.values(productTypes);
        } catch (error) {
            console.error('❌ Failed to load product catalog:', error.message);
            process.exit(1);
        }
    }

    async makeApiRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = `${this.baseUrl}${endpoint}`;
            const options = {
                method,
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(url, options, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                    } catch (error) {
                        resolve({ status: res.statusCode, data: responseData, headers: res.headers });
                    }
                });
            });

            req.on('error', error => reject(error));
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    async loadExistingImage() {
        if (this.existingImageId) return this.existingImageId;
        
        console.log('🔍 Loading existing uploaded image...');
        
        try {
            const response = await this.makeApiRequest('/uploads.json');
            
            if (response.status === 200 && response.data.data && response.data.data.length > 0) {
                this.existingImageId = response.data.data[0].id;
                console.log(`   ✅ Using existing image: ${this.existingImageId}`);
                return this.existingImageId;
            } else {
                console.log('   ❌ No existing images found');
                return null;
            }
        } catch (error) {
            console.log(`   ❌ Error loading images: ${error.message}`);
            return null;
        }
    }

    async getProductVariants(blueprintId, printProviderId) {
        try {
            const endpoint = `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`;
            const response = await this.makeApiRequest(endpoint);
            
            if (response.status === 200) {
                return response.data.variants || [];
            } else {
                console.log(`      ❌ Failed to get variants: ${response.status}`);
                return null;
            }
        } catch (error) {
            console.log(`      ❌ Error getting variants: ${error.message}`);
            return null;
        }
    }

    async createReferenceProduct(product) {
        const { name, blueprintId, printProviderId } = product;
        
        console.log(`   📦 Creating: ${name} (${blueprintId}-${printProviderId})`);
        
        // Get variants for this blueprint/provider combination
        console.log(`   🔍 Getting variants: /catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`);
        const variants = await this.getProductVariants(blueprintId, printProviderId);
        
        if (!variants || variants.length === 0) {
            const error = `No variants found for ${name}`;
            console.log(`      ❌ ${error}`);
            this.errors.push({ product: name, error });
            return null;
        }
        
        console.log(`      ✅ Got ${variants.length} variants`);
        
        if (this.dryRun) {
            console.log(`      🧪 DRY RUN: Would create product with ${variants.length} variants`);
            return {
                product: name,
                blueprintId,
                printProviderId,
                variants: variants.length,
                status: 'dry-run'
            };
        }

        // Use existing image
        const imageId = this.existingImageId;
        if (!imageId) {
            const error = `No existing image available for ${name}`;
            console.log(`      ❌ ${error}`);
            this.errors.push({ product: name, error });
            return null;
        }

        // Build product creation payload
        const productData = {
            title: `[PRICING-REF] ${name}`,
            description: `Pricing reference product for ${name}. Created by Wavelength Pricing System for cost extraction.`,
            blueprint_id: blueprintId,
            print_provider_id: printProviderId,
            variants: variants.map(variant => ({
                id: variant.id,
                price: 2999, // Placeholder price in cents ($29.99)
                is_enabled: true
            })),
            print_areas: []
        };

        // Build print areas with existing image
        const printAreas = {};
        variants.forEach(variant => {
            if (variant.placeholders) {
                variant.placeholders.forEach(placeholder => {
                    const position = placeholder.position;
                    
                    if (!printAreas[position]) {
                        printAreas[position] = {
                            variant_ids: [],
                            placeholders: [{
                                position: position,
                                images: [{
                                    id: imageId,
                                    x: 0.5,
                                    y: 0.5,
                                    scale: 1,
                                    angle: 0
                                }]
                            }]
                        };
                    }
                    
                    if (!printAreas[position].variant_ids.includes(variant.id)) {
                        printAreas[position].variant_ids.push(variant.id);
                    }
                });
            }
        });

        productData.print_areas = Object.values(printAreas);

        try {
            console.log(`   📦 Creating product...`);
            const response = await this.makeApiRequest('/shops/' + this.shopId + '/products.json', 'POST', productData);
            
            if (response.status === 200 || response.status === 201) {
                console.log(`      ✅ Created successfully: ID ${response.data.id}`);
                return {
                    product: name,
                    blueprintId,
                    printProviderId,
                    productId: response.data.id,
                    variants: variants.length,
                    status: 'created'
                };
            } else {
                const error = `Creation failed: ${response.status} - ${JSON.stringify(response.data)}`;
                console.log(`      ❌ ${error}`);
                this.errors.push({ product: name, error, response: response.data });
                return null;
            }
        } catch (error) {
            const errorMsg = `Creation error: ${error.message}`;
            console.log(`      ❌ ${errorMsg}`);
            this.errors.push({ product: name, error: errorMsg });
            return null;
        }
    }

    async processBatch(products) {
        const results = [];
        
        for (const product of products) {
            const result = await this.createReferenceProduct(product);
            if (result) {
                results.push(result);
                this.createdProducts.push(result);
            }
        }
        
        return results;
    }

    async createPricingCatalog() {
        console.log('🚀 Starting pricing catalog creation...\n');
        
        // Load existing image first
        const imageId = await this.loadExistingImage();
        if (!imageId && !this.dryRun) {
            console.error('❌ No existing images found. Cannot create products without images.');
            process.exit(1);
        }
        
        // Process products in batches
        const batches = [];
        for (let i = 0; i < this.productCatalog.length; i += this.batchSize) {
            batches.push(this.productCatalog.slice(i, i + this.batchSize));
        }
        
        console.log(`📊 Processing ${this.productCatalog.length} products in ${batches.length} batches`);
        console.log('');
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`🔄 Batch ${i + 1}/${batches.length} (${batch.length} products):`);
            
            await this.processBatch(batch);
            
            // Rate limiting delay between batches (except for last batch)
            if (i < batches.length - 1) {
                console.log(`   ⏱️  Waiting ${this.rateLimitDelay/1000}s before next batch...\n`);
                await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
            }
        }
        
        // Save results
        await this.saveResults();
        
        // Print summary
        this.printSummary();
    }

    async saveResults() {
        if (this.dryRun) {
            console.log('\n🧪 DRY RUN: No results saved');
            return;
        }
        
        const outputPath = path.join(__dirname, 'pricing-reference-products.json');
        const results = {
            created: new Date().toISOString(),
            totalProducts: this.productCatalog.length,
            successfulCreations: this.createdProducts.length,
            errors: this.errors.length,
            imageId: this.existingImageId,
            products: this.createdProducts,
            errorDetails: this.errors
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`\n💾 Results saved to: ${outputPath}`);
    }

    printSummary() {
        console.log('\n🎯 PRICING CATALOG CREATION SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 Total products processed: ${this.productCatalog.length}`);
        console.log(`✅ Successfully created: ${this.createdProducts.length}`);
        console.log(`❌ Errors: ${this.errors.length}`);
        
        if (this.errors.length > 0) {
            console.log('\n❌ ERROR BREAKDOWN:');
            const errorCounts = {};
            this.errors.forEach(error => {
                const key = error.error.split(':')[0];
                errorCounts[key] = (errorCounts[key] || 0) + 1;
            });
            
            Object.entries(errorCounts).forEach(([error, count]) => {
                console.log(`   ${error}: ${count} products`);
            });
            
            if (this.errors.length <= 5) {
                console.log('\n📋 SAMPLE ERRORS:');
                this.errors.slice(0, 5).forEach(error => {
                    console.log(`   ${error.product}: ${error.error}`);
                });
            }
        }
        
        if (this.createdProducts.length > 0) {
            console.log(`\n🔄 NEXT STEP: Run Phase 2 pricing extraction:`);
            console.log(`   npm run wavelength:extract-pricing-data`);
        } else if (!this.dryRun) {
            console.log(`\n🚨 No products created successfully. Check errors above.`);
        }
        
        console.log('\n🌊 Wavelength Pricing System - Phase 1 Complete');
    }
}

// Run the creator
if (require.main === module) {
    const creator = new PricingCatalogCreator();
    creator.createPricingCatalog().catch(error => {
        console.error('🚨 Fatal error:', error);
        process.exit(1);
    });
}

module.exports = PricingCatalogCreator;