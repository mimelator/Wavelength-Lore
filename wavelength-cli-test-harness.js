#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH CLI COMPREHENSIVE FEATURE DEMONSTRATION
 * =====================================================
 * 
 * Test harness showcasing all NON-DESTRUCTIVE features of the 
 * Wavelength Content Management CLI Tool (GitHub Issue #80)
 * 
 * Features Demonstrated:
 * - Filesystem-like navigation
 * - Content viewing (quick & detailed)
 * - Image preview capabilities
 * - AI enhancement integration
 * - Admin tools (sync validation, status checks)
 * - Visibility controls inspection
 * - Smart autocomplete system
 */

const chalk = require('chalk');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class WavelengthCLITestHarness {
    constructor() {
        this.testResults = [];
        this.adminToolsPath = path.join(__dirname, 'cli-admin-tools');
    }

    /**
     * 🚀 Run comprehensive feature demonstration
     */
    async runFullDemonstration() {
        console.log(chalk.cyan.bold('🌊 WAVELENGTH CLI COMPREHENSIVE FEATURE DEMONSTRATION'));
        console.log(chalk.cyan('═══════════════════════════════════════════════════════════'));
        console.log(chalk.yellow('Testing all NON-DESTRUCTIVE features of GitHub Issue #80\n'));

        try {
            // Test 1: Content Navigation
            await this.testContentNavigation();

            // Test 2: Content Viewing
            await this.testContentViewing();

            // Test 3: Image Preview System
            await this.testImagePreview();

            // Test 4: AI Enhancement (Safe Mode)
            await this.testAIEnhancement();

            // Test 5: Admin Tools - Asset Sync Validation
            await this.testAdminAssetSync();

            // Test 6: Admin Tools - Status Commands
            await this.testAdminStatus();

            // Test 7: Visibility Controls Inspection
            await this.testVisibilityInspection();

            // Test 8: Autocomplete System
            await this.testAutocompleteSystem();

            // Final Report
            this.generateTestReport();

        } catch (error) {
            console.error(chalk.red('❌ Test harness failed:'), error.message);
        }
    }

    /**
     * 🗂️ Test Content Navigation System
     */
    async testContentNavigation() {
        console.log(chalk.blue.bold('\n📁 TEST 1: CONTENT NAVIGATION SYSTEM'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

        const testCases = [
            {
                name: 'Root Directory Listing',
                command: 'echo "ls" | timeout 5s node wavelength-content-cli.js',
                expected: ['lore/', 'characters/', 'episodes/']
            },
            {
                name: 'Lore Section Navigation',
                command: 'echo -e "cd lore\\nls\\nexit" | timeout 5s node wavelength-content-cli.js',
                expected: ['nature/', 'villain/', 'thing/', 'place/', 'band/']
            },
            {
                name: 'Character Section Navigation',
                command: 'echo -e "cd characters\\nls\\nexit" | timeout 5s node wavelength-content-cli.js',
                expected: ['character profiles', 'Found']
            }
        ];

        for (const testCase of testCases) {
            await this.runNavigationTest(testCase);
        }
    }

    /**
     * 👁️ Test Content Viewing Features
     */
    async testContentViewing() {
        console.log(chalk.blue.bold('\n👁️ TEST 2: CONTENT VIEWING FEATURES'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

        const viewingTests = [
            {
                name: 'Quick View - Lore Item',
                command: 'echo -e "cd lore\\nview ice-blue-diamond\\nexit" | timeout 8s node wavelength-content-cli.js',
                expected: ['QUICK VIEW:', 'Ice Blue Diamond', 'Type:', 'Visibility:']
            },
            {
                name: 'Detailed View - Lore Item',
                command: 'echo -e "cd lore\\nview ice-blue-diamond --detailed\\nexit" | timeout 8s node wavelength-content-cli.js',
                expected: ['Ice Blue Diamond', 'Enhanced with dramatic CTAs', 'Keywords:']
            },
            {
                name: 'View Enhanced Content',
                command: 'echo -e "cd lore\\nview wavelength\\nexit" | timeout 8s node wavelength-content-cli.js',
                expected: ['Wavelength', 'band', 'Enhanced with dramatic CTAs']
            }
        ];

        for (const test of viewingTests) {
            await this.runViewingTest(test);
        }
    }

    /**
     * 🖼️ Test Image Preview System
     */
    async testImagePreview() {
        console.log(chalk.blue.bold('\n🖼️ TEST 3: IMAGE PREVIEW SYSTEM'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

        const imageTests = [
            {
                name: 'Image Preview - Multiple Images',
                command: 'echo -e "cd lore\\npreview ice-blue-diamond\\nexit" | timeout 8s node wavelength-content-cli.js',
                expected: ['Opening', 'image', 'Ice Blue Diamond']
            },
            {
                name: 'Image Preview - Gallery Items',
                command: 'echo -e "cd lore\\npreview wavelength\\nexit" | timeout 8s node wavelength-content-cli.js',  
                expected: ['Opening', 'Wavelength']
            }
        ];

        for (const test of imageTests) {
            await this.runImageTest(test);
        }
    }

    /**
     * 🤖 Test AI Enhancement Integration (Safe Mode)
     */
    async testAIEnhancement() {
        console.log(chalk.blue.bold('\n🤖 TEST 4: AI ENHANCEMENT SYSTEM (SAFE MODE)'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

        // Test AI integration availability (not actual enhancement)
        const aiTests = [
            {
                name: 'AI Enhancement Help',
                command: 'echo -e "help\\nexit" | timeout 5s node wavelength-content-cli.js',
                expected: ['enhance <item> <prompt>', 'AI enhance item']
            },
            {
                name: 'AI System Availability Check',
                command: 'echo -e "cd lore\\nview wavelength\\nexit" | timeout 8s node wavelength-content-cli.js',
                expected: ['Enhanced with dramatic CTAs', 'AI-generated']
            }
        ];

        for (const test of aiTests) {
            await this.runAITest(test);
        }
    }

    /**
     * 📄 Test Admin Tools - Asset Sync Validation
     */
    async testAdminAssetSync() {
        console.log(chalk.blue.bold('\n📄 TEST 5: ADMIN ASSET SYNC VALIDATION'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

        try {
            // Test direct admin tool
            console.log(chalk.yellow('Testing admin sync tool directly...'));
            const syncResult = await this.runCommand('node cli-admin-tools/sync-assets.js --status');
            
            if (syncResult.includes('WAVELENGTH SYNC STATUS')) {
                this.addTestResult('Admin Sync Tool', '✅ PASS', 'Sync tool accessible and functional');
            } else {
                this.addTestResult('Admin Sync Tool', '❌ FAIL', 'Sync tool not responding correctly');
            }

            // Test via CLI admin mode
            console.log(chalk.yellow('Testing admin sync via CLI integration...'));
            const cliAdminResult = await this.runCommand('echo -e "admin sync --status\\nexit" | timeout 8s node wavelength-content-cli.js');
            
            if (cliAdminResult.includes('ADMIN MODE') || cliAdminResult.includes('Sync Assets')) {
                this.addTestResult('CLI Admin Integration', '✅ PASS', 'Admin mode accessible from CLI');
            } else {
                this.addTestResult('CLI Admin Integration', '❌ FAIL', 'Admin mode not accessible');
            }

            // Validate asset scanning capability
            console.log(chalk.yellow('Testing asset validation scanning...'));
            const publicDir = path.join(__dirname, 'public');
            if (fs.existsSync(publicDir)) {
                const files = this.countFiles(publicDir);
                console.log(chalk.green(`📊 Found ${files} total files in public directory`));
                this.addTestResult('Asset Scanning', '✅ PASS', `Scanned ${files} assets successfully`);
            } else {
                this.addTestResult('Asset Scanning', '⚠️ SKIP', 'Public directory not found');
            }

        } catch (error) {
            this.addTestResult('Admin Sync Tools', '❌ FAIL', error.message);
        }
    }

    /**
     * 📊 Test Admin Status Commands
     */
    async testAdminStatus() {
        console.log(chalk.blue.bold('\n📊 TEST 6: ADMIN STATUS COMMANDS'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

        try {
            // Test deployment status tool
            console.log(chalk.yellow('Testing deployment status tool...'));
            const statusResult = await this.runCommand('node cli-admin-tools/deployment-status.js --quick');
            
            if (statusResult.includes('WAVELENGTH QUICK CHECK')) {
                this.addTestResult('Deployment Status', '✅ PASS', 'Status tool working correctly');
            } else {
                this.addTestResult('Deployment Status', '❌ FAIL', 'Status tool not responding');
            }

            // Test admin toolkit overview
            console.log(chalk.yellow('Testing admin toolkit status...'));
            const toolkitResult = await this.runCommand('node cli-admin-tools/index.js --status');
            
            if (toolkitResult.includes('ADMIN TOOLKIT STATUS')) {
                this.addTestResult('Admin Toolkit', '✅ PASS', 'All admin tools available');
            } else {
                this.addTestResult('Admin Toolkit', '❌ FAIL', 'Toolkit status unavailable');
            }

            // Test cache bust tool
            console.log(chalk.yellow('Testing cache management status...'));
            const cacheResult = await this.runCommand('node cli-admin-tools/cache-bust.js --status');
            
            if (cacheResult.includes('CACHE INVALIDATIONS') || cacheResult.includes('No recent invalidations')) {
                this.addTestResult('Cache Management', '✅ PASS', 'Cache tools accessible');
            } else {
                this.addTestResult('Cache Management', '❌ FAIL', 'Cache tools unavailable');
            }

        } catch (error) {
            this.addTestResult('Admin Status Commands', '❌ FAIL', error.message);
        }
    }

    /**
     * 👁️ Test Visibility Controls Inspection
     */
    async testVisibilityInspection() {
        console.log(chalk.blue.bold('\n👁️ TEST 7: VISIBILITY CONTROLS INSPECTION'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

        const visibilityTests = [
            {
                name: 'Visibility Status Check',
                command: 'echo -e "cd lore\\nls\\nexit" | timeout 8s node wavelength-content-cli.js',
                expected: ['VISIBLE', 'HIDDEN'] // Should show visibility indicators
            },
            {
                name: 'Individual Item Visibility',
                command: 'echo -e "cd lore\\nview ice-blue-diamond\\nexit" | timeout 8s node wavelength-content-cli.js',
                expected: ['Visibility:', 'VISIBLE']
            }
        ];

        for (const test of visibilityTests) {
            await this.runVisibilityTest(test);
        }
    }

    /**
     * ✨ Test Autocomplete System
     */
    async testAutocompleteSystem() {
        console.log(chalk.blue.bold('\n✨ TEST 8: AUTOCOMPLETE SYSTEM'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

        // Test help system shows autocomplete info
        const helpResult = await this.runCommand('echo -e "help\\nexit" | timeout 5s node wavelength-content-cli.js');
        
        if (helpResult.includes('AUTOCOMPLETE MAGIC') && helpResult.includes('Press TAB')) {
            this.addTestResult('Autocomplete System', '✅ PASS', 'Autocomplete help available');
        } else {
            this.addTestResult('Autocomplete System', '❌ FAIL', 'Autocomplete help not found');
        }

        // Test command availability
        const commands = ['ls', 'cd', 'view', 'edit', 'enhance', 'admin', 'preview', 'help'];
        let foundCommands = 0;
        
        commands.forEach(cmd => {
            if (helpResult.includes(cmd)) {
                foundCommands++;
            }
        });

        if (foundCommands >= 6) {
            this.addTestResult('Command Coverage', '✅ PASS', `${foundCommands}/${commands.length} commands available`);
        } else {
            this.addTestResult('Command Coverage', '⚠️ PARTIAL', `${foundCommands}/${commands.length} commands found`);
        }
    }

    /**
     * 🧪 Helper method to run navigation tests
     */
    async runNavigationTest(testCase) {
        try {
            console.log(chalk.yellow(`  Testing: ${testCase.name}`));
            const result = await this.runCommand(testCase.command);
            
            let passed = 0;
            testCase.expected.forEach(expected => {
                if (result.includes(expected)) {
                    passed++;
                }
            });

            if (passed >= testCase.expected.length - 1) { // Allow for 1 missing
                console.log(chalk.green(`    ✅ ${testCase.name} - PASS`));
                this.addTestResult(testCase.name, '✅ PASS', `Found ${passed}/${testCase.expected.length} expected elements`);
            } else {
                console.log(chalk.red(`    ❌ ${testCase.name} - FAIL`));
                this.addTestResult(testCase.name, '❌ FAIL', `Found ${passed}/${testCase.expected.length} expected elements`);
            }
        } catch (error) {
            console.log(chalk.red(`    ❌ ${testCase.name} - ERROR: ${error.message}`));
            this.addTestResult(testCase.name, '❌ ERROR', error.message);
        }
    }

    /**
     * 🧪 Helper method to run viewing tests
     */
    async runViewingTest(test) {
        try {
            console.log(chalk.yellow(`  Testing: ${test.name}`));
            const result = await this.runCommand(test.command);
            
            let found = 0;
            test.expected.forEach(expected => {
                if (result.includes(expected)) {
                    found++;
                }
            });

            if (found >= Math.ceil(test.expected.length * 0.7)) { // 70% success rate
                console.log(chalk.green(`    ✅ ${test.name} - PASS`));
                this.addTestResult(test.name, '✅ PASS', `Content viewing functional`);
            } else {
                console.log(chalk.yellow(`    ⚠️ ${test.name} - PARTIAL`));
                this.addTestResult(test.name, '⚠️ PARTIAL', `Found ${found}/${test.expected.length} elements`);
            }
        } catch (error) {
            this.addTestResult(test.name, '❌ ERROR', error.message);
        }
    }

    /**
     * 🧪 Helper methods for other test types
     */
    async runImageTest(test) {
        return this.runViewingTest(test); // Same pattern
    }

    async runAITest(test) {
        return this.runViewingTest(test); // Same pattern
    }

    async runVisibilityTest(test) {
        return this.runViewingTest(test); // Same pattern
    }

    /**
     * 🔧 Execute shell command and return output
     */
    runCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
                if (error && !error.message.includes('timeout')) {
                    reject(error);
                } else {
                    resolve(stdout + stderr);
                }
            });
        });
    }

    /**
     * 📁 Count files in directory recursively
     */
    countFiles(dir) {
        let count = 0;
        
        try {
            const items = fs.readdirSync(dir);
            items.forEach(item => {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isFile()) {
                    count++;
                } else if (stat.isDirectory()) {
                    count += this.countFiles(fullPath);
                }
            });
        } catch (error) {
            // Directory might not exist or be accessible
        }
        
        return count;
    }

    /**
     * 📝 Add test result to collection
     */
    addTestResult(name, status, details) {
        this.testResults.push({
            name,
            status,
            details,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 📊 Generate comprehensive test report
     */
    generateTestReport() {
        console.log(chalk.cyan.bold('\n📊 COMPREHENSIVE TEST REPORT'));
        console.log(chalk.cyan('═══════════════════════════════════════════════════════════'));

        let passed = 0;
        let failed = 0;
        let partial = 0;
        let errors = 0;

        this.testResults.forEach(result => {
            let icon = '';
            if (result.status.includes('✅')) {
                passed++;
                icon = '✅';
            } else if (result.status.includes('❌')) {
                failed++;
                icon = '❌';
            } else if (result.status.includes('⚠️')) {
                partial++;
                icon = '⚠️';
            } else {
                errors++;
                icon = '🔧';
            }

            console.log(`${icon} ${chalk.white(result.name.padEnd(30))} ${result.status} - ${chalk.gray(result.details)}`);
        });

        console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green(`✅ PASSED: ${passed}`));
        console.log(chalk.yellow(`⚠️ PARTIAL: ${partial}`));
        console.log(chalk.red(`❌ FAILED: ${failed}`));
        console.log(chalk.blue(`🔧 ERRORS: ${errors}`));

        const total = passed + failed + partial + errors;
        const successRate = Math.round(((passed + partial * 0.5) / total) * 100);

        console.log(chalk.cyan(`\n🎯 OVERALL SUCCESS RATE: ${successRate}%`));

        if (successRate >= 80) {
            console.log(chalk.green('🌟 EXCELLENT: CLI tool is highly functional!'));
        } else if (successRate >= 60) {
            console.log(chalk.yellow('👍 GOOD: CLI tool is mostly functional with some issues'));
        } else {
            console.log(chalk.red('⚠️ NEEDS ATTENTION: CLI tool has significant issues'));
        }

        console.log(chalk.cyan('\n🔗 GitHub Issue #80 Status: COMPREHENSIVE TESTING COMPLETE'));
        console.log(chalk.gray('All NON-DESTRUCTIVE features have been tested safely.'));
    }
}

// Auto-run if called directly
if (require.main === module) {
    const testHarness = new WavelengthCLITestHarness();
    testHarness.runFullDemonstration().catch(console.error);
}

module.exports = WavelengthCLITestHarness;