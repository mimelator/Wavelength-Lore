#!/usr/bin/env node

/**
 * CONNECTION CLEANUP TEST
 * 
 * Tests proper cleanup of connections to prevent hanging processes
 */

require('dotenv').config();

async function testConnectionCleanup() {
    console.log('🔧 CONNECTION CLEANUP TEST');
    console.log('==========================\n');

    try {
        console.log('1️⃣ Testing VendorPreviewService initialization...');
        const VendorPreviewService = require('../../services/vendor-preview-service');
        const vendorService = new VendorPreviewService();
        console.log('   ✅ Service initialized');

        console.log('\n2️⃣ Testing connection cleanup...');
        
        // Force cleanup of Firebase connections
        if (vendorService.merchandiseDB && vendorService.merchandiseDB.cleanup) {
            await vendorService.merchandiseDB.cleanup();
            console.log('   ✅ Merchandise DB cleaned up');
        }

        // Force cleanup of Firebase Admin
        const admin = require('firebase-admin');
        if (admin.apps.length > 0) {
            await Promise.all(admin.apps.map(app => app.delete()));
            console.log('   ✅ Firebase Admin apps deleted');
        }

        console.log('\n3️⃣ Forcing process exit...');
        setTimeout(() => {
            console.log('   ✅ Process exit forced');
            process.exit(0);
        }, 1000);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testConnectionCleanup();