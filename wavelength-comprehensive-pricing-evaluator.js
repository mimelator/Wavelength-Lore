#!/usr/bin/env node

/**
 * WAVELENGTH COMPREHENSIVE PRICING EVALUATOR
 * Tests ALL 142 products in our catalog for real Printify pricing availability
 * Uses the same approach as your working Printify example
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🌊 WAVELENGTH COMPREHENSIVE PRICING EVALUATOR');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 Testing ALL 142 products for real Printify pricing availability');
console.log('');

// Printify API Configuration (from your example)
const PRINTIFY_API_URL = "https://api.printify.com/v1";
const API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const USD_CONVERSION_FACTOR = 100;

// Load our 142-product catalog
const configPath = path.join(__dirname, 'config', 'product-types.js');

if (!fs.existsSync(configPath)) {
  console.error('❌ Config file not found:', configPath);
  process.exit(1);
}

// Load ProductTypes
let ProductTypesModule;
try {
  delete require.cache[require.resolve('./config/product-types.js')];
  ProductTypesModule = require('./config/product-types.js');
} catch (error) {
  console.error('❌ Failed to load config file:', error.message);
  process.exit(1);
}

// Extract the ProductTypes object from the module
const ProductTypes = ProductTypesModule.ProductTypes;

if (!ProductTypes) {
  console.error('❌ ProductTypes not found in config module');
  process.exit(1);
}

// Extract just the product catalog (filter out helper functions)
const allProducts = Object.entries(ProductTypes)
  .filter(([key, value]) => key.startsWith('validated-') && typeof value === 'object')
  .map(([key, product]) => ({ key, ...product }));

console.log(`📦 Loaded ${allProducts.length} products from catalog`);

// Check for test mode
const testMode = process.argv.includes('--test') || process.argv.includes('--sample');
const sampleSize = process.argv.includes('--sample=10') ? 10 : 5;

if (testMode) {
    console.log(`🧪 TEST MODE: Using ${sampleSize} sample products instead of full catalog`);
    allProducts.splice(sampleSize); // Keep only first N products
}

console.log('');

/**
 * Make Printify API call using native Node.js (like your example)
 */
async function printifyFetch(endpoint) {
    const url = new URL(`${PRINTIFY_API_URL}${endpoint}`);
    
    if (!API_TOKEN) {
        throw new Error("Printify API token not found in environment variables.");
    }
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`, 
                'User-Agent': 'Wavelength-Pricing-Evaluator/1.0 (Node.js)',
                'Accept': 'application/json'
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        const jsonData = JSON.parse(data);
                        resolve(jsonData);
                    } else {
                        reject(new Error(`API Error: ${res.statusCode} ${res.statusMessage}`));
                    }
                } catch (parseError) {
                    reject(new Error(`JSON Parse Error: ${parseError.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(new Error(`Request Error: ${error.message}`));
        });

        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

/**
 * Test a single product for Printify pricing with retry logic
 */
