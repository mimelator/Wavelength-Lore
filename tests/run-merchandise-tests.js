#!/usr/bin/env node
/**
 * Merchandise Store Test Runner
 * 
 * Runs both the general merchandise page test and the specific
 * category card workflow test to ensure comprehensive coverage
 * of the new category card system.
 */

const MerchandisePageBrowserTest = require('./merchandise-page-browser-test');
const MerchandiseCategoryCardBrowserTest = require('./merchandise-category-card-browser-test');

async function runMerchandiseTests() {
    console.log('🌊 WAVELENGTH MERCHANDISE STORE TEST SUITE');
    console.log('==========================================');
    console.log('Running comprehensive tests for the new category card system...\n');

    let overallSuccess = true;
    const results = {
        general: null,
        categoryCards: null
    };

    try {
        // Test 1: General merchandise page functionality
        console.log('📋 PHASE 1: General Merchandise Page Test');
        console.log('─'.repeat(50));
        
        const generalTest = new MerchandisePageBrowserTest();
        results.general = await generalTest.runAllTests();
        
        if (results.general) {
            console.log('✅ General merchandise test PASSED');
        } else {
            console.log('❌ General merchandise test FAILED');
            overallSuccess = false;
        }

        // Wait between tests
        console.log('\n⏳ Waiting 3 seconds before category card test...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Test 2: Category card specific workflow
        console.log('🎴 PHASE 2: Category Card Workflow Test');
        console.log('─'.repeat(50));
        
        const categoryTest = new MerchandiseCategoryCardBrowserTest();
        results.categoryCards = await categoryTest.runAllTests();
        
        if (results.categoryCards) {
            console.log('✅ Category card test PASSED');
        } else {
            console.log('❌ Category card test FAILED');
            overallSuccess = false;
        }

    } catch (error) {
        console.error('💥 Test suite execution failed:', error);
        overallSuccess = false;
    }

    // Final results
    console.log('\n' + '='.repeat(70));
    console.log('🏁 FINAL MERCHANDISE STORE TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`📋 General Page Test: ${results.general ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🎴 Category Cards Test: ${results.categoryCards ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🎯 Overall Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (overallSuccess) {
        console.log('\n🎉 MERCHANDISE STORE IS FULLY FUNCTIONAL!');
        console.log('✅ Page loads correctly');
        console.log('✅ Authentication works');
        console.log('✅ Gallery images load and can be selected');
        console.log('✅ Category cards display with stats and descriptions');
        console.log('✅ Category selection navigates to products');
        console.log('✅ Products display within categories');
        console.log('✅ Back navigation works between views');
        console.log('✅ Product selection workflow completes');
        console.log('✅ Mobile responsive design works');
        console.log('✅ No unintended API calls');
    } else {
        console.log('\n⚠️  SOME ISSUES DETECTED');
        console.log('Please review the detailed test output above.');
        console.log('Common issues to check:');
        console.log('- Server running on http://localhost:3001');
        console.log('- User authentication working');
        console.log('- Category card JavaScript loading');
        console.log('- CSS styles applied correctly');
        console.log('- Product catalog API responding');
    }

    console.log('\n💡 TO TEST MANUALLY:');
    console.log('1. Visit http://localhost:3001/merchandise');
    console.log('2. Select an image from the gallery');
    console.log('3. Verify category cards appear with icons and stats');
    console.log('4. Click a category card');
    console.log('5. Verify products display for that category');
    console.log('6. Click "Back to Categories" button');
    console.log('7. Try selecting a different category');
    console.log('8. Select a specific product');

    return overallSuccess;
}

// Run the test suite
if (require.main === module) {
    runMerchandiseTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Fatal error:', error);
            process.exit(1);
        });
}

module.exports = runMerchandiseTests;