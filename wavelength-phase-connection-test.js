#!/usr/bin/env node

/**
 * WAVELENGTH PHASE 1/2 CONNECTION TEST
 * Verifies we can reliably find Phase 1 products in Phase 2
 */

const https = require('https');
require('dotenv').config();

const ProductTypesModule = require('./config/product-types.js');
const ProductTypes = ProductTypesModule.ProductTypes;

const PRINTIFY_API_URL = process.env.PRINTIFY_API_URL || "https://api.printify.com/v1";
const API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

console.log('🌊 WAVELENGTH PHASE 1/2 CONNECTION TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 Testing if we can find Phase 1 reference products reliably');
console.log('');

async function printifyFetch(endpoint) {
    const url = new URL(`${PRINTIFY_API_URL}${endpoint}`);
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'User-Agent': 'Wavelength-Connection-Test/1.0',
                'Accept': 'application/json'
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data));
                    } else {
                        reject(new Error(`API Error: ${res.statusCode} - ${data}`));
                    }
                } catch (error) {
                    reject(new Error(`JSON Parse Error: ${error.message}`));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('timeout'));
        });
        req.end();
    });
}

async function testConnectionMechanisms() {
    console.log('🔍 STEP 1: Get all shop products and analyze findability');
    
    try {
        const result = await printifyFetch(`/shops/${SHOP_ID}/products.json`);
        
        if (result && result.data) {
            const allProducts = result.data;
            console.log(`   ✅ Found ${allProducts.length} total shop products`);
            
            // Test Method 1: Find by title pattern
            const pricingRefByTitle = allProducts.filter(p => 
                p.title && p.title.includes('[PRICING-REF]')
            );
            console.log(`   📋 Method 1 - Title pattern: Found ${pricingRefByTitle.length} pricing reference products`);
            
            // Test Method 2: Find by tags (if available)
            const pricingRefByTags = allProducts.filter(p => 
                p.tags && (
                    p.tags.includes('wavelength-pricing-ref') ||
                    p.tags.includes('do-not-sell') ||
                    p.tags.includes('internal')
                )
            );
            console.log(`   🏷️  Method 2 - Tags: Found ${pricingRefByTags.length} products with pricing ref tags`);
            
            // Test Method 3: Find by description pattern
            const pricingRefByDescription = allProducts.filter(p => 
                p.description && p.description.includes('DO NOT SELL - For cost calculation only')
            );
            console.log(`   📝 Method 3 - Description: Found ${pricingRefByDescription.length} products with pricing ref description`);
            
            console.log('');
            console.log('🧪 DETAILED ANALYSIS OF EXISTING PRODUCTS:');
            
            if (pricingRefByTitle.length > 0) {
                console.log('   ✅ TITLE METHOD WORKS! Sample products:');
                pricingRefByTitle.slice(0, 3).forEach(product => {
                    console.log(`      • "${product.title}" (ID: ${product.id})`);
                    console.log(`        Blueprint: ${product.blueprint_id}, Provider: ${product.print_provider_id}`);
                });
            } else {
                console.log('   📋 No products with [PRICING-REF] title pattern found');
                console.log('   🔍 Sample existing titles:');
                allProducts.slice(0, 5).forEach(product => {
                    console.log(`      • "${product.title}" (ID: ${product.id})`);
                });
            }
            
            console.log('');
            console.log('🎯 STEP 2: Test catalog product mapping');
            
            // Get a few catalog products and see if we can match them
            const catalogProducts = Object.entries(ProductTypes)
                .filter(([key, value]) => key.startsWith('validated-') && typeof value === 'object')
                .map(([key, product]) => ({ key, ...product }))
                .slice(0, 5);
            
            console.log(`   📚 Testing with ${catalogProducts.length} catalog products:`);
            
            const mappingResults = {
                foundByTitle: 0,
                foundByBlueprint: 0,
                notFound: 0
            };
            
            catalogProducts.forEach(catalogProduct => {
                console.log(`   🧪 Testing: ${catalogProduct.name} (${catalogProduct.blueprintId}-${catalogProduct.printProviderId})`);
                
                // Method A: Find by expected title
                const expectedTitle = `[PRICING-REF] ${catalogProduct.name}`;
                const foundByTitle = allProducts.find(p => p.title === expectedTitle);
                
                // Method B: Find by blueprint + provider combination
                const foundByBlueprint = allProducts.find(p => 
                    p.blueprint_id === catalogProduct.blueprintId && 
                    p.print_provider_id === catalogProduct.printProviderId &&
                    p.title && p.title.includes('[PRICING-REF]')
                );
                
                if (foundByTitle) {
                    console.log(`      ✅ Found by title: "${foundByTitle.title}" (ID: ${foundByTitle.id})`);
                    mappingResults.foundByTitle++;
                } else if (foundByBlueprint) {
                    console.log(`      ✅ Found by blueprint/provider: "${foundByBlueprint.title}" (ID: ${foundByBlueprint.id})`);
                    mappingResults.foundByBlueprint++;
                } else {
                    console.log(`      ❌ Not found - would need to create in Phase 1`);
                    mappingResults.notFound++;
                }
            });
            
            console.log('');
            console.log('📊 MAPPING TEST RESULTS:');
            console.log(`   ✅ Found by exact title: ${mappingResults.foundByTitle}`);
            console.log(`   ✅ Found by blueprint/provider: ${mappingResults.foundByBlueprint}`);
            console.log(`   ❌ Not found (need Phase 1): ${mappingResults.notFound}`);
            
            console.log('');
            console.log('🎯 PHASE 1/2 CONNECTION ASSESSMENT:');
            
            const totalReferenceProducts = pricingRefByTitle.length;
            const mappingSuccessRate = ((mappingResults.foundByTitle + mappingResults.foundByBlueprint) / catalogProducts.length) * 100;
            
            if (totalReferenceProducts > 0) {
                console.log(`   ✅ RELIABLE: We have ${totalReferenceProducts} existing reference products`);
                console.log(`   ✅ FINDABLE: ${mappingSuccessRate.toFixed(1)}% mapping success rate`);
                console.log('   ✅ READY: Phase 2 can find Phase 1 products reliably');
                
                console.log('');
                console.log('🚀 RECOMMENDED PHASE 2 STRATEGY:');
                console.log('   1. Get all shop products');
                console.log('   2. Filter by title pattern: [PRICING-REF]');
                console.log('   3. Map by blueprint_id + print_provider_id');
                console.log('   4. Extract pricing data from variants');
                console.log('   5. Save to config/pricing-cache.json');
                
            } else {
                console.log(`   ⚠️  NO REFERENCE PRODUCTS: Need to run Phase 1 first`);
                console.log('   🚀 NEXT STEP: npm run wavelength:create-pricing-catalog');
            }
            
        } else {
            console.log('   ❌ Failed to get shop products');
        }
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
}

if (require.main === module) {
    if (!API_TOKEN || !SHOP_ID) {
        console.error('❌ Missing PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID');
        process.exit(1);
    }
    
    testConnectionMechanisms().catch(error => {
        console.error('❌ Connection test failed:', error);
        process.exit(1);
    });
}