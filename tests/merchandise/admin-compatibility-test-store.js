#!/usr/bin/env node

/**
 * ADMIN COMPATIBILITY TEST STORE
 * 
 * Creates products in a separate admin-only test store for compatibility testing
 * Products are tagged as "compatibility-test" and can be viewed/managed separately
 */

require('dotenv').config();

async function adminCompatibilityTestStore() {
    console.log('🧪 ADMIN COMPATIBILITY TEST STORE');
    console.log('==================================\n');

    const testResults = {
        tested: 0,
        working: [],
        failed: [],
        testProducts: [] // Products created for admin review
    };

    try {
        // Initialize services
        console.log('1️⃣ Initializing services...');
        const EnhancedPrintifyService = require('../../services/enhanced-printify-service');
        const printifyService = new EnhancedPrintifyService();
        console.log('   ✅ Service initialized');

        // Get test image
        console.log('\n2️⃣ Preparing test image...');
        const axios = require('axios');
        const userId = '4fdbYxJHjEP4xksk9sgFE3lgYUs2';
        
        const galleryResponse = await axios.get('http://localhost:3001/api/gallery/user/images', {
            headers: {
                'X-User-ID': userId,
                'X-API-Request': 'admin-compatibility-test'
            }
        });
        
        const firstImage = galleryResponse.data.images[0];
        const imageResponse = await axios.get(firstImage.url, {
            responseType: 'arraybuffer',
            timeout: 10000
        });
        const imageBuffer = Buffer.from(imageResponse.data);
        console.log(`   ✅ Test image ready: ${Math.round(imageBuffer.length / 1024)}KB`);

        // Key combinations to test (limited set for admin store)
        const testCombinations = [
            // Known working combinations
            { blueprintId: 5, vendorId: 1, name: 'Cotton Tee + Printful', expected: 'WORKING' },
            { blueprintId: 5, vendorId: 3, name: 'Cotton Tee + Marco Fine Arts', expected: 'WORKING' },
            { blueprintId: 6, vendorId: 1, name: 'Heavy Tee + Printful', expected: 'WORKING' },
            
            // Potentially problematic combinations
            { blueprintId: 68, vendorId: 3, name: 'Mug + Marco Fine Arts', expected: 'UNKNOWN' },
            { blueprintId: 77, vendorId: 3, name: 'Hoodie + Marco Fine Arts', expected: 'UNKNOWN' },
            { blueprintId: 97, vendorId: 1, name: 'Poster + Printful', expected: 'UNKNOWN' }
        ];

        console.log(`\n3️⃣ Creating ${testCombinations.length} test products in admin store...`);
        console.log('   ⚠️  These will be tagged as "compatibility-test" for admin review');

        for (let i = 0; i < testCombinations.length; i++) {
            const combo = testCombinations[i];
            const progress = Math.round(((i + 1) / testCombinations.length) * 100);
            
            console.log(`\n📦 [${progress}%] Testing: ${combo.name}`);
            
            try {
                // Upload image with unique name
                const uploadResult = await printifyService.uploadImage(
                    imageBuffer,
                    `admin-compat-${combo.blueprintId}-${combo.vendorId}-${Date.now()}.png`,
                    `Admin compatibility test: ${combo.name}`
                );

                if (uploadResult.success) {
                    console.log(`   ✅ Image uploaded: ${uploadResult.imageId}`);

                    // Create product with admin-specific tags and title
                    const productResult = await printifyService.createCustomProductWithBlueprint(uploadResult.imageId, {
                        title: `[ADMIN TEST] ${combo.name} - Compatibility Check`,
                        description: `Admin compatibility test product. Blueprint ${combo.blueprintId} + Provider ${combo.vendorId}. Expected: ${combo.expected}. Created: ${new Date().toISOString()}`,
                        blueprintId: combo.blueprintId,
                        printProviderId: combo.vendorId,
                        basePrice: 1500, // Lower price for test products
                        tags: [
                            'compatibility-test',
                            'admin-only', 
                            'do-not-sell',
                            `blueprint-${combo.blueprintId}`,
                            `vendor-${combo.vendorId}`,
                            `expected-${combo.expected.toLowerCase()}`
                        ]
                    });

                    if (productResult.productId) {
                        console.log(`   ✅ Product created: ${productResult.productId}`);
                        console.log(`   🔗 Admin URL: http://localhost:3001/admin/compatibility-test/${productResult.productId}`);
                        
                        const testProduct = {
                            ...combo,
                            status: 'SUCCESS',
                            productId: productResult.productId,
                            imageId: uploadResult.imageId,
                            adminUrl: `http://localhost:3001/admin/compatibility-test/${productResult.productId}`,
                            createdAt: new Date().toISOString()
                        };
                        
                        testResults.working.push(testProduct);
                        testResults.testProducts.push(testProduct);
                        
                        // Store in admin database for tracking
                        await storeAdminTestProduct(testProduct);
                        
                    } else {
                        throw new Error('No product ID returned');
                    }

                } else {
                    console.log(`   ❌ Image upload failed: ${uploadResult.error}`);
                    testResults.failed.push({
                        ...combo,
                        status: 'UPLOAD_FAILED',
                        error: uploadResult.error
                    });
                }

            } catch (error) {
                console.log(`   ❌ Failed: ${error.message}`);
                testResults.failed.push({
                    ...combo,
                    status: 'FAILED',
                    error: error.message,
                    errorCode: error.response?.data?.code || 'UNKNOWN'
                });
            }

            testResults.tested++;
            
            // Delay between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Generate admin report
        console.log('\n📊 ADMIN COMPATIBILITY TEST RESULTS');
        console.log('===================================');
        
        console.log(`\n📈 SUMMARY:`);
        console.log(`   Total Tests: ${testResults.tested}`);
        console.log(`   ✅ Successful Products: ${testResults.working.length}`);
        console.log(`   ❌ Failed Tests: ${testResults.failed.length}`);
        
        if (testResults.working.length > 0) {
            console.log(`\n✅ CREATED TEST PRODUCTS (Admin Review):`);
            testResults.working.forEach(product => {
                console.log(`   • ${product.name}`);
                console.log(`     Product ID: ${product.productId}`);
                console.log(`     Admin URL: ${product.adminUrl}`);
                console.log(`     Expected: ${product.expected}, Result: ${product.status}`);
                console.log('');
            });
        }

        if (testResults.failed.length > 0) {
            console.log(`\n❌ FAILED COMBINATIONS:`);
            testResults.failed.forEach(failure => {
                console.log(`   • ${failure.name}: ${failure.error}`);
            });
        }

        // Create admin dashboard entry
        await createAdminDashboardEntry(testResults);

        console.log(`\n🎯 ADMIN ACTIONS AVAILABLE:`);
        console.log(`   1. View all test products: http://localhost:3001/admin/compatibility-tests`);
        console.log(`   2. Review individual products using the URLs above`);
        console.log(`   3. Delete test products when done: http://localhost:3001/admin/cleanup-tests`);
        console.log(`   4. Export compatibility matrix: http://localhost:3001/admin/export-compatibility`);

        console.log(`\n💡 NEXT STEPS:`);
        console.log(`   • Review test products in admin interface`);
        console.log(`   • Verify mockup quality and variant availability`);
        console.log(`   • Update compatibility matrix based on results`);
        console.log(`   • Clean up test products when analysis is complete`);

    } catch (error) {
        console.error('❌ Admin test failed:', error.message);
    } finally {
        // Don't auto-cleanup - leave for admin review
        setTimeout(() => {
            console.log('\n✅ Admin compatibility test complete');
            console.log('   Test products left in store for admin review');
            process.exit(0);
        }, 2000);
    }
}

/**
 * Store test product info in admin database for tracking
 */
async function storeAdminTestProduct(testProduct) {
    try {
        const { initializeFirebaseAdmin } = require('../../helpers/firebase-admin-utils');
        initializeFirebaseAdmin();
        const admin = require('firebase-admin');
        const db = admin.app('admin').database();
        
        await db.ref(`admin/compatibility-tests/${testProduct.productId}`).set({
            ...testProduct,
            storedAt: new Date().toISOString()
        });
        
        console.log(`   💾 Stored in admin database`);
    } catch (error) {
        console.warn(`   ⚠️ Failed to store in admin DB: ${error.message}`);
    }
}

/**
 * Create admin dashboard entry for easy access
 */
async function createAdminDashboardEntry(testResults) {
    try {
        const { initializeFirebaseAdmin } = require('../../helpers/firebase-admin-utils');
        initializeFirebaseAdmin();
        const admin = require('firebase-admin');
        const db = admin.app('admin').database();
        
        const dashboardEntry = {
            testRunId: `compat-test-${Date.now()}`,
            createdAt: new Date().toISOString(),
            summary: {
                totalTested: testResults.tested,
                successful: testResults.working.length,
                failed: testResults.failed.length
            },
            products: testResults.testProducts,
            status: 'READY_FOR_REVIEW'
        };
        
        await db.ref(`admin/compatibility-test-runs/${dashboardEntry.testRunId}`).set(dashboardEntry);
        
        console.log(`   📋 Admin dashboard entry created: ${dashboardEntry.testRunId}`);
    } catch (error) {
        console.warn(`   ⚠️ Failed to create dashboard entry: ${error.message}`);
    }
}

adminCompatibilityTestStore();