async function testProductPricing(product, maxRetries = 3) {
    const { key, name, blueprintId, printProviderId, provider, category } = product;
    
    console.log(`🔍 Testing: ${name}`);
    console.log(`   ID: ${key}`);
    console.log(`   Blueprint: ${blueprintId}, Provider: ${printProviderId} (${provider})`);
    console.log(`   Category: ${category}`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Use the exact endpoint pattern from your example
            const endpoint = `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`;
            console.log(`   🌐 API Call (attempt ${attempt}/${maxRetries}): ${endpoint}`);
            
            const startTime = Date.now();
            const data = await printifyFetch(endpoint);
            const responseTime = Date.now() - startTime;
        
        if (data.variants && data.variants.length > 0) {
            console.log(`   🔍 Analyzing ${data.variants.length} variants for pricing...`);
            
            // Enhanced pricing extraction - check multiple possible price fields
            const priceAnalysis = data.variants.map((variant, index) => {
                const analysis = {
                    variantId: variant.id,
                    sku: variant.sku,
                    price: variant.price,
                    cost: variant.cost,
                    retail_price: variant.retail_price,
                    wholesale_price: variant.wholesale_price
                };
                
                // Try different price extraction methods
                let extractedPrice = 0;
                
                if (variant.price && variant.price > 0) {
                    extractedPrice = variant.price / USD_CONVERSION_FACTOR;
                } else if (variant.cost && variant.cost > 0) {
                    extractedPrice = variant.cost / USD_CONVERSION_FACTOR;
                } else if (variant.retail_price && variant.retail_price > 0) {
                    extractedPrice = variant.retail_price / USD_CONVERSION_FACTOR;
                } else if (variant.wholesale_price && variant.wholesale_price > 0) {
                    extractedPrice = variant.wholesale_price / USD_CONVERSION_FACTOR;
                }
                
                analysis.extractedPrice = extractedPrice;
                
                // Log first few variants for debugging
                if (index < 3) {
                    console.log(`      Variant ${index + 1}: price=${variant.price}, cost=${variant.cost}, extracted=$${extractedPrice.toFixed(2)}`);
                }
                
                return analysis;
            });
            
            const validPrices = priceAnalysis
                .map(analysis => analysis.extractedPrice)
                .filter(price => price > 0);
            
            if (validPrices.length > 0) {
                const minPrice = Math.min(...validPrices);
                const maxPrice = Math.max(...validPrices);
                const avgPrice = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length;
                
                console.log(`   ✅ SUCCESS: ${validPrices.length}/${data.variants.length} variants with pricing, $${minPrice.toFixed(2)}-$${maxPrice.toFixed(2)} (avg: $${avgPrice.toFixed(2)}) - ${responseTime}ms`);
                
                return {
                    success: true,
                    productKey: key,
                    name,
                    blueprintId,
                    printProviderId,
                    provider,
                    category,
                    variantCount: data.variants.length,
                    validPriceCount: validPrices.length,
                    minPrice,
                    maxPrice,
                    avgPrice,
                    responseTime,
                    priceAnalysis: priceAnalysis.slice(0, 3) // Keep first 3 for analysis
                };
            } else {
                // Log sample variant structure for debugging
                console.log(`   🔍 Sample variant structure:`, JSON.stringify(data.variants[0], null, 2).substring(0, 500) + '...');
            }
        }
        
            console.log(`   ❌ NO PRICING: API returned ${data.variants?.length || 0} variants with no valid prices - ${responseTime}ms`);
            return {
                success: false,
                productKey: key,
                name,
                blueprintId,
                printProviderId,
                provider,
                category,
                error: 'No valid pricing data',
                responseTime,
                variantCount: data.variants?.length || 0
            };
            
        } catch (error) {
            const isRateLimit = error.message.includes('429') || error.message.includes('Too Many Requests');
            const isTimeout = error.message.includes('timeout');
            
            if (isRateLimit && attempt < maxRetries) {
                const backoffDelay = Math.pow(2, attempt) * 2000; // Exponential backoff: 4s, 8s, 16s
                console.log(`   ⚠️ Rate limited (attempt ${attempt}/${maxRetries}), waiting ${backoffDelay/1000}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
                continue;
            } else if (isTimeout && attempt < maxRetries) {
                console.log(`   ⚠️ Timeout (attempt ${attempt}/${maxRetries}), retrying...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            } else {
                console.log(`   ❌ API ERROR (final attempt): ${error.message}`);
                return {
                    success: false,
                    productKey: key,
                    name,
                    blueprintId,
                    printProviderId,
                    provider,
                    category,
                    error: error.message,
                    responseTime: 0,
                    attempts: attempt
                };
            }
        }
    }
    
    // Should not reach here, but just in case
    return {
        success: false,
        productKey: key,
        name,
        blueprintId,
        printProviderId,
        provider,
        category,
        error: 'Max retries exceeded',
        responseTime: 0,
        attempts: maxRetries
    };
}

/**
 * Run comprehensive evaluation of all 142 products
 */
