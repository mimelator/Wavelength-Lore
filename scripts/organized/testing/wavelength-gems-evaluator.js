#!/usr/bin/env node

/**
 * Wavelength Gems Server-Side Test Executor
 * Executes tests via server-side evaluation and captures results
 */

const puppeteer = require('puppeteer');

async function executeWavelengthGemsTests() {
    console.log('🎮 Wavelength Gems Test Execution & Evaluation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let browser;
    try {
        // Launch browser in headless mode for faster execution
        console.log('🚀 Launching browser...');
        browser = await puppeteer.launch({ 
            headless: true, // Headless for server execution
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set viewport for consistent testing
        await page.setViewport({ width: 1200, height: 800 });
        
        // Navigate to Wavelength Gems
        console.log('🔗 Loading Wavelength Gems game...');
        await page.goto('http://localhost:3001/games/wavelength-gems', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        // Wait for game initialization
        console.log('⏳ Waiting for game and test suites to load...');
        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
        
        // Wait a bit longer for our test suites to initialize
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if test suites are available
        console.log('🔍 Checking test suite availability...');
        const testSuitesStatus = await page.evaluate(() => {
            return {
                masterSuite: typeof runAllWavelengthGemsTests === 'function',
                mobileSuite: typeof WavelengthGemsMobileTests !== 'undefined',
                desktopSuite: typeof WavelengthGemsDesktopTests !== 'undefined',
                mechanicsSuite: typeof WavelengthGemsGameMechanicsTests !== 'undefined',
                uiSuite: typeof WavelengthGemsUIPolishTests !== 'undefined',
                gameEngine: typeof window.WavelengthGemsEngine !== 'undefined',
                canvas: document.querySelector('#game-board') !== null
            };
        });
        
        console.log('📊 Test Suite Status:', testSuitesStatus);
        
        if (!testSuitesStatus.masterSuite) {
            console.log('⚠️ Master test suite not available, attempting individual suite execution...');
        }
        
        // Execute tests and capture results
        console.log('🧪 Executing comprehensive test suites...');
        
        const testResults = await page.evaluate(async () => {
            const results = {
                timestamp: new Date().toISOString(),
                testSuites: {},
                summary: {
                    totalTests: 0,
                    passedTests: 0,
                    failedTests: 0,
                    criticalIssues: [],
                    recommendations: []
                }
            };
            
            // Helper function to safely execute tests
            const safeExecuteTest = async (testName, testFunction) => {
                try {
                    console.log(`Running ${testName}...`);
                    const result = await testFunction();
                    return { success: true, result };
                } catch (error) {
                    console.error(`Error in ${testName}:`, error);
                    return { success: false, error: error.message };
                }
            };
            
            // Execute Mobile Tests
            if (typeof WavelengthGemsMobileTests !== 'undefined') {
                const mobileTests = new WavelengthGemsMobileTests();
                const mobileResult = await safeExecuteTest('Mobile Tests', 
                    () => mobileTests.runAllMobileTests());
                results.testSuites.mobile = mobileResult;
            }
            
            // Execute Desktop Tests  
            if (typeof WavelengthGemsDesktopTests !== 'undefined') {
                const desktopTests = new WavelengthGemsDesktopTests();
                const desktopResult = await safeExecuteTest('Desktop Tests',
                    () => desktopTests.runAllDesktopTests());
                results.testSuites.desktop = desktopResult;
            }
            
            // Execute Game Mechanics Tests
            if (typeof WavelengthGemsGameMechanicsTests !== 'undefined') {
                const mechanicsTests = new WavelengthGemsGameMechanicsTests();
                const mechanicsResult = await safeExecuteTest('Game Mechanics Tests',
                    () => mechanicsTests.runAllMechanicsTests());
                results.testSuites.mechanics = mechanicsResult;
            }
            
            // Execute UI Polish Tests
            if (typeof WavelengthGemsUIPolishTests !== 'undefined') {
                const uiTests = new WavelengthGemsUIPolishTests();
                const uiResult = await safeExecuteTest('UI Polish Tests',
                    () => uiTests.runAllPolishTests());
                results.testSuites.ui = uiResult;
            }
            
            // Try master test suite if available
            if (typeof runAllWavelengthGemsTests === 'function') {
                const masterResult = await safeExecuteTest('Master Test Suite',
                    () => runAllWavelengthGemsTests());
                results.testSuites.master = masterResult;
            }
            
            return results;
        });
        
        // Evaluate and display results
        console.log('\n📊 WAVELENGTH GEMS TEST RESULTS EVALUATION');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        let totalTests = 0;
        let successfulSuites = 0;
        let criticalIssues = [];
        let recommendations = [];
        
        // Evaluate each test suite
        Object.entries(testResults.testSuites).forEach(([suiteName, result]) => {
            totalTests++;
            
            if (result.success) {
                successfulSuites++;
                console.log(`✅ ${suiteName.toUpperCase()} Tests: PASSED`);
                
                // Extract insights from successful results
                if (result.result && result.result.recommendations) {
                    recommendations.push(...result.result.recommendations);
                }
            } else {
                console.log(`❌ ${suiteName.toUpperCase()} Tests: FAILED - ${result.error}`);
                criticalIssues.push(`${suiteName} suite failed: ${result.error}`);
            }
        });
        
        // Generate evaluation summary
        const successRate = totalTests > 0 ? (successfulSuites / totalTests * 100).toFixed(1) : 0;
        
        console.log('\n🎯 EVALUATION SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 Overall Success Rate: ${successRate}% (${successfulSuites}/${totalTests} suites)`);
        console.log(`🎮 Game Status: ${testSuitesStatus.gameEngine ? '✅ Engine Loaded' : '❌ Engine Missing'}`);
        console.log(`🎨 Canvas Status: ${testSuitesStatus.canvas ? '✅ Game Board Present' : '❌ Canvas Missing'}`);
        
        if (criticalIssues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES IDENTIFIED:');
            criticalIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        
        if (recommendations.length > 0) {
            console.log('\n💡 UI POLISH RECOMMENDATIONS:');
            recommendations.slice(0, 10).forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        
        // Baseline establishment status
        console.log('\n📈 BASELINE ESTABLISHMENT STATUS:');
        if (successRate >= 80) {
            console.log('✅ BASELINE ESTABLISHED - Ready for UI polish implementation');
        } else if (successRate >= 50) {
            console.log('⚠️ PARTIAL BASELINE - Some components need attention before polish');
        } else {
            console.log('❌ BASELINE FAILED - Core issues must be resolved first');
        }
        
        console.log('\n🎯 NEXT STEPS:');
        if (successRate >= 80) {
            console.log('1. ✅ Begin implementing UI polish recommendations');
            console.log('2. ✅ Focus on mobile-specific improvements');  
            console.log('3. ✅ Run regression tests after each polish iteration');
        } else {
            console.log('1. 🔧 Address critical test suite failures');
            console.log('2. 🔧 Ensure game engine and canvas are properly loaded');
            console.log('3. 🔧 Re-run tests after fixes');
        }
        
        await browser.close();
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        if (browser) await browser.close();
        
        // Provide fallback manual instructions
        console.log('\n📋 FALLBACK: Manual Test Execution');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Open: http://localhost:3001/games/wavelength-gems');
        console.log('2. Open Developer Console (F12)');
        console.log('3. Execute: runAllWavelengthGemsTests()');
        console.log('4. Review results for UI polish opportunities');
    }
}

// Execute the tests
executeWavelengthGemsTests();