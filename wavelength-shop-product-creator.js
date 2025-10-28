#!/usr/bin/env node

/**
 * WAVELENGTH SHOP PRODUCT CREATOR
 * Creates shop products from catalog items to get real Printify pricing
 * Option 1: Create shop products for missing catalog items
 */

const https = require('https');
require('dotenv').config();

// Get our product catalog
const ProductTypesModule = require('./config/product-types.js');
const ProductTypes = ProductTypesModule.ProductTypes;

const PRINTIFY_API_URL = process.env.PRINTIFY_API_URL || "https://api.printify.com/v1";
const API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

console.log('🌊 WAVELENGTH SHOP PRODUCT CREATOR');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎯 Creating shop products from catalog to get REAL pricing');
console.log(`🏪 Shop ID: ${SHOP_ID}`);
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
                'User-Agent': 'Wavelength-Product-Creator/1.0',
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

async function createShopProduct(catalogProduct) {
    console.log(`🛠️  Creating shop product: ${catalogProduct.name}`);
    console.log(`   Blueprint: ${catalogProduct.blueprintId}, Provider: ${catalogProduct.printProviderId}`);
    
    // First, get the blueprint variants to understand structure
    try {
        const variantsEndpoint = `/catalog/blueprints/${catalogProduct.blueprintId}/print_providers/${catalogProduct.printProviderId}/variants.json`;
        console.log(`   🔍 Getting variants: ${variantsEndpoint}`);
        
        const variantsResult = await printifyFetch(variantsEndpoint);
        
        if (variantsResult.statusCode !== 200) {
            console.log(`   ❌ Failed to get variants: ${variantsResult.statusCode}`);
            return null;
        }
        
        const variants = variantsResult.data.variants || [];
        if (variants.length === 0) {
            console.log(`   ❌ No variants found`);
            return null;
        }
        
        console.log(`   ✅ Found ${variants.length} variants`);
        
        // Create a simple product with minimal design
        const productData = {
            title: `${catalogProduct.name} - Real Pricing Test`,
            description: `Real pricing test for ${catalogProduct.name} (Blueprint ${catalogProduct.blueprintId})`,
            blueprint_id: catalogProduct.blueprintId,
            print_provider_id: catalogProduct.printProviderId,
            variants: variants.map(variant => ({
                id: variant.id,
                price: 2000, // $20.00 retail price for testing
                is_enabled: true
            })),
            print_areas: [
                {
                    variant_ids: variants.map(v => v.id),
                    placeholders: [
                        {
                            position: "front",
                            images: []
                        }
                    ]
                }
            ]
        };
        
        console.log(`   📦 Creating product with ${productData.variants.length} variants...`);
        
        const createResult = await printifyFetch(`/shops/${SHOP_ID}/products.json`, 'POST', productData);
        
        if (createResult.statusCode === 200 || createResult.statusCode === 201) {
            console.log(`   ✅ SUCCESS! Product created with ID: ${createResult.data.id}`);
            console.log(`   🏪 Shop product title: ${createResult.data.title}`);
            
            // Check if the created product has pricing
            if (createResult.data.variants && createResult.data.variants.length > 0) {
                const sampleVariant = createResult.data.variants[0];
                if (sampleVariant.cost !== undefined) {
                    console.log(`   💰 REAL PRICING FOUND: ${sampleVariant.cost} cents ($${(sampleVariant.cost/100).toFixed(2)})`);
                } else {
                    console.log(`   ⚠️  Product created but no cost pricing yet`);
                }
            }
            
            return createResult.data;
        } else {
            console.log(`   ❌ Failed to create product: ${createResult.statusCode}`);
            console.log(`   📄 Error: ${createResult.rawData?.substring(0, 200)}`);
            return null;
        }
        
    } catch (error) {
        console.log(`   ❌ Error creating product: ${error.message}`);
        return null;
    }
}

async function createShopProductsFromCatalog() {
    if (!API_TOKEN || !SHOP_ID) {
        console.error('❌ Missing PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID');
        process.exit(1);
    }
    
    // Get catalog products that don't have shop equivalents
    const catalogProducts = Object.entries(ProductTypes)
        .filter(([key, value]) => key.startsWith('validated-') && typeof value === 'object')
        .map(([key, product]) => ({ key, ...product }));
    
    console.log(`📚 Found ${catalogProducts.length} catalog products`);
    console.log('');
    
    // Test with first few products
    const testProducts = catalogProducts.slice(0, 5);
    console.log(`🧪 TESTING: Creating ${testProducts.length} products for real pricing`);
    console.log('');
    
    const results = {
        successful: [],
        failed: [],
        withPricing: []
    };
    
    for (const catalogProduct of testProducts) {
        const result = await createShopProduct(catalogProduct);
        
        if (result) {
            results.successful.push(result);
            
            // Check if we got real pricing
            if (result.variants && result.variants.some(v => v.cost !== undefined)) {
                results.withPricing.push(result);
            }
        } else {
            results.failed.push(catalogProduct);
        }
        
        console.log('');
        
        // Rate limiting - don't overwhelm the API
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('🎯 CREATION SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Successful creations: ${results.successful.length}`);
    console.log(`❌ Failed creations: ${results.failed.length}`);
    console.log(`💰 Products with real pricing: ${results.withPricing.length}`);
    console.log('');
    
    if (results.withPricing.length > 0) {
        console.log('🎉 SUCCESS! Products with real Printify pricing:');
        results.withPricing.forEach(product => {
            const sampleVariant = product.variants.find(v => v.cost !== undefined);
            console.log(`   • ${product.title}`);
            console.log(`     Cost: ${sampleVariant.cost} cents ($${(sampleVariant.cost/100).toFixed(2)})`);
        });
        console.log('');
        console.log('🚀 NEXT STEPS:');
        console.log('1. Update merchandise store to use these shop products');
        console.log('2. Create more products for complete catalog coverage');
        console.log('3. Implement shop-based pricing in frontend');
    } else {
        console.log('❌ No products created with real pricing');
        console.log('🔍 This suggests:');
        console.log('1. API permissions issue');
        console.log('2. Products need to be published first');
        console.log('3. Pricing calculation happens after creation');
    }
}

if (require.main === module) {
    createShopProductsFromCatalog().catch(error => {
        console.error('❌ Product creation failed:', error);
        process.exit(1);
    });
}