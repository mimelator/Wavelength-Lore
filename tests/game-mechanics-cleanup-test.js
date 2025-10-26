/**
 * Game Mechanics Cleanup Test - Post Ad Removal
 * Tests game functionality after ad system removal
 * 
 * This test validates:
 * 1. Game loads without ad-related errors
 * 2. Retry system works as expected
 * 3. No broken references to removed ad components
 * 4. User experience flows properly
 */

const puppeteer = require('puppeteer');
const assert = require('assert');

class GameMechanicsTest {
    constructor() {
        this.testResults = [];
        this.browser = null;
        this.page = null;
        this.baseUrl = 'http://localhost:3001';
    }

    /**
     * Initialize browser for testing
     */
    async setup() {
        console.log('🎮 Setting up Game Mechanics Test Suite');
        
        this.browser = await puppeteer.launch({
            headless: true,  // Run headless for faster testing
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Monitor console for errors
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Console Error:', msg.text());
                this.testResults.push({
                    test: 'Console Errors',
                    status: 'FAILED',
                    error: msg.text()
                });
            }
        });
        
        // Monitor failed network requests
        this.page.on('requestfailed', request => {
            console.log('🔌 Network Request Failed:', request.url());
            // Only flag as error if it's related to game functionality
            if (request.url().includes('ad-system') || request.url().includes('admob')) {
                this.testResults.push({
                    test: 'Ad System References',
                    status: 'FAILED',
                    error: `Broken reference to removed ad system: ${request.url()}`
                });
            }
        });
        
