#!/usr/bin/env node
require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * WAVELENGTH PRICING DATA EXTRACTOR - PHASE 2
 * ==========================================
 * 
 * Extracts pricing data from the reference products created in Phase 1.
 * Reads pricing-reference-products.json and fetches current pricing for all created products.
 * 
 * Usage:
 * node wavelength-pricing-data-extractor.js
 * 
 * Output: pricing-catalog-final.json for Phase 3 (frontend integration)
 */

class PricingDataExtractor {
    constructor() {
        this.apiToken = process.env.PRINTIFY_API_TOKEN;
        this.baseUrl = 'https://api.printify.com/v1';
        this.shopId = process.env.PRINTIFY_SHOP_ID;
        this.extractedPricing = {};
        this.errors = [];
        this.rateLimitDelay = 2000; // 2 seconds between requests
        
        console.log('🌊 WAVELENGTH PRICING DATA EXTRACTOR - PHASE 2');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💰 Extracting real pricing data from reference products');
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

    loadReferenceProducts() {
        console.log('📋 Loading reference products from Phase 1...');
        
        try {
            const filePath = path.join(__dirname, 'pricing-reference-products.json');
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            console.log(`   ✅ Loaded ${data.products.length} reference products`);
            console.log(`   📊 Success rate: ${data.successfulCreations}/${data.totalProducts} (${Math.round(data.successfulCreations/data.totalProducts*100)}%)`);
            console.log(`   📅 Created: ${new Date(data.created).toLocaleString()}`);
            
            return data.products;
        } catch (error) {
            console.error('❌ Failed to load reference products:', error.message);
            console.log('   💡 Make sure you ran Phase 1 first:');
            console.log('      node wavelength-pricing-catalog-creator-final.js');
            process.exit(1);
        }
    }

    async extractProductPricing(product) {
        const { product: productName, productId, blueprintId, printProviderId } = product;
        
        console.log(`   💰 Extracting: ${productName} (ID: ${productId})`);
        
        try {
            const response = await this.makeApiRequest(`/shops/${this.shopId}/products/${productId}.json`);
            
            if (response.status === 200) {
                const productData = response.data;
                const variants = productData.variants || [];
                
                console.log(`      ✅ Got ${variants.length} variants with pricing`);
                
                // Extract pricing data
                const pricingData = {
                    productName,
                    blueprintId,
                    printProviderId,
                    productId,
                    extractedAt: new Date().toISOString(),
                    variants: variants.map(variant => ({
                        id: variant.id,
                        title: variant.title,
                        price: variant.price,
                        priceFormatted: `$${(variant.price / 100).toFixed(2)}`,
                        isEnabled: variant.is_enabled,
                        options: variant.options || {}
                    }))
                };
                
                // Store in our catalog
                const catalogKey = `${blueprintId}-${printProviderId}`;
                this.extractedPricing[catalogKey] = pricingData;
                
                // Show sample pricing
                if (variants.length > 0) {
                    const sampleVariant = variants[0];
                    console.log(`      💵 Sample: ${sampleVariant.title || 'Default'} - $${(sampleVariant.price / 100).toFixed(2)}`);
                }
                
                return pricingData;
                
            } else {
                const error = `Failed to fetch product: ${response.status}`;
                console.log(`      ❌ ${error}`);
                this.errors.push({ product: productName, productId, error });
                return null;
            }
        } catch (error) {
            const errorMsg = `Fetch error: ${error.message}`;
            console.log(`      ❌ ${errorMsg}`);
            this.errors.push({ product: productName, productId, error: errorMsg });
            return null;
        }
    }

    async extractAllPricing() {
        console.log('🚀 Starting pricing data extraction...\n');
        
        const referenceProducts = this.loadReferenceProducts();
        
        console.log(`📊 Extracting pricing from ${referenceProducts.length} products`);
        console.log(`⚡ Rate limit: ${this.rateLimitDelay/1000}s between requests\n`);
        
        let processed = 0;
        for (const product of referenceProducts) {
            processed++;
            console.log(`🔄 Progress: ${processed}/${referenceProducts.length}`);
            
            await this.extractProductPricing(product);
            
            // Rate limiting delay
            if (processed < referenceProducts.length) {
                await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
            }
        }
        
        // Save results
        await this.saveResults(referenceProducts.length);
        
        // Print summary
        this.printSummary();
    }

    async saveResults(totalProducts) {
        const outputPath = path.join(__dirname, 'pricing-catalog-final.json');
        const results = {
            extractedAt: new Date().toISOString(),
            totalReferenceProducts: totalProducts,
            successfulExtractions: Object.keys(this.extractedPricing).length,
            errors: this.errors.length,
            pricingCatalog: this.extractedPricing,
            errorDetails: this.errors,
            summary: {
                productsProcessed: totalProducts,
                pricingDataExtracted: Object.keys(this.extractedPricing).length,
                totalVariants: Object.values(this.extractedPricing).reduce((sum, product) => sum + product.variants.length, 0),
                averagePrice: this.calculateAveragePrice()
            }
        };
        
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        console.log(`\n💾 Pricing catalog saved to: ${outputPath}`);
        
        // Also save a simplified version for easy integration
        const simplifiedPath = path.join(__dirname, 'pricing-catalog-simple.json');
        const simplified = {};
        Object.entries(this.extractedPricing).forEach(([key, data]) => {
            simplified[key] = {
                productName: data.productName,
                variants: data.variants.map(v => ({
                    title: v.title,
                    price: v.priceFormatted,
                    options: v.options
                }))
            };
        });
        
        fs.writeFileSync(simplifiedPath, JSON.stringify(simplified, null, 2));
        console.log(`💾 Simplified catalog saved to: ${simplifiedPath}`);
    }

    calculateAveragePrice() {
        const allVariants = Object.values(this.extractedPricing).flatMap(product => product.variants);
        if (allVariants.length === 0) return 0;
        
        const totalPrice = allVariants.reduce((sum, variant) => sum + variant.price, 0);
        return `$${(totalPrice / allVariants.length / 100).toFixed(2)}`;
    }

    printSummary() {
        console.log('\n🎯 PRICING DATA EXTRACTION SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const successfulProducts = Object.keys(this.extractedPricing).length;
        const totalVariants = Object.values(this.extractedPricing).reduce((sum, product) => sum + product.variants.length, 0);
        
        console.log(`📊 Products with pricing extracted: ${successfulProducts}`);
        console.log(`📊 Total variants with pricing: ${totalVariants}`);
        console.log(`💰 Average price: ${this.calculateAveragePrice()}`);
        console.log(`❌ Extraction errors: ${this.errors.length}`);
        
        if (this.errors.length > 0) {
            console.log('\n❌ EXTRACTION ERRORS:');
            this.errors.slice(0, 5).forEach(error => {
                console.log(`   ${error.product} (${error.productId}): ${error.error}`);
            });
            if (this.errors.length > 5) {
                console.log(`   ... and ${this.errors.length - 5} more errors`);
            }
        }
        
        if (successfulProducts > 0) {
            console.log('\n📋 SAMPLE PRICING DATA:');
            const sampleProducts = Object.values(this.extractedPricing).slice(0, 3);
            sampleProducts.forEach(product => {
                console.log(`   ${product.productName}:`);
                product.variants.slice(0, 2).forEach(variant => {
                    console.log(`     - ${variant.title}: ${variant.priceFormatted}`);
                });
                if (product.variants.length > 2) {
                    console.log(`     ... and ${product.variants.length - 2} more variants`);
                }
            });
        }
        
        console.log('\n🔄 NEXT STEP: Integrate pricing data into frontend');
        console.log('   Use pricing-catalog-simple.json for easy integration');
        console.log('\n🌊 Wavelength Pricing System - Phase 2 Complete');
    }
}

// Run the extractor
if (require.main === module) {
    const extractor = new PricingDataExtractor();
    extractor.extractAllPricing().catch(error => {
        console.error('🚨 Fatal error:', error);
        process.exit(1);
    });
}

module.exports = PricingDataExtractor;