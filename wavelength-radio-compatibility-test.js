#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH RADIO WIDGET COMPATIBILITY TEST
 * 
 * Tests that the radio widget initializes without errors on different page types
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');

async function quickCompatibilityTest() {
    console.log(chalk.magenta.bold('🌊 WAVELENGTH RADIO WIDGET COMPATIBILITY TEST'));
    console.log(chalk.magenta('================================================='));
    console.log('');

    let browser;
    try {
        // Try to use puppeteer if available
        browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const testPages = [
            { url: 'http://localhost:3001/', name: 'Homepage', shouldHaveWidget: true },
            { url: 'http://localhost:3001/characters', name: 'Characters Page', shouldHaveWidget: true },
            { url: 'http://localhost:3001/radio', name: 'Radio Page', shouldHaveWidget: false }
        ];

        for (const test of testPages) {
            console.log(chalk.blue(`🔍 Testing ${test.name} (${test.url})`));
            
            const page = await browser.newPage();
            
            // Collect console messages
            const consoleMessages = [];
            page.on('console', msg => {
                consoleMessages.push({ 
                    type: msg.type(), 
                    text: msg.text(),
                    isError: msg.type() === 'error'
                });
            });

            try {
                await page.goto(test.url, { waitUntil: 'networkidle0', timeout: 8000 });
                
                // Wait for scripts to execute
                await page.waitForTimeout(1500);

                // Check for widget presence
                const hasWidget = await page.$('[data-wavelength-radio-widget]') !== null;
                
                // Check for critical JavaScript errors
                const hasJSErrors = consoleMessages.some(msg => 
                    msg.isError && (
                        msg.text.includes('Cannot read properties of null')
                        || msg.text.includes('addEventListener')
                        || msg.text.includes('Uncaught TypeError')
                        || msg.text.includes('initialization failed')
                    )
                );

                // Check for successful initialization messages
                const hasInitMessage = consoleMessages.some(msg => 
                    msg.text.includes('Initializing mini radio player') || 
                    msg.text.includes('Initializing full radio player')
                );

                const success = (hasWidget === test.shouldHaveWidget) && !hasJSErrors;

                if (success) {
                    console.log(chalk.green(`   ✅ ${test.name} test passed`));
                    console.log(chalk.gray(`      Widget present: ${hasWidget} (expected ${test.shouldHaveWidget})`));
                    console.log(chalk.gray(`      No JS errors: ${!hasJSErrors}`));
                    console.log(chalk.gray(`      Init message: ${hasInitMessage}`));
                } else {
                    console.log(chalk.red(`   ❌ ${test.name} test failed`));
                    console.log(chalk.yellow(`      Widget present: ${hasWidget} (expected ${test.shouldHaveWidget})`));
                    console.log(chalk.yellow(`      Has JS errors: ${hasJSErrors}`));
                    
                    if (hasJSErrors) {
                        console.log(chalk.yellow('      JavaScript errors:'));
                        consoleMessages.filter(m => m.isError).forEach(msg => 
                            console.log(chalk.gray(`         ${msg.text}`))
                        );
                    }
                }
                
            } catch (error) {
                console.log(chalk.red(`   ❌ ${test.name} failed to load: ${error.message}`));
            }

            await page.close();
            console.log('');
        }

    } catch (puppeteerError) {
        console.log(chalk.yellow('⚠️  Puppeteer not available, providing manual test instructions:'));
        console.log('');
        console.log(chalk.blue('MANUAL TEST:'));
        console.log('1. Open http://localhost:3001/characters in browser');
        console.log('2. Open Developer Tools console (F12)');
        console.log('3. Look for:');
        console.log('   ✅ "🎵 Initializing mini radio player" message');
        console.log('   ✅ No "Cannot read properties of null" errors');
        console.log('   ✅ Mini radio widget in footer works');
        console.log('');
        return false;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
    
    console.log(chalk.magenta('🌊 COMPATIBILITY TEST COMPLETE!'));
    return true;
}

// Run test
if (require.main === module) {
    quickCompatibilityTest().catch(console.error);
}

module.exports = { quickCompatibilityTest };