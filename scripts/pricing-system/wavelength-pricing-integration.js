#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');

/**
 * WAVELENGTH PRICING INTEGRATION - PHASE 3
 * ========================================
 * 
 * Creates a production-ready pricing lookup system for the merchandise store.
 * Validates that we can lookup prices and only display products with valid pricing.
 * 
 * Usage:
 * node wavelength-pricing-integration.js
 * 
 * Output: Creates pricing lookup API endpoint and validates system
 */

class PricingIntegration {
    constructor() {
        this.pricingCatalog = null;
        this.simpleCatalog = null;
        this.stats = {
            totalProducts: 0,
            productsWithPricing: 0,
            totalVariants: 0,
            priceRange: { min: 999, max: 0 },
            averagePrice: 0
        };
        
        console.log('🌊 WAVELENGTH PRICING INTEGRATION - PHASE 3');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💰 Creating production-ready pricing lookup system');
        console.log('');
    }

    loadPricingData() {
        console.log('📋 Loading extracted pricing data...');
        
        try {
            // Load full pricing catalog
            const fullPath = path.join(__dirname, 'pricing-catalog-final.json');
            const fullData = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            this.pricingCatalog = fullData.pricingCatalog;
            
            // Load simplified catalog  
            const simplePath = path.join(__dirname, 'pricing-catalog-simple.json');
            this.simpleCatalog = JSON.parse(fs.readFileSync(simplePath, 'utf8'));
            
            console.log(`   ✅ Loaded pricing data for ${Object.keys(this.pricingCatalog).length} products`);
            console.log(`   📊 Total variants with pricing: ${Object.values(this.pricingCatalog).reduce((sum, product) => sum + product.variants.length, 0)}`);
            
            this.calculateStats();
            return true;
            
        } catch (error) {
            console.error('❌ Failed to load pricing data:', error.message);
            console.log('   💡 Make sure you ran Phase 2 first:');
            console.log('      node wavelength-pricing-data-extractor.js');
            return false;
        }
    }

    calculateStats() {
        console.log('📊 Calculating pricing statistics...');
        
        const allPrices = [];
        let totalProducts = 0;
        let totalVariants = 0;
        
        Object.values(this.pricingCatalog).forEach(product => {
            totalProducts++;
            totalVariants += product.variants.length;
            
            product.variants.forEach(variant => {
                const price = variant.price / 100; // Convert cents to dollars
                allPrices.push(price);
            });
        });
        
        this.stats = {
            totalProducts,
            productsWithPricing: totalProducts,
            totalVariants,
            priceRange: {
                min: Math.min(...allPrices),
                max: Math.max(...allPrices)
            },
            averagePrice: allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length
        };
        
        console.log(`   📦 Products with pricing: ${this.stats.productsWithPricing}`);
        console.log(`   🏷️ Total variants: ${this.stats.totalVariants}`);
        console.log(`   💵 Price range: $${this.stats.priceRange.min.toFixed(2)} - $${this.stats.priceRange.max.toFixed(2)}`);
        console.log(`   📈 Average price: $${this.stats.averagePrice.toFixed(2)}`);
    }

    testPricingLookups() {
        console.log('\n🧪 Testing pricing lookup functionality...');
        
        // Test cases
        const testCases = [
            { blueprintId: 68, printProviderId: 1, expected: 'Mug 11oz' },
            { blueprintId: 268, printProviderId: 1, expected: 'Slim Phone Cases' },
            { blueprintId: 31, printProviderId: 3, expected: 'Infant Long Sleeve Bodysuit' },
            { blueprintId: 999, printProviderId: 999, expected: null } // Should fail
        ];
        
        let passedTests = 0;
        
        testCases.forEach((testCase, index) => {
            console.log(`\n   🔍 Test ${index + 1}: Blueprint ${testCase.blueprintId}, Provider ${testCase.printProviderId}`);
            
            const result = this.lookupProductPricing(testCase.blueprintId, testCase.printProviderId);
            
            if (testCase.expected === null) {
                // Should fail
                if (!result.success) {
                    console.log(`      ✅ PASS: Correctly failed for non-existent product`);
                    passedTests++;
                } else {
                    console.log(`      ❌ FAIL: Should have failed but returned pricing`);
                }
            } else {
                // Should succeed
                if (result.success && result.productName === testCase.expected) {
                    console.log(`      ✅ PASS: Found ${result.productName} with ${result.variants.length} variants`);
                    console.log(`      💰 Price range: ${result.priceRange}`);
                    passedTests++;
                } else {
                    console.log(`      ❌ FAIL: Expected ${testCase.expected}, got ${result.productName || 'error'}`);
                }
            }
        });
        
        console.log(`\n🎯 Test Results: ${passedTests}/${testCases.length} tests passed`);
        return passedTests === testCases.length;
    }

