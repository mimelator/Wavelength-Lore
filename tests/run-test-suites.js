#!/usr/bin/env node

/**
 * 🧪 TEST SUITE RUNNER
 * Executes rationalized test suites with clean output and reporting
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SUITES_DIR = path.join(__dirname, 'suites');
const AVAILABLE_SUITES = {
    'map-system': {
        path: 'suites/map-system/map-system.test.js',
        description: 'Map interaction, coordinates, and episode integration',
        priority: 1
    },
    'security': {
        path: 'suites/security/',
        description: 'Authentication, authorization, and data protection',
        priority: 1
    },
    'merchandise': {
        path: 'suites/merchandise/',
        description: 'Product lifecycle, vendor catalog, customization',
        priority: 2
    },
    'gallery': {
        path: 'suites/gallery/',
        description: 'Image upload, display, and user permissions',
        priority: 2
    },
    'performance': {
        path: 'suites/performance/',
        description: 'Load testing, response times, scalability',
        priority: 3
    }
};

class TestSuiteRunner {
    constructor() {
        this.results = [];
        this.startTime = Date.now();
    }

    async runSuite(suiteName, options = {}) {
        console.log(`\n🧪 RUNNING SUITE: ${suiteName.toUpperCase()}`);
        console.log('='.repeat(60));

        const suite = AVAILABLE_SUITES[suiteName];
        if (!suite) {
            throw new Error(`Unknown test suite: ${suiteName}`);
        }

        const suitePath = path.join(__dirname, suite.path);
        
        try {
            // Check if suite exists
            if (!fs.existsSync(suitePath)) {
                console.log(`⚠️ Suite not yet implemented: ${suitePath}`);
                return { suite: suiteName, status: 'not-implemented', skipped: true };
            }

            const startTime = Date.now();

            // Run the test suite using Jest through our isolated runner
            const command = options.isolated 
                ? `./isolated-run.sh node_modules/.bin/jest ${suitePath}`
                : `npx jest ${suitePath}`;

            console.log(`🚀 Executing: ${command}`);
            console.log('-'.repeat(40));

            const result = execSync(command, {
                cwd: process.cwd(),
                stdio: 'inherit',
                env: { ...process.env, NODE_ENV: 'test' }
            });

            const duration = Date.now() - startTime;
            console.log(`\n✅ Suite completed in ${duration}ms`);

            return {
                suite: suiteName,
                status: 'passed',
                duration,
                exitCode: 0
            };

        } catch (error) {
            const duration = Date.now() - startTime;
            console.log(`\n❌ Suite failed after ${duration}ms`);
            console.log(`Error: ${error.message}`);

            return {
                suite: suiteName,
                status: 'failed',
                duration,
                exitCode: error.status || 1,
                error: error.message
            };
        }
    }

    async runAll(options = {}) {
        console.log('🧪 RUNNING ALL TEST SUITES');
        console.log('='.repeat(60));
        
        const suiteNames = Object.keys(AVAILABLE_SUITES);
        const results = [];

        for (const suiteName of suiteNames) {
            const result = await this.runSuite(suiteName, options);
            results.push(result);

            // Stop on first failure if requested
            if (result.status === 'failed' && options.failFast) {
                console.log(`\n⚠️ Stopping on first failure (--fail-fast)`);
                break;
            }
        }

        this.summarizeResults(results);
        return results;
    }

    async runByPriority(priority, options = {}) {
        console.log(`🧪 RUNNING PRIORITY ${priority} TEST SUITES`);
        console.log('='.repeat(60));

        const suiteNames = Object.keys(AVAILABLE_SUITES)
            .filter(name => AVAILABLE_SUITES[name].priority === priority);

        if (suiteNames.length === 0) {
            console.log(`No suites found for priority ${priority}`);
            return [];
        }

        const results = [];
        for (const suiteName of suiteNames) {
            const result = await this.runSuite(suiteName, options);
            results.push(result);
        }

        this.summarizeResults(results);
        return results;
    }

    listSuites() {
        console.log('🧪 AVAILABLE TEST SUITES');
        console.log('='.repeat(60));

        Object.entries(AVAILABLE_SUITES).forEach(([name, suite]) => {
            const status = fs.existsSync(path.join(__dirname, suite.path)) ? '✅' : '⚠️';
            console.log(`${status} ${name} (Priority ${suite.priority})`);
            console.log(`   ${suite.description}`);
            console.log(`   Path: ${suite.path}`);
            console.log();
        });
    }

    summarizeResults(results) {
        const totalDuration = Date.now() - this.startTime;
        
        console.log('\n📊 TEST SUITE EXECUTION SUMMARY');
        console.log('='.repeat(60));

        const passed = results.filter(r => r.status === 'passed').length;
        const failed = results.filter(r => r.status === 'failed').length;
        const skipped = results.filter(r => r.skipped).length;
        const total = results.length;

        console.log(`Total Suites: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️ Skipped: ${skipped}`);
        console.log(`⏱️ Total Time: ${totalDuration}ms`);
        console.log(`📈 Success Rate: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 0}%`);

        if (failed > 0) {
            console.log('\n❌ FAILED SUITES:');
            results.filter(r => r.status === 'failed').forEach(result => {
                console.log(`   • ${result.suite}: ${result.error || 'Unknown error'}`);
            });
        }

        if (skipped > 0) {
            console.log('\n⚠️ SKIPPED SUITES:');
            results.filter(r => r.skipped).forEach(result => {
                console.log(`   • ${result.suite}: Not yet implemented`);
            });
        }

        return { total, passed, failed, skipped, totalDuration };
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const runner = new TestSuiteRunner();

    // Parse command line arguments
    const options = {
        isolated: args.includes('--isolated'),
        failFast: args.includes('--fail-fast')
    };

    try {
        if (args.includes('--list')) {
            runner.listSuites();
            return;
        }

        if (args.includes('--all')) {
            await runner.runAll(options);
            return;
        }

        if (args.includes('--priority')) {
            const priorityIndex = args.indexOf('--priority');
            const priority = parseInt(args[priorityIndex + 1]);
            if (!priority) {
                console.error('❌ --priority requires a number (1, 2, or 3)');
                process.exit(1);
            }
            await runner.runByPriority(priority, options);
            return;
        }

        // Run specific suite
        const suiteName = args.find(arg => !arg.startsWith('--'));
        if (suiteName && AVAILABLE_SUITES[suiteName]) {
            await runner.runSuite(suiteName, options);
            return;
        }

        // Show usage
        console.log('🧪 TEST SUITE RUNNER');
        console.log('='.repeat(40));
        console.log('Usage:');
        console.log('  node run-test-suites.js [options] [suite-name]');
        console.log('');
        console.log('Options:');
        console.log('  --list              List all available test suites');
        console.log('  --all               Run all test suites');
        console.log('  --priority <n>      Run suites of specific priority (1, 2, 3)');
        console.log('  --isolated          Use process isolation for test execution');
        console.log('  --fail-fast         Stop on first test suite failure');
        console.log('');
        console.log('Examples:');
        console.log('  node run-test-suites.js --list');
        console.log('  node run-test-suites.js map-system --isolated');
        console.log('  node run-test-suites.js --priority 1');
        console.log('  node run-test-suites.js --all --isolated');

    } catch (error) {
        console.error(`❌ Test execution failed: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { TestSuiteRunner, AVAILABLE_SUITES };