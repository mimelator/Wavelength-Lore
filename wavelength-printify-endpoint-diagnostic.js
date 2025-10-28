#!/usr/bin/env node

/**
 * WAVELENGTH PRINTIFY ENDPOINT DIAGNOSTIC
 * Tests the exact endpoint difference identified in the analysis
 * Compares general vs provider-specific variant endpoints
 */

const https = require('https');
require('dotenv').config();

console.log('🌊 WAVELENGTH PRINTIFY ENDPOINT DIAGNOSTIC');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 Testing endpoint difference identified in analysis');
console.log('');

// Test with known working blueprint/provider from your example
const TEST_CASES = [
    { blueprintId: 68, providerId: 1, name: 'Mug 11oz - Printful' },
    { blueprintId: 6, providerId: 61, name: 'Heavy Cotton Tee - OTTO Print' },
    { blueprintId: 485, providerId: 29, name: 'T-shirt - TBD (from your example)' }
];

const PRINTIFY_API_URL = "https://api.printify.com/v1";
const API_TOKEN = process.env.PRINTIFY_API_TOKEN;

if (!API_TOKEN) {
    console.error('❌ PRINTIFY_API_TOKEN not found');
    process.exit(1);
}

async function printifyFetch(endpoint) {
    const url = new URL(`${PRINTIFY_API_URL}${endpoint}`);
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`, 
                'User-Agent': 'Wavelength-Endpoint-Diagnostic/1.0',
                'Accept': 'application/json'
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        data: res.statusCode < 300 ? JSON.parse(data) : data
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
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
        req.end();
    });
}

async function testEndpointComparison() {
    for (const testCase of TEST_CASES) {
        console.log(`🧪 TESTING: ${testCase.name}`);
        console.log(`   Blueprint: ${testCase.blueprintId}, Provider: ${testCase.providerId}`);
        console.log('');
        
        // Test 1: General endpoint (should have NO pricing)
        const generalEndpoint = `/catalog/blueprints/${testCase.blueprintId}/variants.json`;
        console.log(`1️⃣ GENERAL ENDPOINT (should have NO pricing):`);
        console.log(`   📍 ${generalEndpoint}`);
        
        try {
            const generalResult = await printifyFetch(generalEndpoint);
            
            if (generalResult.statusCode === 200) {
                const variants = generalResult.data.variants || generalResult.data;
                const sampleVariant = Array.isArray(variants) ? variants[0] : variants;
                
                console.log(`   ✅ SUCCESS: ${generalResult.statusCode}`);
                console.log(`   📊 Variants found: ${Array.isArray(variants) ? variants.length : 'N/A'}`);
                console.log(`   💰 Sample variant has price field: ${sampleVariant?.price !== undefined ? '✅ YES' : '❌ NO'}`);
                console.log(`   💵 Sample variant has cost field: ${sampleVariant?.cost !== undefined ? '✅ YES' : '❌ NO'}`);
                
                if (sampleVariant?.price !== undefined) {
                    console.log(`   💎 Sample price value: ${sampleVariant.price}`);
                }
            } else {
                console.log(`   ❌ FAILED: ${generalResult.statusCode}`);
                console.log(`   📄 Error: ${generalResult.data.toString().substring(0, 200)}`);
            }
        } catch (error) {
            console.log(`   ❌ REQUEST ERROR: ${error.message}`);
        }
        
        console.log('');
        
        // Test 2: Provider-specific endpoint (should have pricing)
        const providerEndpoint = `/catalog/blueprints/${testCase.blueprintId}/print_providers/${testCase.providerId}/variants.json`;
        console.log(`2️⃣ PROVIDER-SPECIFIC ENDPOINT (should have pricing):`);
        console.log(`   📍 ${providerEndpoint}`);
        
        try {
            const providerResult = await printifyFetch(providerEndpoint);
            
            if (providerResult.statusCode === 200) {
                const variants = providerResult.data.variants || providerResult.data;
                const sampleVariant = Array.isArray(variants) ? variants[0] : variants;
                
                console.log(`   ✅ SUCCESS: ${providerResult.statusCode}`);
                console.log(`   📊 Variants found: ${Array.isArray(variants) ? variants.length : 'N/A'}`);
                console.log(`   💰 Sample variant has price field: ${sampleVariant?.price !== undefined ? '✅ YES' : '❌ NO'}`);
                console.log(`   💵 Sample variant has cost field: ${sampleVariant?.cost !== undefined ? '✅ YES' : '❌ NO'}`);
                
                if (sampleVariant?.price !== undefined) {
                    console.log(`   💎 Sample price value: ${sampleVariant.price} cents ($${(sampleVariant.price/100).toFixed(2)})`);
                }
                
                if (sampleVariant?.shipping) {
                    console.log(`   🚚 Shipping info: First ${sampleVariant.shipping.first_item}¢, Additional ${sampleVariant.shipping.additional_item}¢`);
                }
                
                // Show sample structure
                if (sampleVariant) {
                    console.log(`   📋 Sample variant structure:`);
                    const cleanSample = {
                        id: sampleVariant.id,
                        title: sampleVariant.title,
                        price: sampleVariant.price,
                        cost: sampleVariant.cost,
                        shipping: sampleVariant.shipping,
                        sku: sampleVariant.sku
                    };
                    console.log(`      ${JSON.stringify(cleanSample, null, 6).split('\n').map(line => '      ' + line).join('\n')}`);
                }
                
            } else {
                console.log(`   ❌ FAILED: ${providerResult.statusCode}`);
                console.log(`   📄 Error: ${providerResult.data.toString().substring(0, 200)}`);
            }
        } catch (error) {
            console.log(`   ❌ REQUEST ERROR: ${error.message}`);
        }
        
        console.log('');
        console.log('━'.repeat(80));
        console.log('');
        
        // Add delay between test cases
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('🎯 DIAGNOSTIC SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Expected results based on analysis:');
    console.log('• General endpoint (/variants.json): ❌ NO pricing fields');
    console.log('• Provider endpoint (.../print_providers/.../variants.json): ✅ WITH pricing fields');
    console.log('');
    console.log('If provider endpoint still shows NO pricing, check:');
    console.log('1. Provider ID validity for that blueprint');
    console.log('2. API token permissions for pricing data');
    console.log('3. Blueprint/Provider compatibility');
    console.log('');
    console.log('🌊 WAVELENGTH ENDPOINT DIAGNOSTIC COMPLETE!');
}

if (require.main === module) {
    testEndpointComparison().catch(error => {
        console.error('❌ Diagnostic failed:', error);
        process.exit(1);
    });
}