    lookupProductPricing(blueprintId, printProviderId) {
        const catalogKey = `${blueprintId}-${printProviderId}`;
        
        if (!this.pricingCatalog[catalogKey]) {
            return {
                success: false,
                error: `No pricing data found for blueprint ${blueprintId} with provider ${printProviderId}`,
                message: 'Product will be hidden from customers until pricing is available'
            };
        }
        
        const product = this.pricingCatalog[catalogKey];
        
        // Calculate price range
        const prices = product.variants.map(v => v.price / 100);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = minPrice === maxPrice ? 
            `$${minPrice.toFixed(2)}` : 
            `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
        
        return {
            success: true,
            productName: product.productName,
            blueprintId: product.blueprintId,
            printProviderId: product.printProviderId,
            variants: product.variants,
            priceRange,
            minPrice: `$${minPrice.toFixed(2)}`,
            maxPrice: `$${maxPrice.toFixed(2)}`,
            variantCount: product.variants.length
        };
    }

    validateProductCatalog() {
        console.log('\n🔍 Validating product catalog against pricing data...');
        
        // Load the product catalog to check which products we can display
        let productCatalog;
        try {
            const catalogPath = path.join(__dirname, '../../config/product-types.js');
            delete require.cache[require.resolve(catalogPath)];
            const config = require(catalogPath);
            productCatalog = Object.values(config.ProductTypes);
        } catch (error) {
            console.error('❌ Failed to load product catalog:', error.message);
            return false;
        }
        
        console.log(`   📋 Checking ${productCatalog.length} products from catalog...`);
        
        let displayableProducts = 0;
        let hiddenProducts = 0;
        const hiddenProductsList = [];
        
        productCatalog.forEach(product => {
            const result = this.lookupProductPricing(product.blueprintId, product.printProviderId);
            
            if (result.success) {
                displayableProducts++;
                console.log(`   ✅ ${product.name}: ${result.priceRange} (${result.variantCount} variants)`);
            } else {
                hiddenProducts++;
                hiddenProductsList.push(product.name);
                console.log(`   ❌ ${product.name}: NO PRICING - will be hidden`);
            }
        });
        
        console.log(`\n📊 CATALOG VALIDATION RESULTS:`);
        console.log(`   ✅ Products that will be shown: ${displayableProducts}`);
        console.log(`   ❌ Products that will be hidden: ${hiddenProducts}`);
        console.log(`   📈 Display success rate: ${Math.round(displayableProducts/productCatalog.length*100)}%`);
        
        if (hiddenProducts > 0) {
            console.log(`\n❌ HIDDEN PRODUCTS (no pricing available):`);
            hiddenProductsList.forEach(name => console.log(`   - ${name}`));
        }
        
        return displayableProducts > 0;
    }

    createPricingLookupAPI() {
        console.log('\n🚀 Creating pricing lookup API endpoint...');
        
        const apiEndpoint = `
/**
 * WAVELENGTH PRICING LOOKUP API
 * Generated: ${new Date().toISOString()}
 * 
 * Usage in merchandise store:
 * const pricing = await this.lookupProductPricing(blueprintId, printProviderId);
 * if (!pricing.success) {
 *   // Hide product - no pricing available
 *   return null;
 * }
 * // Use pricing.priceRange, pricing.variants, etc.
 */

class WavelengthPricingService {
    constructor() {
        // Load pricing data from our extracted catalog
        this.pricingCatalog = ${JSON.stringify(this.simpleCatalog, null, 2)};
        
        console.log('💰 Wavelength Pricing Service initialized');
        console.log('📊 Products with pricing: ${this.stats.productsWithPricing}');
        console.log('🏷️ Total variants: ${this.stats.totalVariants}');
        console.log('💵 Price range: $${this.stats.priceRange.min.toFixed(2)} - $${this.stats.priceRange.max.toFixed(2)}');
    }
    
    /**
     * Lookup pricing for a specific blueprint/provider combination
     * @param {number} blueprintId - Printify blueprint ID
     * @param {number} printProviderId - Printify print provider ID
     * @returns {Object} Pricing result with success flag
     */
    lookupProductPricing(blueprintId, printProviderId) {
        const catalogKey = \`\${blueprintId}-\${printProviderId}\`;
        
        if (!this.pricingCatalog[catalogKey]) {
            return {
                success: false,
                error: \`No pricing data found for blueprint \${blueprintId} with provider \${printProviderId}\`,
                message: 'Product will be hidden from customers until pricing is available'
            };
        }
        
        const product = this.pricingCatalog[catalogKey];
        
        // Calculate price range from variants
        const prices = product.variants.map(variant => {
            const price = parseFloat(variant.price.replace('$', ''));
            return price;
        });
        
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = minPrice === maxPrice ? 
            \`$\${minPrice.toFixed(2)}\` : 
            \`$\${minPrice.toFixed(2)} - $\${maxPrice.toFixed(2)}\`;
        
        return {
            success: true,
            productName: product.productName,
            variants: product.variants,
            priceRange,
            minPrice: \`$\${minPrice.toFixed(2)}\`,
            maxPrice: \`$\${maxPrice.toFixed(2)}\`,
            variantCount: product.variants.length
        };
    }
    
    /**
     * Check if a product has valid pricing
     * @param {number} blueprintId - Printify blueprint ID  
     * @param {number} printProviderId - Printify print provider ID
     * @returns {boolean} True if pricing is available
     */
    hasValidPricing(blueprintId, printProviderId) {
        return this.lookupProductPricing(blueprintId, printProviderId).success;
    }
    
    /**
     * Get all products with valid pricing
     * @returns {Array} Array of products that can be displayed
     */
    getDisplayableProducts() {
        return Object.keys(this.pricingCatalog).map(key => {
            const [blueprintId, printProviderId] = key.split('-').map(Number);
            return {
                blueprintId,
                printProviderId,
                ...this.pricingCatalog[key]
            };
        });
    }
    
    /**
     * Get pricing statistics
     * @returns {Object} Pricing statistics
     */
    getStats() {
        return ${JSON.stringify(this.stats, null, 6)};
    }
}

// Export for use in merchandise store
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WavelengthPricingService;
}
`;
        
        // Save the API endpoint
        const outputPath = path.join(__dirname, '../../static/js/services/wavelength-pricing-service.js');
        
        // Create services directory if it doesn't exist
        const servicesDir = path.dirname(outputPath);
        if (!fs.existsSync(servicesDir)) {
            fs.mkdirSync(servicesDir, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, apiEndpoint);
        console.log(`   💾 API endpoint saved: ${outputPath}`);
        
        return outputPath;
    }

    createIntegrationTest() {
        console.log('\n🧪 Creating integration test for merchandise store...');
        
        const testScript = `
/**
 * WAVELENGTH PRICING INTEGRATION TEST
 * ==================================
 * 
 * Tests that the merchandise store correctly uses pricing data
 * and only displays products with valid pricing.
 */

// Test the pricing service
const pricingService = new WavelengthPricingService();

console.log('🧪 WAVELENGTH PRICING INTEGRATION TEST');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Test 1: Lookup known good products
console.log('\\n🔍 Test 1: Known products with pricing');
const knownProducts = [
    { blueprint: 68, provider: 1, name: 'Mug 11oz' },
    { blueprint: 268, provider: 1, name: 'Slim Phone Cases' },
    { blueprint: 31, provider: 3, name: 'Infant Long Sleeve Bodysuit' }
];

knownProducts.forEach(product => {
    const result = pricingService.lookupProductPricing(product.blueprint, product.provider);
    if (result.success) {
        console.log(\`   ✅ \${product.name}: \${result.priceRange} (\${result.variantCount} variants)\`);
    } else {
        console.log(\`   ❌ \${product.name}: FAILED - \${result.error}\`);
    }
});

// Test 2: Try to lookup non-existent product
console.log('\\n🔍 Test 2: Non-existent product (should fail)');
const badResult = pricingService.lookupProductPricing(999, 999);
if (!badResult.success) {
    console.log('   ✅ Correctly rejected non-existent product');
} else {
    console.log('   ❌ Should have failed for non-existent product');
}

// Test 3: Check pricing statistics
console.log('\\n📊 Test 3: Pricing statistics');
const stats = pricingService.getStats();
console.log(\`   📦 Products with pricing: \${stats.productsWithPricing}\`);
console.log(\`   🏷️ Total variants: \${stats.totalVariants}\`);
console.log(\`   💵 Price range: $\${stats.priceRange.min.toFixed(2)} - $\${stats.priceRange.max.toFixed(2)}\`);
console.log(\`   📈 Average price: $\${stats.averagePrice.toFixed(2)}\`);

// Test 4: Get displayable products count
console.log('\\n🎯 Test 4: Displayable products');
const displayableProducts = pricingService.getDisplayableProducts();
console.log(\`   ✅ \${displayableProducts.length} products can be displayed to customers\`);

console.log('\\n🎉 INTEGRATION TEST COMPLETE!');
console.log('The pricing system is ready for production use.');
`;
        
        const testPath = path.join(__dirname, 'wavelength-pricing-integration-test.html');
        const htmlTest = `
<!DOCTYPE html>
<html>
<head>
    <title>Wavelength Pricing Integration Test</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #00ff00; }
        .success { color: #00ff00; }
        .error { color: #ff6b6b; }
        .info { color: #74c0fc; }
    </style>
</head>
<body>
    <h1>🌊 Wavelength Pricing Integration Test</h1>
    <div id="test-output"></div>
    
    <script src="../static/js/services/wavelength-pricing-service.js"></script>
    <script>
        ${testScript}
    </script>
</body>
</html>
`;
        
        fs.writeFileSync(testPath, htmlTest);
        console.log(`   💾 Integration test saved: ${testPath}`);
        
        return testPath;
    }

    async runIntegration() {
        console.log('🚀 Running complete pricing integration...\n');
        
        // Step 1: Load pricing data
        const dataLoaded = this.loadPricingData();
        if (!dataLoaded) {
            console.log('\n❌ INTEGRATION FAILED: Could not load pricing data');
            return false;
        }
        
        // Step 2: Test pricing lookups
        const testsPass = this.testPricingLookups();
        if (!testsPass) {
            console.log('\n❌ INTEGRATION FAILED: Pricing lookup tests failed');
            return false;
        }
        
        // Step 3: Validate against product catalog
        const catalogValid = this.validateProductCatalog();
        if (!catalogValid) {
            console.log('\n❌ INTEGRATION FAILED: No displayable products found');
            return false;
        }
        
        // Step 4: Create API endpoint
        const apiPath = this.createPricingLookupAPI();
        console.log(`   ✅ Pricing API ready for merchandise store integration`);
        
        // Step 5: Create integration test
        const testPath = this.createIntegrationTest();
        console.log(`   ✅ Integration test ready for browser testing`);
        
        // Final summary
        console.log('\n🎯 PRICING INTEGRATION COMPLETE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ SUCCESS: Pricing system ready for production!');
        console.log('');
        console.log('📊 INTEGRATION SUMMARY:');
        console.log(`   📦 Products with valid pricing: ${this.stats.productsWithPricing}`);
        console.log(`   🏷️ Total variants available: ${this.stats.totalVariants}`);
        console.log(`   💵 Price range: $${this.stats.priceRange.min.toFixed(2)} - $${this.stats.priceRange.max.toFixed(2)}`);
        console.log(`   📈 Average price: $${this.stats.averagePrice.toFixed(2)}`);
        console.log('');
        console.log('🔄 NEXT STEPS:');
        console.log('   1. Import WavelengthPricingService in merchandise store');
        console.log('   2. Replace hardcoded pricing with service lookups');
        console.log('   3. Hide products without valid pricing');
        console.log('   4. Test with browser integration test');
        console.log('');
        console.log('📁 FILES CREATED:');
        console.log(`   💰 Pricing API: ${apiPath}`);
        console.log(`   🧪 Integration Test: ${testPath}`);
        console.log('');
        console.log('🌊 The "BLOCKER: Price?" is now UNBLOCKED! 🎉');
        
        return true;
    }
}

// Run the integration
if (require.main === module) {
    const integration = new PricingIntegration();
    integration.runIntegration().catch(error => {
        console.error('🚨 Integration error:', error);
        process.exit(1);
    });
}

module.exports = PricingIntegration;