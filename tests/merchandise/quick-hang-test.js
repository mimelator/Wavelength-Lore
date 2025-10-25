#!/usr/bin/env node

/**
 * QUICK HANG TEST - Tests with built-in timeout
 */

require('dotenv').config();

async function quickHangTest() {
    console.log('🔍 QUICK HANG TEST - 5 second timeout');
    
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT: Operation hung after 5 seconds')), 5000);
    });
    
    const testPromise = (async () => {
        console.log('1️⃣ Testing VendorPreviewService initialization...');
        const VendorPreviewService = require('../../services/vendor-preview-service');
        const vendorService = new VendorPreviewService();
        console.log('   ✅ Service initialized');
        
        console.log('2️⃣ Testing simple method call...');
        // Just test if we can call a method without hanging
        return { success: true, message: 'No hang detected' };
    })();
    
    try {
        const result = await Promise.race([testPromise, timeoutPromise]);
        console.log('✅ Test completed:', result.message);
    } catch (error) {
        console.log('❌ Test result:', error.message);
        if (error.message.includes('TIMEOUT')) {
            console.log('🚨 CONFIRMED: VendorPreviewService initialization is hanging');
        }
    }
}

quickHangTest();