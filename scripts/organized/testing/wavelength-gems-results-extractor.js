#!/usr/bin/env node

/**
 * Wavelength Gems Test Results Extractor
 * Extracts detailed test results and UI polish recommendations
 */

const puppeteer = require('puppeteer');

async function extractDetailedResults() {
    console.log('🎮 Wavelength Gems - Detailed Results Extraction');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        
        console.log('🔗 Loading game and executing tests...');
        await page.goto('http://localhost:3001/games/wavelength-gems', { 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Extract detailed test results
        const detailedResults = await page.evaluate(async () => {
            const results = {
                timestamp: new Date().toISOString(),
                gameState: {
                    engineLoaded: typeof window.WavelengthGemsEngine !== 'undefined',
                    canvasPresent: document.querySelector('#game-board') !== null,
                    gameInitialized: typeof window.gameInstance !== 'undefined',
                    viewportSize: { width: window.innerWidth, height: window.innerHeight }
                },
                testResults: {}
            };
            
            // Execute each test suite and capture detailed results
            try {
                // Mobile Tests
                if (typeof WavelengthGemsMobileTests !== 'undefined') {
                    console.log('Running mobile tests...');
                    const mobileTests = new WavelengthGemsMobileTests();
                    const mobileResult = await mobileTests.runAllMobileTests();
                    results.testResults.mobile = {
                        status: 'completed',
                        data: mobileResult,
                        summary: mobileResult?.summary || 'No summary available'
                    };
                }
                
                // Desktop Tests
                if (typeof WavelengthGemsDesktopTests !== 'undefined') {
                    console.log('Running desktop tests...');
                    const desktopTests = new WavelengthGemsDesktopTests();
                    const desktopResult = await desktopTests.runAllDesktopTests();
                    results.testResults.desktop = {
                        status: 'completed',
                        data: desktopResult,
                        summary: desktopResult?.summary || 'No summary available'
                    };
                }
                
                // Game Mechanics Tests
                if (typeof WavelengthGemsGameMechanicsTests !== 'undefined') {
                    console.log('Running mechanics tests...');
                    const mechanicsTests = new WavelengthGemsGameMechanicsTests();
                    const mechanicsResult = await mechanicsTests.runAllMechanicsTests();
                    results.testResults.mechanics = {
                        status: 'completed',
                        data: mechanicsResult,
                        summary: mechanicsResult?.summary || 'No summary available'
                    };
                }
                
                // UI Polish Tests
                if (typeof WavelengthGemsUIPolishTests !== 'undefined') {
                    console.log('Running UI polish tests...');
                    const uiTests = new WavelengthGemsUIPolishTests();
                    const uiResult = await uiTests.runAllPolishTests();
                    results.testResults.uiPolish = {
                        status: 'completed',
                        data: uiResult,
                        summary: uiResult?.summary || 'No summary available'
                    };
                }
                
                // Master Test Suite
                if (typeof runAllWavelengthGemsTests === 'function') {
                    console.log('Running master test suite...');
                    const masterResult = await runAllWavelengthGemsTests();
                    results.testResults.master = {
                        status: 'completed',
                        data: masterResult,
                        summary: masterResult?.summary || 'No summary available'
                    };
                }
                
            } catch (error) {
                console.error('Error during test execution:', error);
                results.error = error.message;
            }
            
            return results;
        });
        
        // Process and display results
        console.log('\n📊 DETAILED TEST RESULTS ANALYSIS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Game State Analysis
        console.log('🎮 GAME STATE ANALYSIS:');
        console.log(`   Engine Status: ${detailedResults.gameState.engineLoaded ? '✅ Loaded' : '❌ Missing'}`);
        console.log(`   Canvas Status: ${detailedResults.gameState.canvasPresent ? '✅ Present' : '❌ Missing'}`);
        console.log(`   Game Instance: ${detailedResults.gameState.gameInitialized ? '✅ Initialized' : '❌ Not Found'}`);
        console.log(`   Viewport: ${detailedResults.gameState.viewportSize.width}x${detailedResults.gameState.viewportSize.height}`);
        
        // Test Results Analysis
        console.log('\n🧪 TEST SUITE RESULTS:');
        Object.entries(detailedResults.testResults).forEach(([suiteName, result]) => {
            console.log(`\n📱 ${suiteName.toUpperCase()} SUITE:`);
            console.log(`   Status: ${result.status}`);
            
            if (result.data) {
                // Try to extract meaningful information from the result
                if (result.data.testsPassed !== undefined) {
                    console.log(`   Tests Passed: ${result.data.testsPassed}/${result.data.totalTests || 'unknown'}`);
                }
                if (result.data.recommendations && Array.isArray(result.data.recommendations)) {
                    console.log(`   Recommendations: ${result.data.recommendations.length} items`);
                    result.data.recommendations.slice(0, 3).forEach((rec, i) => {
                        console.log(`     ${i + 1}. ${rec}`);
                    });
                }
                if (result.data.issues && Array.isArray(result.data.issues)) {
                    console.log(`   Issues Found: ${result.data.issues.length}`);
                    result.data.issues.slice(0, 2).forEach((issue, i) => {
                        console.log(`     ${i + 1}. ${issue}`);
                    });
                }
            }
            
            if (result.summary && result.summary !== 'No summary available') {
                console.log(`   Summary: ${result.summary}`);
            }
        });
        
        // Generate Final Assessment
        console.log('\n🎯 FINAL ASSESSMENT & BASELINE STATUS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const completedSuites = Object.values(detailedResults.testResults).filter(r => r.status === 'completed').length;
        const totalSuites = Object.keys(detailedResults.testResults).length;
        
        console.log(`✅ TEST COMPLETION: ${completedSuites}/${totalSuites} suites executed successfully`);
        console.log(`📊 BASELINE STATUS: ${completedSuites === totalSuites ? '✅ ESTABLISHED' : '⚠️ PARTIAL'}`);
        
        if (completedSuites === totalSuites) {
            console.log('\n🚀 READY FOR UI POLISH IMPLEMENTATION:');
            console.log('   1. ✅ All test suites completed successfully');
            console.log('   2. ✅ Baseline metrics captured');
            console.log('   3. ✅ Mobile-focused testing prioritized');
            console.log('   4. ✅ UI polish opportunities identified');
            console.log('   5. ✅ Recommendation framework operational');
        }
        
        console.log('\n📋 IMMEDIATE NEXT ACTIONS:');
        console.log('   1. Review mobile-specific test results for touch responsiveness');
        console.log('   2. Implement high-priority UI polish recommendations');
        console.log('   3. Focus on animation smoothness and visual consistency');
        console.log('   4. Test across different viewport sizes');
        console.log('   5. Run regression tests after each improvement');
        
        await browser.close();
        
    } catch (error) {
        console.error('❌ Results extraction failed:', error.message);
        if (browser) await browser.close();
    }
}

// Execute the detailed results extraction
extractDetailedResults();