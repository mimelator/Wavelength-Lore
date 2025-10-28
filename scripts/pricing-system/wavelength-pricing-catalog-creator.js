#!/usr/bin/env node

/**
 * WAVELENGTH PRICING CATALOG CREATOR - PHASE 1
 * 
 * PURPOSE: Creates "pricing reference products" for all catalog items to get real Printify costs
 * WHEN TO RUN: Initial setup, or when new product types are added to catalog
 * 
 * WHAT IT DOES:
 * 1. Reads our product catalog (142 types)
 * 2. Checks which ones need pricing reference products
 * 3. Creates minimal shop products for pricing lookup
 * 4. Verifies pricing data is available
 * 
 * OUTPUT: Reference products in Printify shop that provide real cost data
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get our product catalog
const ProductTypesModule = require('../../config/product-types.js');
const ProductTypes = ProductTypesModule.ProductTypes;

const PRINTIFY_API_URL = process.env.PRINTIFY_API_URL || "https://api.printify.com/v1";
const API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

// Configuration
const CONFIG = {
    BATCH_SIZE: 5,           // How many products to create at once
    DELAY_BETWEEN_BATCHES: 5000, // 5 seconds between batches
    RETRY_ATTEMPTS: 3,       // Retry failed creations
    DRY_RUN: process.argv.includes('--dry-run'),
    VERBOSE: process.argv.includes('--verbose')
};

console.log('🌊 WAVELENGTH PRICING CATALOG CREATOR - PHASE 1');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 PURPOSE: Create pricing reference products for real cost lookup');
console.log(`🏪 Shop ID: ${SHOP_ID}`);
console.log(`🔧 Mode: ${CONFIG.DRY_RUN ? 'DRY RUN (no actual creation)' : 'LIVE (will create products)'}`);
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
                'User-Agent': 'Wavelength-Pricing-Creator/1.0',
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
                        rawData: data
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        data: data,
                        parseError: error.message,
                        rawData: data
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

async function getExistingShopProducts() {
    console.log('🔍 Checking existing shop products...');
    
    try {
        const result = await printifyFetch(`/shops/${SHOP_ID}/products.json`);
        
        if (result.statusCode === 200 && result.data?.data) {
            const products = result.data.data;
            console.log(`   ✅ Found ${products.length} existing shop products`);
            
            // Look for pricing reference products (marked with special title pattern)
            const referenceProducts = products.filter(p => 
                p.title && p.title.includes('[PRICING-REF]')
            );
            
            console.log(`   📊 Existing pricing reference products: ${referenceProducts.length}`);
            
            return {
                all: products,
                references: referenceProducts,
                referenceMap: new Map(
                    referenceProducts.map(p => [`${p.blueprint_id}-${p.print_provider_id}`, p])
                )
            };
        } else {
            console.log(`   ❌ Failed to get shop products: ${result.statusCode}`);
            return { all: [], references: [], referenceMap: new Map() };
        }
    } catch (error) {
        console.log(`   ❌ Error checking existing products: ${error.message}`);
        return { all: [], references: [], referenceMap: new Map() };
    }
}

async function createPricingReferenceProduct(catalogProduct, existingMap) {
    const productKey = `${catalogProduct.blueprintId}-${catalogProduct.printProviderId}`;
    
    console.log(`🛠️  Processing: ${catalogProduct.name}`);
    console.log(`   Blueprint: ${catalogProduct.blueprintId}, Provider: ${catalogProduct.printProviderId}`);
    
    // Check if reference product already exists
    if (existingMap.has(productKey)) {
        const existing = existingMap.get(productKey);
        console.log(`   ✅ Reference product already exists: ${existing.title} (ID: ${existing.id})`);
        return { status: 'exists', product: existing };
    }
    
    if (CONFIG.DRY_RUN) {
        console.log(`   🧪 DRY RUN: Would create pricing reference product`);
        return { status: 'dry_run' };
    }
    
    try {
        // Get variants for this blueprint/provider
        const variantsEndpoint = `/catalog/blueprints/${catalogProduct.blueprintId}/print_providers/${catalogProduct.printProviderId}/variants.json`;
        
        if (CONFIG.VERBOSE) {
            console.log(`   🔍 Getting variants: ${variantsEndpoint}`);
        }
        
        const variantsResult = await printifyFetch(variantsEndpoint);
        
        if (variantsResult.statusCode !== 200) {
            console.log(`   ❌ Failed to get variants: ${variantsResult.statusCode}`);
            return { status: 'failed', error: 'variants_fetch_failed' };
        }
        
        const variants = variantsResult.data.variants || [];
        if (variants.length === 0) {
            console.log(`   ❌ No variants found`);
            return { status: 'failed', error: 'no_variants' };
        }
        
        console.log(`   📦 Found ${variants.length} variants`);
        
        // Create minimal pricing reference product
        const productData = {
            title: `[PRICING-REF] ${catalogProduct.name}`,
            description: `Pricing reference for ${catalogProduct.name} (Blueprint ${catalogProduct.blueprintId}, Provider ${catalogProduct.printProviderId}). DO NOT SELL - For cost calculation only.`,
            blueprint_id: catalogProduct.blueprintId,
            print_provider_id: catalogProduct.printProviderId,
            variants: variants.map(variant => ({
                id: variant.id,
                price: 2999, // $29.99 - high enough to never accidentally sell
                is_enabled: true
            })),
            print_areas: [
                {
                    variant_ids: variants.map(v => v.id),
                    placeholders: [
                        {
                            position: "front",
                            images: [] // No images - minimal product
                        }
                    ]
                }
            ],
            tags: ["wavelength-pricing-ref", "do-not-sell", "internal"]
        };
        
        console.log(`   🚀 Creating pricing reference product...`);
        
        const createResult = await printifyFetch(`/shops/${SHOP_ID}/products.json`, 'POST', productData);
        
        if (createResult.statusCode === 200 || createResult.statusCode === 201) {
            console.log(`   ✅ SUCCESS! Reference product created`);
            console.log(`   🆔 Product ID: ${createResult.data.id}`);
            console.log(`   📝 Title: ${createResult.data.title}`);
            
            // Verify pricing data is available
            if (createResult.data.variants && createResult.data.variants.length > 0) {
                const sampleVariant = createResult.data.variants[0];
                if (sampleVariant.cost !== undefined) {
                    console.log(`   💰 ✅ REAL PRICING AVAILABLE: ${sampleVariant.cost}¢ ($${(sampleVariant.cost/100).toFixed(2)})`);
                } else {
                    console.log(`   ⚠️  Product created but cost pricing not yet calculated`);
                }
            }
            
            return { status: 'created', product: createResult.data };
        } else {
            console.log(`   ❌ Failed to create product: ${createResult.statusCode}`);
            if (CONFIG.VERBOSE) {
                console.log(`   📄 Error details: ${createResult.rawData?.substring(0, 300)}`);
            }
            return { status: 'failed', error: 'creation_failed', details: createResult.rawData };
        }
        
    } catch (error) {
        console.log(`   ❌ Error creating product: ${error.message}`);
        return { status: 'failed', error: 'exception', details: error.message };
    }
}

async function createPricingCatalog() {
    // Validation
    if (!API_TOKEN || !SHOP_ID) {
        console.error('❌ Missing PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID in environment');
        process.exit(1);
    }
    
    // Get catalog products
    const catalogProducts = Object.entries(ProductTypes)
        .filter(([key, value]) => key.startsWith('validated-') && typeof value === 'object')
        .map(([key, product]) => ({ key, ...product }));
    
    console.log(`📚 CATALOG ANALYSIS:`);
    console.log(`   Total catalog products: ${catalogProducts.length}`);
    console.log('');
    
    // Get existing shop products
    const existing = await getExistingShopProducts();
    const needsCreation = catalogProducts.filter(p => 
        !existing.referenceMap.has(`${p.blueprintId}-${p.printProviderId}`)
    );
    
    console.log(`📊 STATUS SUMMARY:`);
    console.log(`   Already have reference products: ${existing.references.length}`);
    console.log(`   Need to create: ${needsCreation.length}`);
    console.log(`   Ready to proceed: ${CONFIG.DRY_RUN ? 'DRY RUN MODE' : 'LIVE MODE'}`);
    console.log('');
    
    if (needsCreation.length === 0) {
        console.log('🎉 ALL PRICING REFERENCE PRODUCTS ALREADY EXIST!');
        console.log('');
        console.log('🚀 NEXT STEPS:');
        console.log('   1. Run Phase 2: wavelength-pricing-data-extractor.js');
        console.log('   2. Check pricing cache freshness');
        return;
    }
    
    // Process in batches
    const results = {
        created: [],
        existed: [],
        failed: [],
        dryRun: []
    };
    
    console.log(`🚀 PROCESSING ${needsCreation.length} PRODUCTS IN BATCHES OF ${CONFIG.BATCH_SIZE}:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (let i = 0; i < needsCreation.length; i += CONFIG.BATCH_SIZE) {
        const batch = needsCreation.slice(i, i + CONFIG.BATCH_SIZE);
        const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(needsCreation.length / CONFIG.BATCH_SIZE);
        
        console.log(`\n📦 BATCH ${batchNum}/${totalBatches} (${batch.length} products):`);
        
        for (const product of batch) {
            const result = await createPricingReferenceProduct(product, existing.referenceMap);
            
            switch (result.status) {
                case 'created':
                    results.created.push(result.product);
                    break;
                case 'exists':
                    results.existed.push(result.product);
                    break;
                case 'failed':
                    results.failed.push({ product, error: result.error });
                    break;
                case 'dry_run':
                    results.dryRun.push(product);
                    break;
            }
            
            // Brief pause between products
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Longer pause between batches
        if (i + CONFIG.BATCH_SIZE < needsCreation.length) {
            console.log(`   ⏳ Waiting ${CONFIG.DELAY_BETWEEN_BATCHES/1000}s before next batch...`);
            await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES));
        }
    }
    
    // Final summary
    console.log('\n🎯 FINAL SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successfully created: ${results.created.length}`);
    console.log(`📋 Already existed: ${results.existed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    if (CONFIG.DRY_RUN) {
        console.log(`🧪 Would create (dry run): ${results.dryRun.length}`);
    }
    
    if (results.failed.length > 0) {
        console.log('\n❌ FAILED PRODUCTS:');
        results.failed.forEach(({ product, error }) => {
            console.log(`   • ${product.name} (${product.blueprintId}-${product.printProviderId}): ${error}`);
        });
    }
    
    if (results.created.length > 0) {
        console.log('\n🎉 SUCCESS! Pricing reference products created.');
        console.log('\n🚀 NEXT STEPS:');
        console.log('   1. Wait a few minutes for Printify to calculate costs');
        console.log('   2. Run Phase 2: npm run wavelength:extract-pricing-data');
        console.log('   3. Verify pricing cache is populated');
    }
    
    console.log('\n📋 MAINTENANCE COMMANDS:');
    console.log('   • Check system: npm run wavelength:pricing-health');
    console.log('   • Refresh pricing: npm run wavelength:refresh-pricing');
    console.log('   • Add new products: npm run wavelength:add-missing-products');
}

// Handle CLI arguments
if (process.argv.includes('--help')) {
    console.log(`
WAVELENGTH PRICING CATALOG CREATOR - Phase 1

USAGE:
  node wavelength-pricing-catalog-creator.js [options]

OPTIONS:
  --dry-run    Show what would be created without actually creating
  --verbose    Show detailed API calls and responses
  --help       Show this help message

EXAMPLES:
  node wavelength-pricing-catalog-creator.js --dry-run
  node wavelength-pricing-catalog-creator.js --verbose
  node wavelength-pricing-catalog-creator.js
`);
    process.exit(0);
}

if (require.main === module) {
    createPricingCatalog().catch(error => {
        console.error('\n❌ FATAL ERROR:', error.message);
        console.error('\n🔍 TROUBLESHOOTING:');
        console.error('   1. Check environment variables (PRINTIFY_API_TOKEN, PRINTIFY_SHOP_ID)');
        console.error('   2. Verify API token permissions');
        console.error('   3. Check network connectivity');
        console.error('   4. Try --dry-run first to test');
        process.exit(1);
    });
}