async function evaluateAllProducts() {
    console.log('🧪 COMPREHENSIVE PRICING EVALUATION:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎯 Testing ${allProducts.length} products with real Printify API calls...`);
    console.log('');
    
    const results = {
        total: allProducts.length,
        successful: 0,
        failed: 0,
        apiErrors: 0,
        noPricing: 0,
        totalVariants: 0,
        totalResponseTime: 0,
        priceRange: { min: Infinity, max: 0 },
        byCategory: new Map(),
        byProvider: new Map(),
        failedProducts: [],
        successfulProducts: []
    };
    
    // Process products in batches to avoid overwhelming the API
    const BATCH_SIZE = 3; // Reduced from 5 to avoid rate limits
    const DELAY_BETWEEN_BATCHES = 5000; // Increased to 5 seconds
    const DELAY_BETWEEN_REQUESTS = 1000; // 1 second delay between individual requests
    
    for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
        const batch = allProducts.slice(i, i + BATCH_SIZE);
        console.log(`\n📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(allProducts.length/BATCH_SIZE)} (products ${i+1}-${Math.min(i+BATCH_SIZE, allProducts.length)}):`);
        console.log('━'.repeat(60));
        
        // Process batch sequentially to avoid rate limits
        const batchResults = [];
        for (const product of batch) {
            const result = await testProductPricing(product);
            batchResults.push(result);
            
            // Add delay between requests within batch
            if (batch.indexOf(product) < batch.length - 1) {
                console.log(`   ⏱️ Waiting ${DELAY_BETWEEN_REQUESTS/1000}s before next product...`);
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
            }
        }
        
        // Process results
        batchResults.forEach(result => {
            results.totalResponseTime += result.responseTime;
            
            if (result.success) {
                results.successful++;
                results.totalVariants += result.variantCount;
                results.successfulProducts.push(result);
                
                // Track price range
                if (result.minPrice < results.priceRange.min) results.priceRange.min = result.minPrice;
                if (result.maxPrice > results.priceRange.max) results.priceRange.max = result.maxPrice;
                
                // Track by category
                if (!results.byCategory.has(result.category)) {
                    results.byCategory.set(result.category, { total: 0, successful: 0, failed: 0 });
                }
                results.byCategory.get(result.category).total++;
                results.byCategory.get(result.category).successful++;
                
                // Track by provider
                if (!results.byProvider.has(result.provider)) {
                    results.byProvider.set(result.provider, { total: 0, successful: 0, failed: 0 });
                }
                results.byProvider.get(result.provider).total++;
                results.byProvider.get(result.provider).successful++;
                
            } else {
                results.failed++;
                results.failedProducts.push(result);
                
                if (result.error.includes('API Error') || result.error.includes('Request Error')) {
                    results.apiErrors++;
                } else {
                    results.noPricing++;
                }
                
                // Track failed by category
                if (!results.byCategory.has(result.category)) {
                    results.byCategory.set(result.category, { total: 0, successful: 0, failed: 0 });
                }
                results.byCategory.get(result.category).total++;
                results.byCategory.get(result.category).failed++;
                
                // Track failed by provider
                if (!results.byProvider.has(result.provider)) {
                    results.byProvider.set(result.provider, { total: 0, successful: 0, failed: 0 });
                }
                results.byProvider.get(result.provider).total++;
                results.byProvider.get(result.provider).failed++;
            }
        });
        
        // Delay between batches (except for the last batch)
        if (i + BATCH_SIZE < allProducts.length) {
            console.log(`\n⏱️ Waiting ${DELAY_BETWEEN_BATCHES/1000} seconds before next batch...`);
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
    }
    
    // Generate comprehensive report
    console.log('\n\n📊 COMPREHENSIVE EVALUATION RESULTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📦 Total Products Tested: ${results.total}`);
    console.log(`✅ Successful Pricing: ${results.successful} (${(results.successful/results.total*100).toFixed(1)}%)`);
    console.log(`❌ Failed Pricing: ${results.failed} (${(results.failed/results.total*100).toFixed(1)}%)`);
    console.log(`   • API Errors: ${results.apiErrors}`);
    console.log(`   • No Pricing Data: ${results.noPricing}`);
    console.log(`📈 Total Variants Found: ${results.totalVariants}`);
    console.log(`⏱️ Average Response Time: ${Math.round(results.totalResponseTime / results.total)}ms`);
    
    if (results.successful > 0) {
        console.log(`💰 Price Range: $${results.priceRange.min.toFixed(2)} - $${results.priceRange.max.toFixed(2)}`);
    }
    
    console.log('\n🏷️ RESULTS BY CATEGORY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Array.from(results.byCategory.entries())
        .sort(([,a], [,b]) => b.total - a.total)
        .forEach(([category, stats]) => {
            const successRate = (stats.successful / stats.total * 100).toFixed(1);
            console.log(`   ${category}: ${stats.successful}/${stats.total} (${successRate}%)`);
        });
    
    console.log('\n🏭 RESULTS BY PROVIDER:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    Array.from(results.byProvider.entries())
        .sort(([,a], [,b]) => b.total - a.total)
        .forEach(([provider, stats]) => {
            const successRate = (stats.successful / stats.total * 100).toFixed(1);
            console.log(`   ${provider}: ${stats.successful}/${stats.total} (${successRate}%)`);
        });
    
    if (results.failedProducts.length > 0) {
        console.log('\n🚨 FAILED PRODUCTS (showing first 10):');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        results.failedProducts.slice(0, 10).forEach(product => {
            console.log(`   ❌ ${product.name} (${product.productKey})`);
            console.log(`      Blueprint: ${product.blueprintId}, Provider: ${product.provider}`);
            console.log(`      Error: ${product.error}`);
        });
        if (results.failedProducts.length > 10) {
            console.log(`   ... and ${results.failedProducts.length - 10} more failed products`);
        }
    }
    
    console.log('\n💡 IMPACT ANALYSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const successRate = results.successful / results.total * 100;
    
    if (successRate >= 90) {
        console.log('🎉 EXCELLENT: 90%+ success rate - dynamic pricing system is viable!');
        console.log('✅ Recommendation: Deploy with error throwing for failed products');
    } else if (successRate >= 75) {
        console.log('✅ GOOD: 75%+ success rate - dynamic pricing mostly working');
        console.log('⚠️ Recommendation: Deploy with fallbacks for problematic categories/providers');
    } else if (successRate >= 50) {
        console.log('⚠️ CONCERNING: 50-75% success rate - significant API issues');
        console.log('🔧 Recommendation: Fix API integration before deploying');
    } else {
        console.log('🚨 CRITICAL: <50% success rate - major API problems');
        console.log('🛑 Recommendation: Do not deploy dynamic pricing until fixed');
    }
    
    console.log('\n🔧 DEBUGGING INSIGHTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (results.failedProducts.length > 0) {
        const noPricingProducts = results.failedProducts.filter(p => p.error === 'No valid pricing data');
        const apiErrorProducts = results.failedProducts.filter(p => p.error.includes('API Error'));
        
        console.log(`🔍 Products with variants but no pricing: ${noPricingProducts.length}`);
        console.log(`🚫 Products with API errors: ${apiErrorProducts.length}`);
        
        if (noPricingProducts.length > 0) {
            console.log('\n📊 VARIANT ANALYSIS SAMPLE (first 3 products with variants but no pricing):');
            noPricingProducts.slice(0, 3).forEach(product => {
                console.log(`   • ${product.name}: ${product.variantCount} variants found, 0 with valid pricing`);
            });
        }
    }
    
    console.log('\n🌊 WAVELENGTH COMPREHENSIVE EVALUATION COMPLETE!');
    console.log(`📊 Final Score: ${results.successful}/${results.total} products have working pricing (${successRate.toFixed(1)}%)`);
    
    // Save detailed results to file
    const reportPath = path.join(__dirname, 'pricing-evaluation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            total: results.total,
            successful: results.successful,
            failed: results.failed,
            successRate: successRate,
            avgResponseTime: Math.round(results.totalResponseTime / results.total),
            totalVariants: results.totalVariants
        },
        detailed: results
    }, null, 2));
    
    console.log(`📄 Detailed report saved to: ${reportPath}`);
    
    if (testMode) {
        console.log('\n💡 This was a test run. To run full evaluation: node wavelength-comprehensive-pricing-evaluator.js');
    }
    
    return results;
}

// Run the comprehensive evaluation
if (require.main === module) {
    console.log('🚀 Starting comprehensive pricing evaluation...');
    
    if (!API_TOKEN) {
        console.error('❌ PRINTIFY_API_TOKEN not found in environment variables');
        console.error('   Please add your Printify API token to .env file');
        process.exit(1);
    }
    
    evaluateAllProducts().catch(error => {
        console.error('❌ Evaluation failed:', error);
        process.exit(1);
    });
}