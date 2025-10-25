#!/usr/bin/env node

/**
 * Catalog Cleanup Validation - Isolation Script Compatible
 * Validates that admin vendor catalog uses pretty names instead of technical ones
 */

const http = require('http');

const BASE_URL = process.argv.includes('--prod') ? 'https://wavelengthlore.com' : 'http://localhost:3001';
const TEST_URL = `${BASE_URL}/admin/vendor-catalog`;

async function fetchPageContent() {
    return new Promise((resolve, reject) => {
        const client = BASE_URL.startsWith('https') ? require('https') : http;
        
        const request = client.get(TEST_URL, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => resolve(data));
        });
        
        request.on('error', reject);
        request.setTimeout(10000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function validateCatalogCleanup() {
    console.log('🧹 Catalog Cleanup Validation');
    console.log(`🌐 Testing: ${TEST_URL}\n`);
    
    try {
        const html = await fetchPageContent();
        
        let passed = 0;
        let failed = 0;
        
        // Test 1: Title cleanup
        const hasOldTitle = html.includes('Vendor Preview Catalog');
        const hasNewTitle = html.includes('Product Catalog');
        
        if (hasNewTitle && !hasOldTitle) {
            console.log('✅ Title updated: "Vendor Preview" → "Product Catalog"');
            passed++;
        } else {
            console.log('❌ Title not updated properly');
            failed++;
        }\n        \n        // Test 2: Product type names\n        const hasOldBlueprints = html.includes('Blueprint 68') || html.includes('Blueprint 17');\n        const hasPrettyProducts = html.includes('Coffee Mug 11oz') && html.includes('Unisex Cotton Crew Tee');\n        \n        if (!hasOldBlueprints && hasPrettyProducts) {\n            console.log('✅ Product types: "Blueprint X" → Pretty names');\n            passed++;\n        } else {\n            console.log('❌ Product types still use technical names');\n            failed++;\n        }\n        \n        // Test 3: Vendor names\n        const hasOldProviders = html.includes('Provider 1') || html.includes('Provider 3');\n        const hasPrettyVendors = html.includes('Print Provider') && html.includes('Art Studio');\n        \n        if (!hasOldProviders && hasPrettyVendors) {\n            console.log('✅ Vendor names: "Provider X" → Pretty names');\n            passed++;\n        } else {\n            console.log('❌ Vendor names still use technical format');\n            failed++;\n        }\n        \n        // Test 4: Filter dropdowns\n        const hasFilterUpdates = html.includes('Coffee Mug 11oz (') || html.includes('Print Provider (');\n        \n        if (hasFilterUpdates) {\n            console.log('✅ Filter dropdowns use pretty names');\n            passed++;\n        } else {\n            console.log('❌ Filter dropdowns still use technical names');\n            failed++;\n        }\n        \n        console.log(`\\nOverall: ${passed}/${passed + failed} cleanup items working`);\n        \n        if (failed === 0) {\n            console.log('\\n🎉 Catalog cleanup validation PASSED!');\n            process.exit(0);\n        } else {\n            console.log('\\n⚠️ Catalog cleanup validation found issues');\n            process.exit(1);\n        }\n        \n    } catch (error) {\n        console.error('❌ Catalog cleanup validation failed:', error.message);\n        process.exit(2);\n    }\n}\n\n// Run validation\nvalidateCatalogCleanup();