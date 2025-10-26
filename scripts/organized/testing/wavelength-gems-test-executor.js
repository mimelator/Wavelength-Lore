#!/usr/bin/env node

/**
 * Wavelength Gems Game Test Executor
 * Executes the comprehensive test suites we built for the game
 */

const puppeteer = require('puppeteer');

async function executeGameTests() {
    console.log('🎮 Wavelength Gems Test Executor');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    let browser;
    try {
        // Launch browser
        console.log('🚀 Launching browser...');
        browser = await puppeteer.launch({ 
            headless: false, // Show browser for debugging
            defaultViewport: { width: 1200, height: 800 }
        });
        
        const page = await browser.newPage();
        
        // Enable console logging from page
        page.on('console', msg => {
            const type = msg.type();
            if (type === 'log') console.log('📝', msg.text());
            else if (type === 'error') console.error('❌', msg.text());
            else if (type === 'warn') console.warn('⚠️', msg.text());
        });
        
        // Navigate to Wavelength Gems
        console.log('🔗 Loading Wavelength Gems game...');
        await page.goto('http://localhost:3001/wavelength-gems', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Wait for game to initialize
        console.log('⏳ Waiting for game initialization...');
        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if our test suites are loaded
        const testSuitesAvailable = await page.evaluate(() => {
            return {
                master: typeof runAllWavelengthGemsTests === 'function',
                mobile: typeof WavelengthGemsMobileTests !== 'undefined',
                desktop: typeof WavelengthGemsDesktopTests !== 'undefined',
                mechanics: typeof WavelengthGemsGameMechanicsTests !== 'undefined',
                ui: typeof WavelengthGemsUIPolishTests !== 'undefined'
            };
        });
        
        console.log('🔍 Test Suite Availability:', testSuitesAvailable);
        
        if (!testSuitesAvailable.master) {
            console.error('❌ Master test suite not found! Check if scripts are loaded correctly.');
            return;
        }
        
        // Execute comprehensive test suite
        console.log('🧪 Executing comprehensive Wavelength Gems test suite...');
        
        const testResults = await page.evaluate(async () => {
            // Execute the main test suite and capture results
            console.log('Starting runAllWavelengthGemsTests()...');
            
            try {
                // Execute the comprehensive test
                const results = await runAllWavelengthGemsTests();
                return {
                    success: true,
                    results: results
                };
            } catch (error) {
                console.error('Error executing comprehensive tests:', error);
                
                // Fallback: Run individual test suites
                const individualResults = {};
                
                if (typeof WavelengthGemsMobileTests !== 'undefined') {
                    console.log('Running mobile tests...');
                    individualResults.mobile = await WavelengthGemsMobileTests.runAllTests();
                }
                
                if (typeof WavelengthGemsDesktopTests !== 'undefined') {
                    console.log('Running desktop tests...');
                    individualResults.desktop = await WavelengthGemsDesktopTests.runAllTests();
                }
                
                if (typeof WavelengthGemsGameMechanicsTests !== 'undefined') {
                    console.log('Running game mechanics tests...');
                    individualResults.mechanics = await WavelengthGemsGameMechanicsTests.runAllTests();
                }
                
                if (typeof WavelengthGemsUIPolishTests !== 'undefined') {
                    console.log('Running UI polish tests...');
                    individualResults.ui = await WavelengthGemsUIPolishTests.runAllTests();
                }
                
                return {
                    success: false,
                    error: error.message,
                    individualResults: individualResults
                };
            }
        });
        
        // Display results
        console.log('\n📊 Wavelength Gems Test Results');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (testResults.success) {
            console.log('✅ Comprehensive test suite executed successfully!');
            console.log('Results:', JSON.stringify(testResults.results, null, 2));
        } else {
            console.log('⚠️ Comprehensive test failed, individual results:');
            console.log('Error:', testResults.error);
            console.log('Individual Results:', JSON.stringify(testResults.individualResults, null, 2));
        }
        
        // Keep browser open for manual inspection
        console.log('\n🔍 Browser left open for manual inspection of results...');
        console.log('Press Ctrl+C to close browser and exit.');
        
        // Wait for user to close
        await new Promise(() => {});
        
    } catch (error) {
        console.error('❌ Test execution failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Check if puppeteer is available
try {
    executeGameTests();
} catch (error) {
    console.log('⚠️ Puppeteer not available, falling back to manual execution instructions...');
    console.log('\n🎮 Manual Test Execution Instructions:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Open browser to: http://localhost:3001/wavelength-gems');
    console.log('2. Open Developer Console (F12)');
    console.log('3. Execute: runAllWavelengthGemsTests()');
    console.log('4. Or run individual suites:');
    console.log('   - WavelengthGemsMobileTests.runAllTests()');
    console.log('   - WavelengthGemsDesktopTests.runAllTests()');
    console.log('   - WavelengthGemsGameMechanicsTests.runAllTests()');
    console.log('   - WavelengthGemsUIPolishTests.runAllTests()');
}