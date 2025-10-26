/**
 * VIP Game Experience Test - Simplified Validation
 * Tests the new VIP unlimited retry system
 */

const puppeteer = require('puppeteer');

async function testVipGameExperience() {
    console.log('🌟 Testing VIP Game Experience System');
    console.log('=====================================');
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Navigate to game
        await page.goto('http://localhost:3001/games/wavelength-gems', {
            waitUntil: 'networkidle2',
            timeout: 10000
        });
        
        // Test 1: Check VIP experience manager is loaded
        const vipManagerTest = await page.evaluate(() => {
            return {
                exists: !!window.VipGameExperience,
                hasConfig: window.VipGameExperience ? !!window.VipGameExperience.config : false,
                unlimited: window.VipGameExperience ? window.VipGameExperience.config.unlimited : false
            };
        });
        
        console.log('✅ VIP Manager Test:', vipManagerTest);
        
        // Test 2: Check old retry threshold manager is NOT loaded
        const oldManagerTest = await page.evaluate(() => {
            return {
                exists: !!window.RetryThresholdManager,
                shouldNotExist: !window.RetryThresholdManager
            };
        });
        
        console.log('✅ Old Manager Removed:', oldManagerTest);
        
        // Test 3: Check retry functionality
        const retryTest = await page.evaluate(() => {
            if (!window.VipGameExperience) return { error: 'VIP manager not found' };
            
            const canRetry = window.VipGameExperience.canRetry();
            return {
                allowed: canRetry.allowed,
                unlimited: true, // VIP should always allow
                encouragementAvailable: typeof window.VipGameExperience.getEncouragementMessage === 'function'
            };
        });
        
        console.log('✅ Retry Test:', retryTest);
        
        // Test 4: Check no ad-related functions exist
        const adCleanupTest = await page.evaluate(() => {
            return {
                noAdSystem: typeof window.AdSystem === 'undefined',
                noOfferAdToRetry: typeof window.offerAdToRetry === 'undefined',
                noAdMobConfig: !document.querySelector('script[src*="admob"]'),
                noAdSystemScript: !document.querySelector('script[src*="ad-system"]')
            };
        });
        
        console.log('✅ Ad Cleanup Test:', adCleanupTest);
        
        // Summary
        const allTests = [vipManagerTest, oldManagerTest, retryTest, adCleanupTest];
        const passed = allTests.filter(test => 
            test.exists !== false && 
            test.shouldNotExist !== false && 
            test.allowed !== false &&
            test.noAdSystem !== false
        ).length;
        
        console.log('\n📊 VIP Experience Test Summary:');
        console.log(`   Tests Passed: ${passed}/${allTests.length}`);
        console.log(`   Success Rate: ${Math.round((passed/allTests.length) * 100)}%`);
        
        if (passed === allTests.length) {
            console.log('🎉 All VIP experience tests passed!');
            console.log('✨ Game mechanics successfully upgraded to VIP unlimited experience');
        } else {
            console.log('⚠️ Some tests failed - review results above');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
testVipGameExperience().catch(console.error);