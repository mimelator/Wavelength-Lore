#!/usr/bin/env node

/**
 * WAVELENGTH PRINTIFY PRICING ENDPOINT RESEARCH
 * Based on discovery that current endpoints only return product specs, not pricing
 */

const https = require('https');
require('dotenv').config();

const PRINTIFY_API_URL = "https://api.printify.com/v1";
const API_TOKEN = process.env.PRINTIFY_API_TOKEN;

console.log('🌊 WAVELENGTH PRINTIFY PRICING ENDPOINT RESEARCH');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 Searching for ACTUAL pricing endpoints (not product specs)');
console.log('');

// Test different possible pricing endpoint patterns
const PRICING_ENDPOINT_PATTERNS = [
    // 1. Shop-based pricing (common pattern)
    { pattern: '/shops.json', name: 'Get Shops List' },
    { pattern: '/shops/{shop_id}/products.json', name: 'Shop Products (may have pricing)' },
    
    // 2. Pricing calculation endpoints
    { pattern: '/orders/shipping-estimates.json', name: 'Shipping Estimates' },
    { pattern: '/catalog/blueprints/{blueprint_id}/price-estimates.json', name: 'Price Estimates' },
    
    // 3. Cost calculation endpoints  
    { pattern: '/catalog/cost-calculator.json', name: 'Cost Calculator' },
    { pattern: '/pricing/estimate.json', name: 'Pricing Estimate' },
    
    // 4. Product pricing endpoints
    { pattern: '/catalog/blueprints/{blueprint_id}/pricing.json', name: 'Blueprint Pricing' },
    { pattern: '/catalog/blueprints/{blueprint_id}/print_providers/{provider_id}/pricing.json', name: 'Provider Pricing' },
    
    // 5. Order/quote endpoints
    { pattern: '/orders/quote.json', name: 'Order Quote' },
    { pattern: '/catalog/quote.json', name: 'Catalog Quote' }
];

async function printifyFetch(endpoint, method = 'GET', body = null) {
    const url = new URL(`${PRINTIFY_API_URL}${endpoint}`);
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'User-Agent': 'Wavelength-Pricing-Research/1.0',
                'Accept': 'application/json'
            },
        };
        
        if (body && method === 'POST') {
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
        }

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: res.statusCode < 300 ? JSON.parse(data) : data,
                        rawData: data
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data,
                        parseError: error.message
                    });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('timeout'));
        });
        
        if (body && method === 'POST') {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function discoverPricingEndpoints() {
    if (!API_TOKEN) {
        console.error('❌ PRINTIFY_API_TOKEN not found');
        process.exit(1);
    }
    
    // First, get shop info (needed for many pricing calls)
    console.log('🏪 STEP 1: Discovering available shops...');
    try {
        const shopsResult = await printifyFetch('/shops.json');
        
        if (shopsResult.statusCode === 200 && shopsResult.data) {
            console.log(`   ✅ Found shops: ${JSON.stringify(shopsResult.data, null, 2)}`);
            
            // If we have shops, we can test shop-based pricing
            if (Array.isArray(shopsResult.data) && shopsResult.data.length > 0) {
                const firstShop = shopsResult.data[0];
                console.log(`   🎯 Using shop ID: ${firstShop.id} (${firstShop.title})`);
                
                // Test shop products endpoint
                console.log('');
                console.log('🛍️  STEP 2: Testing shop products endpoint for pricing...');
                try {
                    const productsResult = await printifyFetch(`/shops/${firstShop.id}/products.json`);
                    console.log(`   📊 Shop products status: ${productsResult.statusCode}`);
                    
                    if (productsResult.statusCode === 200) {
                        console.log(`   📦 Products data: ${JSON.stringify(productsResult.data, null, 2)}`);
                        
                        // Check if products have pricing
                        if (productsResult.data && productsResult.data.data) {
                            const products = productsResult.data.data;
                            if (products.length > 0) {
                                const sampleProduct = products[0];
                                const hasPricing = sampleProduct.price !== undefined || 
                                                 sampleProduct.cost !== undefined ||
                                                 sampleProduct.variants?.some(v => v.price !== undefined);
                                console.log(`   💰 Sample product has pricing: ${hasPricing ? '✅ YES' : '❌ NO'}`);
                                
                                if (hasPricing) {
                                    console.log(`   🎉 PRICING FOUND IN SHOP PRODUCTS!`);
                                    return; // We found it!
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.log(`   ❌ Shop products error: ${error.message}`);
                }
            }
        } else {
            console.log(`   ❌ Shops request failed: ${shopsResult.statusCode}`);
            console.log(`   📄 Response: ${shopsResult.rawData?.substring(0, 200)}`);
        }
    } catch (error) {
        console.log(`   ❌ Shops discovery error: ${error.message}`);
    }
    
    console.log('');
    console.log('🔍 STEP 3: Testing other potential pricing endpoints...');
    
    // Test known blueprint/provider for pricing endpoints
    const testBlueprintId = 413;
    const testProviderId = 10;
    
    for (const pattern of PRICING_ENDPOINT_PATTERNS) {
        // Skip patterns we already tested
        if (pattern.pattern.includes('/shops')) continue;
        
        // Replace placeholders
        let endpoint = pattern.pattern
            .replace('{blueprint_id}', testBlueprintId)
            .replace('{provider_id}', testProviderId)
            .replace('{shop_id}', '12345'); // placeholder
        
        console.log(`🧪 Testing: ${pattern.name}`);
        console.log(`   📍 ${endpoint}`);
        
        try {
            const result = await printifyFetch(endpoint);
            console.log(`   📊 Status: ${result.statusCode}`);
            
            if (result.statusCode === 200) {
                console.log(`   ✅ SUCCESS! Data: ${JSON.stringify(result.data, null, 2)}`);
                
                // Check for pricing fields
                const hasPrice = JSON.stringify(result.data).includes('price') || 
                                JSON.stringify(result.data).includes('cost');
                console.log(`   💰 Contains pricing data: ${hasPrice ? '✅ YES' : '❌ NO'}`);
                
                if (hasPrice) {
                    console.log(`   🎉 POTENTIAL PRICING ENDPOINT FOUND!`);
                }
            } else if (result.statusCode === 404) {
                console.log(`   ❌ Not found (404) - endpoint doesn't exist`);
            } else {
                console.log(`   ❌ Error ${result.statusCode}: ${result.rawData?.substring(0, 100)}`);
            }
        } catch (error) {
            console.log(`   ❌ Request error: ${error.message}`);
        }
        
        console.log('');
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('🎯 PRICING ENDPOINT RESEARCH COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Next steps if no pricing found:');
    console.log('1. Check Printify API documentation for pricing endpoints');
    console.log('2. Verify API token has pricing permissions');
    console.log('3. Consider using order simulation to get pricing');
    console.log('4. Check if pricing requires POST requests with product specs');
}

if (require.main === module) {
    discoverPricingEndpoints().catch(error => {
        console.error('❌ Research failed:', error);
        process.exit(1);
    });
}