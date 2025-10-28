#!/usr/bin/env node
require('dotenv').config();
const https = require('https');

/**
 * WAVELENGTH PRICING FIX VALIDATOR
 * ===============================
 * 
 * Tests the fixed approach with placeholder images on a single product
 * to validate the solution before running the full catalog creation.
 */

class PricingFixValidator {
    constructor() {
        this.apiToken = process.env.PRINTIFY_API_TOKEN;
        this.baseUrl = 'https://api.printify.com/v1';
        this.shopId = process.env.PRINTIFY_SHOP_ID;
        
        console.log('🌊 WAVELENGTH PRICING FIX VALIDATOR');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🧪 Testing placeholder image fix on single product');
        console.log('');
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

    async uploadPlaceholderImage() {
        console.log('📤 Step 1: Uploading placeholder image...');
        
        try {
            // Create a minimal 1x1 pixel PNG as base64
            const minimalPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9aIhzIwAAAABJRU5ErkJggg==';
            
            const uploadData = {
                file_name: 'pricing-ref-test.png',
                contents: minimalPng
            };

            const response = await this.makeApiRequest('/uploads/images.json', 'POST', uploadData);
            
            if (response.status === 200 || response.status === 201) {
                console.log(`   ✅ Image uploaded successfully: ID ${response.data.id}`);
                return response.data.id;
            } else {
                console.log(`   ❌ Upload failed: ${response.status}`, response.data);
                return null;
            }
        } catch (error) {
            console.log(`   ❌ Upload error: ${error.message}`);
            return null;
        }
    }

    async getVariants() {
        console.log('🔍 Step 2: Getting variants for Mug 11oz (68-1)...');
        
        try {
            const response = await this.makeApiRequest('/catalog/blueprints/68/print_providers/1/variants.json');
            
            if (response.status === 200) {
                console.log(`   ✅ Got ${response.data.length} variants`);
                return response.data;
            } else {
                console.log(`   ❌ Failed to get variants: ${response.status}`);
                return null;
            }
        } catch (error) {
            console.log(`   ❌ Error getting variants: ${error.message}`);
            return null;
        }
    }

    async createTestProduct(imageId, variants) {
        console.log('📦 Step 3: Creating test product with placeholder image...');
        
        // Build print areas with the uploaded image
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

        const productData = {
            title: '[TEST-FIX] Mug 11oz - Placeholder Image Test',
            description: 'Testing placeholder image fix for pricing system',
            blueprint_id: 68,
            print_provider_id: 1,
            variants: variants.map(variant => ({
                id: variant.id,
                price: 2999,
                is_enabled: true
            })),
            print_areas: Object.values(printAreas)
        };

        console.log('   📋 Product payload:');
        console.log('   ', JSON.stringify(productData, null, 2).split('\n').slice(0, 20).join('\n   '));
        console.log('   ...');

        try {
            const response = await this.makeApiRequest(`/shops/${this.shopId}/products.json`, 'POST', productData);
            
            if (response.status === 200 || response.status === 201) {
                console.log(`   ✅ SUCCESS! Product created: ID ${response.data.id}`);
                return response.data;
            } else {
                console.log(`   ❌ Failed: ${response.status}`);
                console.log('   📄 Error response:', JSON.stringify(response.data, null, 2));
                return null;
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return null;
        }
    }

    async validateFix() {
        console.log('🚀 Starting fix validation...\n');
        
        // Step 1: Upload placeholder image
        const imageId = await this.uploadPlaceholderImage();
        if (!imageId) {
            console.log('\n❌ Fix validation failed at image upload step');
            return false;
        }
        
        // Step 2: Get variants
        const variants = await this.getVariants();
        if (!variants) {
            console.log('\n❌ Fix validation failed at variants step');
            return false;
        }
        
        // Step 3: Create test product
        const product = await this.createTestProduct(imageId, variants);
        if (!product) {
            console.log('\n❌ Fix validation failed at product creation step');
            return false;
        }
        
        console.log('\n🎯 FIX VALIDATION SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ SUCCESS! The placeholder image fix works!');
        console.log(`📦 Test product created: ${product.id}`);
        console.log(`🎯 Product title: ${product.title}`);
        console.log(`📊 Variants: ${product.variants?.length || 'N/A'}`);
        console.log('');
        console.log('🔄 READY TO RUN: Full catalog creation with fix');
        console.log('   node wavelength-pricing-catalog-creator-fixed.js');
        console.log('');
        console.log('🌊 Wavelength Pricing Fix - VALIDATED!');
        
        return true;
    }
}

// Run the validator
if (require.main === module) {
    const validator = new PricingFixValidator();
    validator.validateFix().catch(error => {
        console.error('🚨 Validation error:', error);
        process.exit(1);
    });
}

module.exports = PricingFixValidator;