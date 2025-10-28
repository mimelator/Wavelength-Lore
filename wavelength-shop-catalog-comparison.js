#!/usr/bin/env node

/**
 * WAVELENGTH SHOP VS CATALOG COMPARISON
 * Compare what's in our shop vs our product catalog
 */

const https = require('https');
require('dotenv').config();

// Get our product catalog
const ProductTypesModule = require('./config/product-types.js');
const ProductTypes = ProductTypesModule.ProductTypes;

const PRINTIFY_API_URL = process.env.PRINTIFY_API_URL || "https://api.printify.com/v1";
const API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

console.log('🌊 WAVELENGTH SHOP VS CATALOG COMPARISON');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🏪 Shop ID: ${SHOP_ID}`);
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
                'User-Agent': 'Wavelength-Comparison/1.0',
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

async function compareShopVsCatalog() {
    console.log('📊 STEP 1: Analyzing Shop Products');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Get shop products
    const shopResult = await printifyFetch(`/shops/${SHOP_ID}/products.json`);
    const shopProducts = shopResult?.data || [];
    
    console.log(`Found ${shopProducts.length} products in shop`);
    
    // Group shop products by blueprint + provider
    const shopProductMap = new Map();
    const shopStats = {
        uniqueBlueprints: new Set(),
        uniqueProviders: new Set(),
        blueprintProviderPairs: new Set()
    };
    
    shopProducts.forEach(product => {
        const key = `${product.blueprint_id}-${product.print_provider_id}`;
        const blueprintId = product.blueprint_id;
        const providerId = product.print_provider_id;
        
        shopStats.uniqueBlueprints.add(blueprintId);
        shopStats.uniqueProviders.add(providerId);
        shopStats.blueprintProviderPairs.add(key);
        
        if (!shopProductMap.has(key)) {
            shopProductMap.set(key, []);
        }
        shopProductMap.get(key).push(product);
    });
    
    console.log(`📈 Shop Statistics:`);
    console.log(`   Unique blueprints: ${shopStats.uniqueBlueprints.size}`);
    console.log(`   Unique providers: ${shopStats.uniqueProviders.size}`);
    console.log(`   Blueprint/Provider pairs: ${shopStats.blueprintProviderPairs.size}`);
    console.log('');
    
    console.log('🔍 Shop Blueprint/Provider Combinations:');
    Array.from(shopStats.blueprintProviderPairs).sort().forEach(pair => {
        const products = shopProductMap.get(pair);
        console.log(`   ${pair}: ${products.length} products`);
    });
    console.log('');
    
    console.log('📚 STEP 2: Analyzing Catalog Products');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Get catalog products
    const catalogProducts = Object.entries(ProductTypes)
        .filter(([key, value]) => key.startsWith('validated-') && typeof value === 'object')
        .map(([key, product]) => ({ key, ...product }));
    
    console.log(`Found ${catalogProducts.length} products in catalog`);
    
    // Group catalog products by blueprint + provider
    const catalogProductMap = new Map();
    const catalogStats = {
        uniqueBlueprints: new Set(),
        uniqueProviders: new Set(),
        blueprintProviderPairs: new Set()
    };
    
    catalogProducts.forEach(product => {
        const key = `${product.blueprintId}-${product.printProviderId}`;
        const blueprintId = product.blueprintId;
        const providerId = product.printProviderId;
        
        catalogStats.uniqueBlueprints.add(blueprintId);
        catalogStats.uniqueProviders.add(providerId);
        catalogStats.blueprintProviderPairs.add(key);
        
        if (!catalogProductMap.has(key)) {
            catalogProductMap.set(key, []);
        }
        catalogProductMap.get(key).push(product);
    });
    
    console.log(`📈 Catalog Statistics:`);
    console.log(`   Unique blueprints: ${catalogStats.uniqueBlueprints.size}`);
    console.log(`   Unique providers: ${catalogStats.uniqueProviders.size}`);
    console.log(`   Blueprint/Provider pairs: ${catalogStats.blueprintProviderPairs.size}`);
    console.log('');
    
    console.log('🔍 First 10 Catalog Blueprint/Provider Combinations:');
    Array.from(catalogStats.blueprintProviderPairs).sort().slice(0, 10).forEach(pair => {
        const products = catalogProductMap.get(pair);
        console.log(`   ${pair}: ${products.length} products`);
    });
    console.log('');
    
    console.log('🎯 STEP 3: Finding Matches');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Find intersections
    const matchingPairs = Array.from(catalogStats.blueprintProviderPairs)
        .filter(pair => shopStats.blueprintProviderPairs.has(pair));
    
    console.log(`✅ Matching Blueprint/Provider Pairs: ${matchingPairs.length}`);
    matchingPairs.forEach(pair => {
        const shopProducts = shopProductMap.get(pair);
        const catalogProducts = catalogProductMap.get(pair);
        console.log(`   ${pair}: ${shopProducts.length} shop products, ${catalogProducts.length} catalog products`);
        
        // Show sample pricing
        if (shopProducts.length > 0 && shopProducts[0].variants?.length > 0) {
            const sampleVariant = shopProducts[0].variants[0];
            console.log(`      💰 Sample pricing: ${sampleVariant.cost} cents ($${(sampleVariant.cost/100).toFixed(2)})`);
        }
    });
    console.log('');
    
    // Find what's only in shop
    const shopOnlyPairs = Array.from(shopStats.blueprintProviderPairs)
        .filter(pair => !catalogStats.blueprintProviderPairs.has(pair));
    
    console.log(`🏪 Shop-Only Pairs: ${shopOnlyPairs.length}`);
    shopOnlyPairs.forEach(pair => {
        const products = shopProductMap.get(pair);
        console.log(`   ${pair}: ${products.length} products`);
    });
    console.log('');
    
    // Find what's only in catalog
    const catalogOnlyPairs = Array.from(catalogStats.blueprintProviderPairs)
        .filter(pair => !shopStats.blueprintProviderPairs.has(pair))
        .slice(0, 10); // Show first 10
    
    console.log(`📚 Catalog-Only Pairs (first 10): ${catalogOnlyPairs.length} total`);
    catalogOnlyPairs.forEach(pair => {
        const products = catalogProductMap.get(pair);
        console.log(`   ${pair}: ${products.length} products`);
    });
    console.log('');
    
    console.log('🎯 SUMMARY & RECOMMENDATIONS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total matches: ${matchingPairs.length} pairs`);
    
    if (matchingPairs.length > 0) {
        console.log('✅ GOOD NEWS: We have some products with pricing!');
        console.log('🚀 NEXT STEPS:');
        console.log('1. Update merchandise store to use matching products');
        console.log('2. Create shop products for missing catalog items');
        console.log('3. Use shop products endpoint for pricing');
    } else {
        console.log('❌ NO MATCHES: Shop and catalog are completely different');
        console.log('🚀 SOLUTIONS:');
        console.log('1. Create shop products from catalog items');
        console.log('2. Or update catalog to match shop products');
        console.log('3. Or use mixed approach (shop pricing + catalog fallback)');
    }
}

if (require.main === module) {
    if (!API_TOKEN || !SHOP_ID) {
        console.error('❌ Missing PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID');
        process.exit(1);
    }
    
    compareShopVsCatalog().catch(error => {
        console.error('❌ Comparison failed:', error);
        process.exit(1);
    });
}