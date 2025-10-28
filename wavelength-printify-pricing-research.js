#!/usr/bin/env node

/**
 * WAVELENGTH PRINTIFY PRICING RESEARCH TOOL
 * Discovers the correct API endpoints for actual pricing data
 * Tests different Printify API endpoints to find working pricing
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🌊 WAVELENGTH PRINTIFY PRICING RESEARCH TOOL');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 Discovering correct API endpoints for pricing data');
console.log('');

// Printify API Configuration
const PRINTIFY_API_URL = "https://api.printify.com/v1";
const API_TOKEN = process.env.PRINTIFY_API_TOKEN;

if (!API_TOKEN) {
    console.error('❌ PRINTIFY_API_TOKEN not found in environment variables');
    process.exit(1);
}

// Test sample from our catalog
const testProduct = {
    blueprintId: 68,  // Mug 11oz - from your logs
    providerId: 1     // Printful
};

/**
 * Make Printify API call using native Node.js
 */
async function printifyFetch(endpoint) {
    const url = new URL(`${PRINTIFY_API_URL}${endpoint}`);
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`, 
                'User-Agent': 'Wavelength-Pricing-Research/1.0 (Node.js)',
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
                    const result = {
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: res.statusCode >= 200 && res.statusCode < 300 ? JSON.parse(data) : data
                    };
                    resolve(result);
                } catch (parseError) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data,
                        parseError: parseError.message
                    });
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
 * Test different API endpoints to find pricing data
 */
async function researchPricingEndpoints() {
    console.log('🧪 TESTING DIFFERENT PRINTIFY API ENDPOINTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎯 Using test product: Blueprint ${testProduct.blueprintId}, Provider ${testProduct.providerId}`);
    console.log('');
    
    const endpointsToTest = [
        {
            name: 'Current Endpoint (variants only)',
            endpoint: `/catalog/blueprints/${testProduct.blueprintId}/print_providers/${testProduct.providerId}/variants.json`,
            description: 'What we\'ve been using - returns variants without pricing'
        },
        {
            name: 'Blueprint Base Info',
            endpoint: `/catalog/blueprints/${testProduct.blueprintId}.json`,
            description: 'Base blueprint information'
        },
        {
            name: 'Print Provider Info',
            endpoint: `/catalog/blueprints/${testProduct.blueprintId}/print_providers/${testProduct.providerId}.json`,
            description: 'Provider-specific blueprint info'
        },
        {
            name: 'Shop Products',
            endpoint: '/shops.json',
            description: 'List of shops (may need shop ID for products)'
        },
        {
            name: 'Catalog Base',
            endpoint: '/catalog/blueprints.json',
            description: 'All available blueprints'
        },
        {
            name: 'Print Providers List',
            endpoint: `/catalog/blueprints/${testProduct.blueprintId}/print_providers.json`,
            description: 'All providers for this blueprint'
        }
    ];
    
    const results = [];
    
    for (const test of endpointsToTest) {
        console.log(`🔍 Testing: ${test.name}`);
        console.log(`   📍 Endpoint: ${test.endpoint}`);
        console.log(`   📝 Description: ${test.description}`);
        
        try {
            const result = await printifyFetch(test.endpoint);
            
            if (result.statusCode === 200) {
                const body = result.body;
                const hasPricing = JSON.stringify(body).toLowerCase().includes('price');
                const hasCost = JSON.stringify(body).toLowerCase().includes('cost');
                const hasVariants = body.variants && Array.isArray(body.variants);
                const dataSize = JSON.stringify(body).length;
                
                console.log(`   ✅ SUCCESS (${result.statusCode})`);
                console.log(`   📊 Response size: ${dataSize} characters`);
                console.log(`   💰 Contains 'price': ${hasPricing ? '✅' : '❌'}`);
                console.log(`   💵 Contains 'cost': ${hasCost ? '✅' : '❌'}`);
                console.log(`   🎯 Has variants: ${hasVariants ? `✅ (${body.variants?.length} variants)` : '❌'}`);
                
                if (hasPricing || hasCost) {
                    console.log(`   🎉 POTENTIAL PRICING ENDPOINT FOUND!`);
                    
                    // Show sample pricing data
                    const pricingFields = [];
                    const sampleData = JSON.stringify(body).substring(0, 1000);
                    if (sampleData.toLowerCase().includes('price')) {
                        pricingFields.push('price');
                    }
                    if (sampleData.toLowerCase().includes('cost')) {
                        pricingFields.push('cost');
                    }
                    
                    console.log(`   💎 Pricing fields found: ${pricingFields.join(', ')}`);
                    console.log(`   📋 Sample data: ${sampleData}...`);
                }
                
                results.push({
                    ...test,
                    success: true,
                    statusCode: result.statusCode,
                    hasPricing,
                    hasCost,
                    hasVariants,
                    dataSize,
                    sampleResponse: JSON.stringify(body).substring(0, 500)
                });
                
            } else {
                console.log(`   ❌ FAILED (${result.statusCode})`);
                console.log(`   📄 Error: ${typeof result.body === 'string' ? result.body.substring(0, 200) : JSON.stringify(result.body).substring(0, 200)}`);
                
                results.push({
                    ...test,
                    success: false,
                    statusCode: result.statusCode,
                    error: result.body
                });
            }
            
        } catch (error) {
            console.log(`   ❌ REQUEST FAILED: ${error.message}`);
            results.push({
                ...test,
                success: false,
                error: error.message
            });
        }
        
        console.log('');
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('📊 RESEARCH SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const successfulEndpoints = results.filter(r => r.success);
    const pricingEndpoints = results.filter(r => r.success && (r.hasPricing || r.hasCost));
    
    console.log(`✅ Successful API calls: ${successfulEndpoints.length}/${results.length}`);
    console.log(`💰 Endpoints with pricing data: ${pricingEndpoints.length}`);
    
    if (pricingEndpoints.length > 0) {
        console.log('\n🎯 RECOMMENDED PRICING ENDPOINTS:');
        pricingEndpoints.forEach((endpoint, index) => {
            console.log(`${index + 1}. ${endpoint.name}`);
            console.log(`   📍 ${endpoint.endpoint}`);
            console.log(`   💰 Price: ${endpoint.hasPricing ? '✅' : '❌'}, Cost: ${endpoint.hasCost ? '✅' : '❌'}`);
            console.log(`   🎯 Variants: ${endpoint.hasVariants ? '✅' : '❌'}`);
        });
    } else {
        console.log('\n⚠️ NO PRICING ENDPOINTS FOUND IN TESTED APIS');
        console.log('💡 This suggests we may need:');
        console.log('   • Different API endpoints (product creation/management APIs)');
        console.log('   • Shop-specific product APIs (requires shop ID)');
        console.log('   • Different authentication scope');
        console.log('   • Alternative pricing calculation method');
    }
    
    // Advanced research - look for shop-based endpoints
    console.log('\n🔬 ADVANCED RESEARCH: Shop-Based Endpoints');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        const shopsResult = await printifyFetch('/shops.json');
        if (shopsResult.statusCode === 200 && shopsResult.body.length > 0) {
            const firstShop = shopsResult.body[0];
            console.log(`🏪 Found shop: ${firstShop.title} (ID: ${firstShop.id})`);
            
            // Test shop-specific product endpoints
            const shopEndpoints = [
                `/shops/${firstShop.id}/products.json`,
                `/shops/${firstShop.id}/products/${testProduct.blueprintId}.json`
            ];
            
            for (const endpoint of shopEndpoints) {
                console.log(`🔍 Testing shop endpoint: ${endpoint}`);
                try {
                    const result = await printifyFetch(endpoint);
                    console.log(`   ${result.statusCode === 200 ? '✅' : '❌'} Status: ${result.statusCode}`);
                    
                    if (result.statusCode === 200) {
                        const hasPricing = JSON.stringify(result.body).toLowerCase().includes('price');
                        console.log(`   💰 Contains pricing: ${hasPricing ? '✅' : '❌'}`);
                        
                        if (hasPricing) {
                            console.log('   🎉 SHOP-BASED PRICING FOUND!');
                        }
                    }
                } catch (error) {
                    console.log(`   ❌ Failed: ${error.message}`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } else {
            console.log('❌ No shops found or shop API failed');
        }
    } catch (error) {
        console.log(`❌ Shop research failed: ${error.message}`);
    }
    
    // Save results
    const reportPath = path.join(__dirname, 'printify-pricing-research-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        testProduct,
        results,
        summary: {
            totalEndpoints: results.length,
            successful: successfulEndpoints.length,
            withPricing: pricingEndpoints.length
        }
    }, null, 2));
    
    console.log(`\n📄 Detailed research report saved to: ${reportPath}`);
    console.log('\n🌊 WAVELENGTH PRICING RESEARCH COMPLETE!');
    
    return results;
}

// Run the research
if (require.main === module) {
    researchPricingEndpoints().catch(error => {
        console.error('❌ Research failed:', error);
        process.exit(1);
    });
}