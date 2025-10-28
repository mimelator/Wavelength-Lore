#!/usr/bin/env node

/**
 * WAVELENGTH SHOP-BASED PRICING SYSTEM
 * Uses the correct /shops/{shop_id}/products.json endpoint for pricing
 */

const https = require('https');
require('dotenv').config();

// Get our product catalog
const ProductTypesModule = require('./config/product-types.js');
const ProductTypes = ProductTypesModule.ProductTypes;

const PRINTIFY_API_URL = process.env.PRINTIFY_API_URL || "https://api.printify.com/v1";
const API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID; // Use our actual shop ID

console.log('🌊 WAVELENGTH SHOP-BASED PRICING SYSTEM');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 Using Shop Products endpoint for REAL pricing data');
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
                'User-Agent': 'Wavelength-Shop-Pricing/1.0',
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

async function getShopProducts() {
    console.log('🛍️  Fetching all shop products with pricing...');
    
    try {
        const endpoint = `/shops/${SHOP_ID}/products.json`;
        console.log(`   📍 Endpoint: ${endpoint}`);
        
        const result = await printifyFetch(endpoint);
        
        if (result && result.data) {
            console.log(`   ✅ Found ${result.data.length} products with pricing data`);
            return result.data;
        } else {
            console.log('   ❌ No products data in response');
            return [];
        }
    } catch (error) {
        console.error(`   ❌ Error fetching shop products: ${error.message}`);
        return [];
    }
}

async function matchProductsWithPricing() {
    console.log('🔄 Starting product matching process...');
    
    // Get shop products with pricing
    const shopProducts = await getShopProducts();
    
    if (shopProducts.length === 0) {
        console.log('❌ No shop products found. Cannot proceed with pricing.');
        return;
    }
    
    console.log('');
    console.log('📊 PRICING ANALYSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Analyze shop products structure
    shopProducts.slice(0, 3).forEach((product, index) => {
        console.log(`${index + 1}. Product: ${product.title}`);
        console.log(`   Blueprint ID: ${product.blueprint_id}`);
        console.log(`   Print Provider ID: ${product.print_provider_id}`);
        
        // Check variants for pricing
        if (product.variants && product.variants.length > 0) {
            const sampleVariant = product.variants[0];
            console.log(`   Variants: ${product.variants.length}`);
            console.log(`   Sample variant pricing:`);
            console.log(`      Price: ${sampleVariant.cost} cents ($${(sampleVariant.cost/100).toFixed(2)})`);
            console.log(`      Has cost field: ${sampleVariant.cost !== undefined ? '✅ YES' : '❌ NO'}`);
            console.log(`      Variant fields: ${Object.keys(sampleVariant).join(', ')}`);
        }
        console.log('');
    });
    
    // Now match with our product catalog
    console.log('🔍 MATCHING WITH OUR CATALOG:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const catalogProducts = Object.entries(ProductTypes)
        .filter(([key, value]) => key.startsWith('validated-') && typeof value === 'object')
        .map(([key, product]) => ({ key, ...product }));
    
    let matchedCount = 0;
    let totalCatalogProducts = catalogProducts.length;
    
    for (const catalogProduct of catalogProducts.slice(0, 10)) { // Test with first 10
        console.log(`🧪 Testing: ${catalogProduct.name}`);
        console.log(`   Blueprint: ${catalogProduct.blueprintId}, Provider: ${catalogProduct.printProviderId}`);
        
        // Find matching shop product
        const matchingShopProduct = shopProducts.find(sp => 
            sp.blueprint_id === catalogProduct.blueprintId && 
            sp.print_provider_id === catalogProduct.printProviderId
        );
        
        if (matchingShopProduct) {
            matchedCount++;
            console.log(`   ✅ MATCH FOUND!`);
            console.log(`   🏪 Shop Product: ${matchingShopProduct.title}`);
            
            if (matchingShopProduct.variants && matchingShopProduct.variants.length > 0) {
                const sampleVariant = matchingShopProduct.variants[0];
                console.log(`   💰 Sample Pricing: ${sampleVariant.cost} cents ($${(sampleVariant.cost/100).toFixed(2)})`);
                console.log(`   📊 Available variants: ${matchingShopProduct.variants.length}`);
            }
        } else {
            console.log(`   ❌ No matching shop product found`);
        }
        console.log('');
    }
    
    console.log('🎯 MATCHING SUMMARY:');
    console.log(`   Catalog products tested: ${Math.min(10, totalCatalogProducts)}`);
    console.log(`   Successful matches: ${matchedCount}`);
    console.log(`   Match rate: ${((matchedCount / Math.min(10, totalCatalogProducts)) * 100).toFixed(1)}%`);
    console.log('');
    
    if (matchedCount > 0) {
        console.log('✅ SUCCESS! We can get pricing from shop products!');
        console.log('');
        console.log('🚀 NEXT STEPS:');
        console.log('1. Update merchandise store to use shop products endpoint');
        console.log('2. Create product matching system (blueprint + provider)');
        console.log('3. Cache shop products for performance');
        console.log('4. Handle products not yet in shop (fallback system)');
    } else {
        console.log('❌ No matches found. Need to investigate product creation process.');
    }
}

if (require.main === module) {
    if (!API_TOKEN) {
        console.error('❌ PRINTIFY_API_TOKEN not found');
        process.exit(1);
    }
    
    matchProductsWithPricing().catch(error => {
        console.error('❌ Pricing system failed:', error);
        process.exit(1);
    });
}