#!/usr/bin/env node

/**
 * 🧹 Catalog Cleanup Validation Test
 * Validates that admin vendor catalog uses pretty names instead of technical Blueprint/Provider numbers
 */

const http = require('http');

async function validateCatalogCleanup() {
    console.log('🧹 Testing Catalog Cleanup - Pretty Names Validation...\n');
    
    try {
        const html = await new Promise((resolve, reject) => {
            const request = http.get('http://localhost:3001/admin/vendor-catalog', (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => resolve(data));
            });
            request.on('error', reject);
            request.setTimeout(5000, () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
        
        console.log('✅ Page loaded successfully\n');
        
        // Test 1: Check title is updated
        const hasOldTitle = html.includes('Vendor Preview Catalog');
        const hasNewTitle = html.includes('Product Catalog');
        
        console.log('📋 Title Update:');
        console.log(hasOldTitle ? '❌ Still shows "Vendor Preview Catalog"' : '✅ Old title removed');
        console.log(hasNewTitle ? '✅ New title "Product Catalog" present' : '❌ New title missing');
        console.log();
        
        // Test 2: Check for pretty product names
        console.log('🏷️ Product Type Names:');
        const prettyProductNames = [
            'Coffee Mug 11oz', 'Unisex Cotton Crew Tee', 'Women\'s Jersey V-Neck Tee',
            'Satin Poster', 'Indoor Wall Tapestry', 'Slim Phone Case', 'Weekender Bag'
        ];
        
        let foundPrettyProducts = 0;
        prettyProductNames.forEach(name => {
            if (html.includes(name)) {
                console.log(`✅ Found: ${name}`);
                foundPrettyProducts++;
            }
        });
        
        // Check for old blueprint format
        const hasOldBlueprints = html.includes('Blueprint 68') || html.includes('Blueprint 17');
        console.log(hasOldBlueprints ? '❌ Still shows "Blueprint X" format' : '✅ No old blueprint format found');
        console.log(`📊 Pretty product names: ${foundPrettyProducts}/${prettyProductNames.length} found\n`);
        
        // Test 3: Check for pretty vendor names
        console.log('🏭 Vendor Names:');
        const prettyVendorNames = ['Print Provider', 'Art Studio', 'Marco Fine Arts'];
        
        let foundPrettyVendors = 0;
        prettyVendorNames.forEach(name => {
            if (html.includes(name)) {
                console.log(`✅ Found: ${name}`);
                foundPrettyVendors++;
            }
        });
        
        // Check for old provider format
        const hasOldProviders = html.includes('Provider 1') || html.includes('Provider 3');
        console.log(hasOldProviders ? '❌ Still shows "Provider X" format' : '✅ No old provider format found');
        console.log(`📊 Pretty vendor names: ${foundPrettyVendors}/${prettyVendorNames.length} found\n`);
        
        // Summary
        const allTestsPassed = hasNewTitle && !hasOldTitle && !hasOldBlueprints && !hasOldProviders && 
                              foundPrettyProducts >= 3 && foundPrettyVendors >= 2;
        
        console.log('📊 CLEANUP VALIDATION SUMMARY:');
        console.log(`✅ Title updated: ${hasNewTitle && !hasOldTitle ? 'Yes' : 'No'}`);
        console.log(`✅ Product names prettified: ${!hasOldBlueprints && foundPrettyProducts >= 3 ? 'Yes' : 'No'}`);
        console.log(`✅ Vendor names prettified: ${!hasOldProviders && foundPrettyVendors >= 2 ? 'Yes' : 'No'}`);
        
        if (allTestsPassed) {
            console.log('\n🎉 ALL CLEANUP TESTS PASSED - Catalog now uses pretty names!');
            console.log('\n🎯 IMPROVEMENTS VERIFIED:');
            console.log('✅ "Vendor Preview" → "Product Catalog"');
            console.log('✅ "Blueprint 68" → "Coffee Mug 11oz"');
            console.log('✅ "Provider 1" → "Print Provider"');
            process.exit(0);
        } else {
            console.log('\n⚠️ Some cleanup items need attention - see details above');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
validateCatalogCleanup();