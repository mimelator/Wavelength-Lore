#!/usr/bin/env node

/**
 * WAVELENGTH EXACT API PATTERN TEST
 * Following the exact function structure from the analysis
 */

const https = require('https');
require('dotenv').config();

const PRINTIFY_API_URL = "https://api.printify.com/v1";
const API_TOKEN = process.env.PRINTIFY_API_TOKEN;

// Replicate the EXACT function from the analysis
async function getBlueprintVariants(blueprintId, providerId) {
    console.log(`🔍 Testing getBlueprintVariants(${blueprintId}, ${providerId})`);
    
    // THIS is the crucial part that includes the price!
    const endpoint = `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`;
    console.log(`   📍 Endpoint: ${endpoint}`);
    
    // Native Node.js fetch implementation
    return new Promise((resolve, reject) => {
        const url = new URL(`${PRINTIFY_API_URL}${endpoint}`);
        
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'User-Agent': 'Wavelength-Exact-Pattern-Test/1.0',
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
                        reject(new Error(`API Error: ${res.statusCode} - ${data}`));
                    }
                } catch (parseError) {
                    reject(new Error(`JSON Parse Error: ${parseError.message}`));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

async function testExactPattern() {
    console.log('🌊 WAVELENGTH EXACT API PATTERN TEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Testing the EXACT function structure from the analysis');
    console.log('');

    if (!API_TOKEN) {
        console.error('❌ PRINTIFY_API_TOKEN not found');
        process.exit(1);
    }

    // Test with known working combinations from our config
    const testCases = [
        { blueprintId: 413, providerId: 10, name: 'Backpack - MWW On Demand' },
        { blueprintId: 238, providerId: 99, name: 'Sherpa Fleece Blanket - MWW On Demand' },
        { blueprintId: 6, providerId: 61, name: 'T-shirt - OTTO Print' }
    ];

    for (const testCase of testCases) {
        console.log(`🧪 TESTING: ${testCase.name}`);
        
        try {
            const result = await getBlueprintVariants(testCase.blueprintId, testCase.providerId);
            
            console.log(`   ✅ API SUCCESS`);
            console.log(`   📊 Variants returned: ${result.variants ? result.variants.length : 'N/A'}`);
            
            if (result.variants && result.variants.length > 0) {
                const sampleVariant = result.variants[0];
                console.log(`   🔍 Sample variant analysis:`);
                console.log(`      ID: ${sampleVariant.id}`);
                console.log(`      Title: ${sampleVariant.title}`);
                console.log(`      Price field exists: ${sampleVariant.price !== undefined ? '✅ YES' : '❌ NO'}`);
                console.log(`      Cost field exists: ${sampleVariant.cost !== undefined ? '✅ YES' : '❌ NO'}`);
                console.log(`      Price value: ${sampleVariant.price}`);
                console.log(`      Cost value: ${sampleVariant.cost}`);
                
                if (sampleVariant.price !== undefined) {
                    console.log(`      💰 PRICING FOUND! ${sampleVariant.price} cents ($${(sampleVariant.price/100).toFixed(2)})`);
                } else {
                    console.log(`      ❌ NO PRICING - checking other possible fields...`);
                    
                    // Check all possible pricing fields
                    const allFields = Object.keys(sampleVariant);
                    const priceFields = allFields.filter(field => 
                        field.toLowerCase().includes('price') || 
                        field.toLowerCase().includes('cost') ||
                        field.toLowerCase().includes('amount')
                    );
                    
                    console.log(`      🔍 All fields: ${allFields.join(', ')}`);
                    console.log(`      💰 Price-related fields: ${priceFields.join(', ') || 'NONE'}`);
                }
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
        }
        
        console.log('');
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('🎯 EXACT PATTERN TEST COMPLETE');
    console.log('If this test shows no pricing, the issue is likely:');
    console.log('1. API token permissions (need pricing access level)');
    console.log('2. Missing required headers or query parameters');
    console.log('3. Different API endpoint needed for pricing data');
}

if (require.main === module) {
    testExactPattern().catch(error => {
        console.error('❌ Test failed:', error);
        process.exit(1);
    });
}