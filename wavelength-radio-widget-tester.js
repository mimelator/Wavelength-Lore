#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH RADIO WIDGET TEST SCRIPT
 * 
 * Tests that radio widget initializes properly on different pages
 */

const puppeteer = require('puppeteer');
const chalk = require('chalk');

class RadioWidgetTester {
    constructor() {
        this.browser = null;
        this.results = [];
    }

    async runTests() {
        console.log(chalk.magenta.bold('🌊 WAVELENGTH RADIO WIDGET TEST SUITE'));
        console.log(chalk.magenta('====================================='));
        console.log('');

        try {
            this.browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            await this.testHomepage();
            await this.testRadioPage();
            await this.testEpisodePage();

            this.showResults();
        } catch (error) {
            console.error(chalk.red(`❌ Test suite failed: ${error.message}`));
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    async testHomepage() {
        console.log(chalk.blue('🏠 Testing Homepage (/) - Should Initialize Widget'));
        
        try {
            const page = await this.browser.newPage();
            
            // Listen for console errors
            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0', timeout: 10000 });

            // Wait a moment for scripts to load
            await page.waitForTimeout(2000);

            // Check if widget container exists
            const hasContainer = await page.$('[data-wavelength-radio-widget]') !== null;

            // Check if radio player was initialized
            const radioInitialized = await page.evaluate(() => {
                return typeof window.wavelengthRadio !== 'undefined';
            });

            // Check for JavaScript errors
            const hasJSErrors = consoleErrors.some(error => 
                error.includes('levelUpAnimationStyle') || 
                error.includes('Uncaught SyntaxError') ||
                error.includes('already been declared')
            );

            const result = {
                page: 'Homepage (/)',
                hasContainer,
                radioInitialized,
                hasJSErrors,
                errors: consoleErrors,
                success: hasContainer && radioInitialized && !hasJSErrors
            };

            this.results.push(result);

            if (result.success) {
                console.log(chalk.green('✅ Homepage test passed'));
                console.log(chalk.gray(`   ✓ Container found: ${hasContainer}`));
                console.log(chalk.gray(`   ✓ Radio initialized: ${radioInitialized}`));
                console.log(chalk.gray(`   ✓ No JS errors: ${!hasJSErrors}`));
            } else {
                console.log(chalk.red('❌ Homepage test failed'));
                if (!hasContainer) console.log(chalk.yellow('   ⚠️  Widget container not found'));
                if (!radioInitialized) console.log(chalk.yellow('   ⚠️  Radio player not initialized'));
                if (hasJSErrors) {
                    console.log(chalk.yellow('   ⚠️  JavaScript errors detected:'));
                    consoleErrors.forEach(error => console.log(chalk.gray(`      ${error}`)));
                }
            }

            await page.close();
        } catch (error) {
            console.log(chalk.red(`❌ Homepage test error: ${error.message}`));
            this.results.push({
                page: 'Homepage (/)',
                success: false,
                error: error.message
            });
        }

        console.log('');
    }

    async testRadioPage() {
        console.log(chalk.blue('📻 Testing Radio Page (/radio) - Should NOT Initialize Widget'));
        
        try {
            const page = await this.browser.newPage();
            
            // Listen for console messages including debug messages
            const consoleMessages = [];
            page.on('console', msg => {
                consoleMessages.push({ type: msg.type(), text: msg.text() });
            });

            await page.goto('http://localhost:3001/radio', { waitUntil: 'networkidle0', timeout: 10000 });

            // Wait a moment for scripts to load
            await page.waitForTimeout(2000);

            // Check if widget container exists (should not)
            const hasContainer = await page.$('[data-wavelength-radio-widget]') !== null;

            // Check if radio player was initialized (should not be)
            const radioInitialized = await page.evaluate(() => {
                return typeof window.wavelengthRadio !== 'undefined';
            });

            // Check for the debug message that indicates proper skip
            const hasSkipMessage = consoleMessages.some(msg => 
                msg.text.includes('widget container not found; skipping initialization')
            );

            // Check for JavaScript errors
            const hasJSErrors = consoleMessages.some(msg => 
                msg.type === 'error' && (
                    msg.text.includes('levelUpAnimationStyle') || 
                    msg.text.includes('Uncaught SyntaxError') ||
                    msg.text.includes('already been declared')
                )
            );

            const result = {
                page: 'Radio Page (/radio)',
                hasContainer,
                radioInitialized,
                hasSkipMessage,
                hasJSErrors,
                messages: consoleMessages,
                success: !hasContainer && !radioInitialized && hasSkipMessage && !hasJSErrors
            };

            this.results.push(result);

            if (result.success) {
                console.log(chalk.green('✅ Radio page test passed'));
                console.log(chalk.gray(`   ✓ No container (as expected): ${!hasContainer}`));
                console.log(chalk.gray(`   ✓ No radio init (as expected): ${!radioInitialized}`));
                console.log(chalk.gray(`   ✓ Skip message found: ${hasSkipMessage}`));
                console.log(chalk.gray(`   ✓ No JS errors: ${!hasJSErrors}`));
            } else {
                console.log(chalk.red('❌ Radio page test failed'));
                if (hasContainer) console.log(chalk.yellow('   ⚠️  Widget container found (should not be present)'));
                if (radioInitialized) console.log(chalk.yellow('   ⚠️  Radio player initialized (should be skipped)'));
                if (!hasSkipMessage) console.log(chalk.yellow('   ⚠️  Skip debug message not found'));
                if (hasJSErrors) {
                    console.log(chalk.yellow('   ⚠️  JavaScript errors detected:'));
                    consoleMessages.filter(m => m.type === 'error').forEach(msg => 
                        console.log(chalk.gray(`      ${msg.text}`))
                    );
                }
            }

            await page.close();
        } catch (error) {
            console.log(chalk.red(`❌ Radio page test error: ${error.message}`));
            this.results.push({
                page: 'Radio Page (/radio)',
                success: false,
                error: error.message
            });
        }

        console.log('');
    }

    async testEpisodePage() {
        console.log(chalk.blue('🎵 Testing Episode Page - Should Initialize Widget'));
        
        try {
            const page = await this.browser.newPage();
            
            // Listen for console errors
            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            // Try to load an episode page (assuming episode/1 exists)
            await page.goto('http://localhost:3001/episode/1', { waitUntil: 'networkidle0', timeout: 10000 });

            // Wait a moment for scripts to load
            await page.waitForTimeout(2000);

            // Check if widget container exists
            const hasContainer = await page.$('[data-wavelength-radio-widget]') !== null;

            // Check if radio player was initialized
            const radioInitialized = await page.evaluate(() => {
                return typeof window.wavelengthRadio !== 'undefined';
            });

            // Check for JavaScript errors
            const hasJSErrors = consoleErrors.some(error => 
                error.includes('levelUpAnimationStyle') || 
                error.includes('Uncaught SyntaxError') ||
                error.includes('already been declared')
            );

            const result = {
                page: 'Episode Page (/episode/1)',
                hasContainer,
                radioInitialized,
                hasJSErrors,
                errors: consoleErrors,
                success: hasContainer && radioInitialized && !hasJSErrors
            };

            this.results.push(result);

            if (result.success) {
                console.log(chalk.green('✅ Episode page test passed'));
                console.log(chalk.gray(`   ✓ Container found: ${hasContainer}`));
                console.log(chalk.gray(`   ✓ Radio initialized: ${radioInitialized}`));
                console.log(chalk.gray(`   ✓ No JS errors: ${!hasJSErrors}`));
            } else {
                console.log(chalk.red('❌ Episode page test failed'));
                if (!hasContainer) console.log(chalk.yellow('   ⚠️  Widget container not found'));
                if (!radioInitialized) console.log(chalk.yellow('   ⚠️  Radio player not initialized'));
                if (hasJSErrors) {
                    console.log(chalk.yellow('   ⚠️  JavaScript errors detected:'));
                    consoleErrors.forEach(error => console.log(chalk.gray(`      ${error}`)));
                }
            }

            await page.close();
        } catch (error) {
            console.log(chalk.red(`❌ Episode page test error: ${error.message}`));
            this.results.push({
                page: 'Episode Page (/episode/1)',
                success: false,
                error: error.message
            });
        }

        console.log('');
    }

    showResults() {
        console.log(chalk.blue.bold('📊 TEST RESULTS SUMMARY'));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const passed = this.results.filter(r => r.success).length;
        const total = this.results.length;
        const percentage = Math.round((passed / total) * 100);
        
        console.log(`✅ ${chalk.green.bold(`Passed: ${passed}`)}`);
        console.log(`❌ ${chalk.red.bold(`Failed: ${total - passed}`)}`);
        console.log(`📈 ${chalk.blue.bold(`Success Rate: ${percentage}%`)}`);
        console.log('');

        if (passed === total) {
            console.log(chalk.green.bold('🎉 ALL TESTS PASSED!'));
            console.log(chalk.green('Radio widget behavior is working correctly across all pages!'));
        } else {
            console.log(chalk.yellow.bold('⚠️  SOME TESTS FAILED'));
            console.log(chalk.yellow('Review the failures above and check the implementation.'));
        }

        console.log('');
        console.log(chalk.magenta('🌊 WAVELENGTH RADIO WIDGET TESTING COMPLETE!'));
    }
}

// Check if puppeteer is available
async function checkPuppeteer() {
    try {
        require('puppeteer');
        return true;
    } catch (error) {
        console.log(chalk.yellow('⚠️  Puppeteer not found. Installing...'));
        const { exec } = require('child_process');
        return new Promise((resolve) => {
            exec('npm install puppeteer --no-save', (error) => {
                if (error) {
                    console.log(chalk.red('❌ Failed to install Puppeteer. Manual testing required.'));
                    console.log(chalk.blue('Manual test steps:'));
                    console.log('1. Open http://localhost:3001/ - should see radio widget in footer');
                    console.log('2. Open http://localhost:3001/radio - should NOT initialize widget');
                    console.log('3. Check browser console for errors on both pages');
                    resolve(false);
                } else {
                    console.log(chalk.green('✅ Puppeteer installed successfully'));
                    resolve(true);
                }
            });
        });
    }
}

// Run tests if called directly
if (require.main === module) {
    checkPuppeteer().then(hasP => {
        if (hasP) {
            const tester = new RadioWidgetTester();
            tester.runTests().catch(console.error);
        }
    });
}

module.exports = RadioWidgetTester;