#!/usr/bin/env node

/**
 * WAVELENGTH PRODUCT CREATION ERROR DIAGNOSTICS
 * Investigates why ALL products are failing with 400 errors
 */

const https = require('https');
require('dotenv').config();

const ProductTypesModule = require('./config/product-types.js');
const ProductTypes = ProductTypesModule.ProductTypes;

const PRINTIFY_API_URL = process.env.PRINTIFY_API_URL || "https://api.printify.com/v1";
const API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

console.log('🌊 WAVELENGTH PRODUCT CREATION ERROR DIAGNOSTICS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 Investigating why ALL products failed with 400 errors');
console.log('');

async function printifyFetch(endpoint, method = 'GET', body = null) {
    const url = new URL(`${PRINTIFY_API_URL}${endpoint}`);
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'User-Agent': 'Wavelength-Error-Diagnostics/1.0',
                'Accept': 'application/json'
            },
        };
        
        if (body && method === 'POST') {
            options.headers['Content-Type'] = 'application/json';
            const bodyStr = JSON.stringify(body);
            options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
        }

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        data: res.statusCode < 300 ? JSON.parse(data) : data,
                        rawData: data,
                        headers: res.headers
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        data: data,
                        parseError: error.message,
                        rawData: data,
                        headers: res.headers
                    });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(20000, () => {
            req.destroy();
            reject(new Error('timeout'));
        });
        
        if (body && method === 'POST') {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function testSingleProductCreation() {
    console.log('🧪 TESTING: Single product creation with detailed error info');
    
    // Test with a simple, known working product type
    const testProduct = {
        name: 'Mug 11oz',
        blueprintId: 68,
        printProviderId: 1
    };
    
    console.log(`   Testing: ${testProduct.name} (${testProduct.blueprintId}-${testProduct.printProviderId})`);
    
    try {
        // Step 1: Get variants
        const variantsEndpoint = `/catalog/blueprints/${testProduct.blueprintId}/print_providers/${testProduct.printProviderId}/variants.json`;
        console.log(`   🔍 Getting variants: ${variantsEndpoint}`);
        
        const variantsResult = await printifyFetch(variantsEndpoint);
        
        if (variantsResult.statusCode !== 200) {
            console.log(`   ❌ Failed to get variants: ${variantsResult.statusCode}`);
            console.log(`   📄 Error: ${variantsResult.rawData}`);
            return;
        }
        
        const variants = variantsResult.data.variants || [];
        console.log(`   ✅ Got ${variants.length} variants`);
        
        if (variants.length > 0) {
            console.log(`   📋 Sample variant structure:`);
            const sample = variants[0];
            console.log(JSON.stringify(sample, null, 4));
        }
        
        // Step 2: Create minimal product
        const productData = {
            title: `[TEST] ${testProduct.name} - Error Debug`,
            description: `Test product for error debugging`,
            blueprint_id: testProduct.blueprintId,
            print_provider_id: testProduct.printProviderId,
            variants: variants.map(variant => ({
                id: variant.id,
                price: 2999, // $29.99
                is_enabled: true
            })),
            print_areas: [
                {
                    variant_ids: variants.map(v => v.id),
                    placeholders: [
                        {
                            position: "front",
                            images: [] // No images
                        }
                    ]
                }
            ]
        };
        
        console.log('');
        console.log(`   📦 Creating test product...`);
        console.log(`   📄 Request payload:`);
        console.log(JSON.stringify(productData, null, 2));
        
        const createResult = await printifyFetch(`/shops/${SHOP_ID}/products.json`, 'POST', productData);
        
        console.log('');
        console.log(`   📊 Response Status: ${createResult.statusCode}`);
        console.log(`   📄 Full Response:`);
        console.log(`   Headers:`, createResult.headers);
        console.log(`   Body:`, createResult.rawData);
        
        if (createResult.statusCode === 400) {
            console.log('');
            console.log('🔍 400 ERROR ANALYSIS:');
            try {
                const errorData = JSON.parse(createResult.rawData);
                console.log('   📋 Parsed error data:');
                console.log(JSON.stringify(errorData, null, 4));
                
                if (errorData.errors) {
                    console.log('   🚨 Specific errors:');
                    Object.entries(errorData.errors).forEach(([field, messages]) => {
                        console.log(`      ${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`);
                    });
                }
            } catch (e) {
                console.log('   📄 Raw error (not JSON):');
                console.log(`   ${createResult.rawData}`);
            }
        }
        
    } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
    }
}

async function testAPIPermissions() {
    console.log('');
    console.log('🔐 TESTING: API Permissions and Shop Access');
    
    try {
        // Test 1: Can we read shop info?
        console.log('   🧪 Testing shop read access...');
        const shopResult = await printifyFetch(`/shops/${SHOP_ID}.json`);
        console.log(`      Shop info: ${shopResult.statusCode} - ${shopResult.statusCode === 200 ? 'SUCCESS' : 'FAILED'}`);
        
        if (shopResult.statusCode === 200) {
            const shop = shopResult.data;
            console.log(`      Shop name: ${shop.title}`);
            console.log(`      Shop ID: ${shop.id}`);
        }
        
        // Test 2: Can we list existing products?
        console.log('   🧪 Testing products read access...');
        const productsResult = await printifyFetch(`/shops/${SHOP_ID}/products.json`);
        console.log(`      Products list: ${productsResult.statusCode} - ${productsResult.statusCode === 200 ? 'SUCCESS' : 'FAILED'}`);
        
        if (productsResult.statusCode === 200) {
            const products = productsResult.data?.data || [];
            console.log(`      Existing products: ${products.length}`);
        }
        
        // Test 3: Check token scopes
        console.log('   🧪 Testing token info...');
        const tokenResult = await printifyFetch('/user.json');
        console.log(`      User info: ${tokenResult.statusCode} - ${tokenResult.statusCode === 200 ? 'SUCCESS' : 'FAILED'}`);
        
        if (tokenResult.statusCode === 200) {
            console.log(`      User data available - token is valid`);
        }
        
    } catch (error) {
        console.log(`   ❌ Permission test error: ${error.message}`);
    }
}

async function runDiagnostics() {
    if (!API_TOKEN || !SHOP_ID) {
        console.error('❌ Missing PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID');
        process.exit(1);
    }
    
    await testAPIPermissions();
    await testSingleProductCreation();
    
    console.log('');
    console.log('🎯 DIAGNOSTIC SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Check the detailed error messages above to identify:');
    console.log('1. Missing required fields in product creation');
    console.log('2. Invalid data formats or values');
    console.log('3. API permission issues');
    console.log('4. Shop configuration problems');
    console.log('');
    console.log('Common 400 error causes:');
    console.log('• Missing or invalid print_areas configuration');
    console.log('• Invalid variant IDs or pricing');
    console.log('• Required images missing for placeholders');
    console.log('• Invalid blueprint/provider combinations');
}

if (require.main === module) {
    runDiagnostics().catch(error => {
        console.error('❌ Diagnostics failed:', error);
        process.exit(1);
    });
}