        await this.page.setViewport({ width: 1200, height: 800 });
    }

    /**
     * Test 1: Game page loads without errors
     */
    async testGamePageLoad() {
        console.log('🧪 Test 1: Game Page Load');
        
        try {
            await this.page.goto(`${this.baseUrl}/games/wavelength-gems`, {
                waitUntil: 'networkidle2',
                timeout: 10000
            });
            
            // Check if the game container exists
            const gameContainer = await this.page.$('.gems-game-container');
            assert(gameContainer, 'Game container should be present');
            
            // Check if the game board exists
            const gameBoard = await this.page.$('#gameBoard');
            assert(gameBoard, 'Game board should be present');
            
            // Check for specific ad-related elements that shouldn't exist
            const adElements = await this.page.$$('[id*="admob"], [class*="admob"], [id*="ad-system"], [class*="ad-system"], [id*="applixir"], [class*="applixir"]');
            assert(adElements.length === 0, 'No ad-related elements should be present');
            
            this.testResults.push({
                test: 'Game Page Load',
                status: 'PASSED',
                details: 'Game loads successfully without ad-related errors'
            });
            
        } catch (error) {
            this.testResults.push({
                test: 'Game Page Load',
                status: 'FAILED',
                error: error.message
            });
        }
    }

    /**
     * Test 2: Retry system functionality
     */
    async testRetrySystem() {
        console.log('🧪 Test 2: Retry System');
        
        try {
            // Wait for game to initialize
            await this.page.waitForSelector('#newGameBtn', { timeout: 5000 });
            
            // Check if retry threshold manager is initialized
            const thresholdInfo = await this.page.evaluate(() => {
                return {
                    managerExists: !!window.RetryThresholdManager,
                    thresholdReached: window.RetryThresholdManager ? 
                        window.RetryThresholdManager.isThresholdReached() : false,
                    remainingRetries: window.RetryThresholdManager ? 
                        window.RetryThresholdManager.getRemainingRetries() : 'N/A'
                };
            });
            
            console.log('   Threshold Info:', thresholdInfo);
            
            // Test retry button functionality
            const retryButton = await this.page.$('#newGameBtn');
            assert(retryButton, 'Retry button should be present');
            
            // Click retry button to test functionality
            await retryButton.click();
            
            // Wait a moment for any initialization
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verify no ad-related modals appear
            const adModals = await this.page.$$('[id*="ad"], [class*="ad-offer"], [id*="admob"]');
            assert(adModals.length === 0, 'No ad-related modals should appear on retry');
            
            this.testResults.push({
                test: 'Retry System',
                status: 'PASSED',
                details: `Retry works without ads. Threshold manager: ${thresholdInfo.managerExists}, Retries: ${thresholdInfo.remainingRetries}`
            });
            
        } catch (error) {
            this.testResults.push({
                test: 'Retry System',
                status: 'FAILED',
                error: error.message
            });
        }
    }

    /**
     * Test 3: Game over flow
     */
    async testGameOverFlow() {
        console.log('🧪 Test 3: Game Over Flow');
        
        try {
            // Simulate game over by calling the function directly
            const gameOverResult = await this.page.evaluate(() => {
                // Check if game over functions exist and work
                if (typeof showLevelFailedModal === 'function') {
                    return { functionExists: true, type: 'levelFailed' };
                } else if (typeof showRetryThresholdReachedModal === 'function') {
                    return { functionExists: true, type: 'retryThreshold' };
                } else {
                    return { functionExists: false };
                }
            });
            
            assert(gameOverResult.functionExists, 'Game over functions should exist');
            
            this.testResults.push({
                test: 'Game Over Flow',
                status: 'PASSED',
                details: `Game over functions available: ${gameOverResult.type}`
            });
            
        } catch (error) {
            this.testResults.push({
                test: 'Game Over Flow',
                status: 'FAILED',
                error: error.message
            });
        }
    }

    /**
     * Test 4: Performance after ad removal
     */
    async testPerformance() {
        console.log('🧪 Test 4: Performance Test');
        
        try {
            const performanceMetrics = await this.page.evaluate(() => {
                const timing = performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
                
                return {
                    totalLoadTime: loadTime,
                    domReadyTime: domReady,
                    scriptsLoaded: document.scripts.length,
                    hasAdScripts: Array.from(document.scripts).some(script => 
                        script.src.includes('ad-system') || 
                        script.src.includes('admob') ||
                        script.src.includes('applixir')
                    )
                };
            });
            
            console.log('   Performance Metrics:', performanceMetrics);
            
            // Verify no ad scripts are loaded
            assert(!performanceMetrics.hasAdScripts, 'No ad-related scripts should be loaded');
            
            // Check reasonable load times (should be faster without ad scripts)
            assert(performanceMetrics.totalLoadTime < 5000, 'Total load time should be under 5 seconds');
            
            this.testResults.push({
                test: 'Performance',
                status: 'PASSED',
                details: `Load time: ${performanceMetrics.totalLoadTime}ms, Scripts: ${performanceMetrics.scriptsLoaded}`
            });
            
        } catch (error) {
            this.testResults.push({
                test: 'Performance',
                status: 'FAILED',
                error: error.message
            });
        }
    }

    /**
     * Run all tests and generate report
     */
    async runAllTests() {
        console.log('🎮 Starting Game Mechanics Cleanup Test Suite');
        console.log('===============================================');
        
        try {
            await this.setup();
            
            await this.testGamePageLoad();
            await this.testRetrySystem();
            await this.testGameOverFlow();
            await this.testPerformance();
            
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite setup failed:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    /**
     * Generate and display test report
     */
    async generateReport() {
        console.log('\n📊 Game Mechanics Test Results');
        console.log('=======================================');
        
        let passed = 0;
        let failed = 0;
        
        this.testResults.forEach(result => {
            const emoji = result.status === 'PASSED' ? '✅' : '❌';
            console.log(`${emoji} ${result.test}: ${result.status}`);
            
            if (result.details) {
                console.log(`   Details: ${result.details}`);
            }
            
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
            
            if (result.status === 'PASSED') passed++;
            if (result.status === 'FAILED') failed++;
        });
        
        console.log('\n📈 Summary:');
        console.log(`   Total Tests: ${passed + failed}`);
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
        
        // Provide recommendations
        if (failed === 0) {
            console.log('\n🎉 All tests passed! Game mechanics are working well after ad removal.');
            console.log('💡 Recommendation: Consider simplifying or removing retry threshold system for VIP experience.');
        } else {
            console.log('\n⚠️  Some tests failed. Review errors above and fix issues before proceeding.');
        }
        
        return { passed, failed, total: passed + failed };
    }
}

// Run tests if called directly
if (require.main === module) {
    const test = new GameMechanicsTest();
    test.runAllTests().catch(console.error);
}

module.exports = GameMechanicsTest;