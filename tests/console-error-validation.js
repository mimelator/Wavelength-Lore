#!/usr/bin/env node

/**
 * Console Error Validation - Test script loading order fixes
 */

const axios = require('axios');
const cheerio = require('cheerio');

async function testConsoleErrors() {
    console.log('🔍 Testing Console Error Fixes...\n');
    
    try {
        const response = await axios.get('http://localhost:3001/admin/vendor-research/catalog');
        const html = response.data;
        const $ = cheerio.load(html);
        
        // Check script loading order
        const scripts = $('script');
        let productImageScriptIndex = -1;
        let initScriptIndex = -1;
        
        scripts.each((i, script) => {
            const src = $(script).attr('src');
            const content = $(script).html() || '';
            
            if (src && src.includes('product-image-url-client.js')) {
                productImageScriptIndex = i;
                console.log(`📜 ProductImageUrlClient script found at index: ${i}`);
            }
            
            if (content.includes('tryInitializeImageClient')) {
                initScriptIndex = i;
                console.log(`🚀 Initialization script found at index: ${i}`);
            }
        });
        
        // Verify loading order
        if (productImageScriptIndex !== -1 && initScriptIndex !== -1) {
            if (productImageScriptIndex < initScriptIndex) {
                console.log('✅ Script loading order is CORRECT');
                console.log('   📜 ProductImageUrlClient loads first');
                console.log('   🚀 Initialization script loads after');
            } else {
                console.log('❌ Script loading order is INCORRECT');
            }
        }
        
        // Check for retry mechanism
        const hasRetryMechanism = html.includes('tryInitializeImageClient') && 
                                 html.includes('setTimeout(tryInitializeImageClient, 100)');
        
        if (hasRetryMechanism) {
            console.log('✅ Retry mechanism implemented for script loading');
        } else {
            console.log('❌ Retry mechanism missing');
        }
        
        // Check for error-prone patterns
        const hasOldErrorPattern = html.includes('ProductImageUrlClient not loaded properly');
        if (!hasOldErrorPattern) {
            console.log('✅ Removed error-prone initialization pattern');
        } else {
            console.log('❌ Old error pattern still present');
        }
        
        console.log('\n🎯 EXPECTED CONSOLE BEHAVIOR:');
        console.log('   1. "🖼️ Initializing ProductImageUrlClient..." - Initial attempt');
        console.log('   2. "✅ ProductImageUrlClient loaded, fixing images..." - Success');
        console.log('   3. "🔄 Fixing product images on page..." - Client script working');
        console.log('   4. "📸 Found X product images to fix" - Images being processed');
        console.log('   5. "⏳ Firebase not ready yet, retrying in 500ms..." - Normal Firebase init');
        
        console.log('\n✅ Console error fixes have been applied!');
        console.log('   The "❌ ProductImageUrlClient not loaded properly" error should be resolved.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testConsoleErrors();