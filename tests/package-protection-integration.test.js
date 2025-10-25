#!/usr/bin/env node

/**
 * Package Protection Integration Test
 * End-to-end validation of complete protection system
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PackageProtectionIntegrationTest {
    constructor() {
        this.originalPackage = null;
        this.testResults = [];
    }

    async runIntegrationTests() {
        console.log('🧪 Package Protection Integration Test Suite\n');
        
        try {
            this.setup();
            await this.testGuardScript();
            await this.testSafeRunner();
            await this.testSmartCommitProtection();
            await this.testCorruptionRecovery();
            this.cleanup();
            
            console.log('\n📊 Integration Test Results:');
            this.testResults.forEach(result => {
                console.log(`${result.passed ? '✅' : '❌'} ${result.name}: ${result.message}`);
            });
            
            const allPassed = this.testResults.every(r => r.passed);
            console.log(`\n${allPassed ? '✅' : '❌'} Integration tests ${allPassed ? 'PASSED' : 'FAILED'}`);
            return allPassed;
            
        } catch (error) {
            console.error('\n❌ Integration test FAILED:', error.message);
            this.cleanup();
            return false;
        }
    }

    setup() {
        console.log('📋 Setting up integration test environment...');
        this.originalPackage = fs.readFileSync('package.json', 'utf8');
        console.log('✅ Environment ready');
    }

    async testGuardScript() {
        console.log('\n🛡️ Testing package-guard.sh script...');
        
        try {
            // Test status command
            const statusOutput = execSync('bash scripts/package-guard.sh status', { encoding: 'utf8' });
            if (!statusOutput.includes('package.json: HEALTHY')) {
                throw new Error('Status command failed');
            }
            
            // Test backup command
            execSync('bash scripts/package-guard.sh backup', { encoding: 'utf8' });
            if (!fs.existsSync('.package-backups')) {
                throw new Error('Backup directory not created');
            }
            
            // Test check command
            execSync('bash scripts/package-guard.sh check', { encoding: 'utf8' });
            
            this.testResults.push({
                name: 'Guard Script Commands',
                passed: true,
                message: 'All guard script commands working'
            });
            
        } catch (error) {
            this.testResults.push({
                name: 'Guard Script Commands',
                passed: false,
                message: `Guard script failed: ${error.message}`
            });
        }
    }

    async testSafeRunner() {
        console.log('\n🔒 Testing safe-script-runner...');
        
        try {
            // Create a simple test script
            const testScript = `
console.log('Test script running...');
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log('Package name:', pkg.name);
process.exit(0);
            `;
            
            fs.writeFileSync('temp-test-script.js', testScript);
            
            // Run with safe runner
            const output = execSync('node scripts/unified/safe-script-runner.js temp-test-script.js', { encoding: 'utf8' });
            
            if (!output.includes('Starting protected execution') || !output.includes('Script completed safely')) {
                throw new Error('Safe runner output missing expected messages');
            }
            
            // Cleanup
            fs.unlinkSync('temp-test-script.js');
            
            this.testResults.push({
                name: 'Safe Script Runner',
                passed: true,
                message: 'Safe script execution working'
            });
            
        } catch (error) {
            this.testResults.push({
                name: 'Safe Script Runner',
                passed: false,
                message: `Safe runner failed: ${error.message}`
            });
        }
    }

    async testSmartCommitProtection() {
        console.log('\n📝 Testing smart-commit protection integration...');
        
        try {
            // Create a test commit message
            const testMessage = '🧪 Test commit for package protection validation\n\nThis is a test commit to validate package.json protection integration.';
            fs.writeFileSync('commit-message.txt', testMessage);
            
            // Test smart-commit validation (dry run - don't actually commit)
            // We'll test the validation part by checking if it loads without errors
            const SmartCommit = require('../scripts/unified/smart-commit');
            const commit = new SmartCommit();
            
            // Verify protector is initialized
            if (!commit.protector) {
                throw new Error('Package protector not initialized in smart-commit');
            }
            
            // Test validation method exists and works
            const validation = commit.protector.validate();
            if (!validation.valid) {
                throw new Error('Smart-commit validation failed');
            }
            
            this.testResults.push({
                name: 'Smart Commit Protection',
                passed: true,
                message: 'Smart-commit package protection integrated'
            });
            
        } catch (error) {
            this.testResults.push({
                name: 'Smart Commit Protection',
                passed: false,
                message: `Smart-commit protection failed: ${error.message}`
            });
        }
    }

    async testCorruptionRecovery() {
        console.log('\n🚨 Testing corruption recovery workflow...');
        
        try {
            // Create backup first
            execSync('bash scripts/package-guard.sh backup', { encoding: 'utf8' });
            
            // Simulate corruption
            const corruptedPackage = {
                dependencies: { "test": "1.0.0" },
                devDependencies: {}
            };
            fs.writeFileSync('package.json', JSON.stringify(corruptedPackage, null, 2));
            
            // Test emergency recovery
            execSync('bash scripts/package-guard.sh emergency', { encoding: 'utf8' });
            
            // Verify recovery worked
            const recoveredPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            if (!recoveredPackage.name || !recoveredPackage.version || !recoveredPackage.scripts) {
                throw new Error('Recovery incomplete - missing required fields');
            }
            
            this.testResults.push({
                name: 'Corruption Recovery',
                passed: true,
                message: 'Emergency recovery workflow working'
            });
            
        } catch (error) {
            this.testResults.push({
                name: 'Corruption Recovery',
                passed: false,
                message: `Recovery workflow failed: ${error.message}`
            });
        }
    }

    cleanup() {
        console.log('\n🧹 Cleaning up integration test environment...');
        
        // Restore original package.json
        if (this.originalPackage) {
            fs.writeFileSync('package.json', this.originalPackage);
        }
        
        // Remove test files
        ['commit-message.txt', 'temp-test-script.js', '.package.lock'].forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
        
        console.log('✅ Cleanup complete');
    }
}

// Run tests if called directly
if (require.main === module) {
    const test = new PackageProtectionIntegrationTest();
    test.runIntegrationTests()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('❌ Integration test runner error:', error.message);
            process.exit(1);
        });
}

module.exports = PackageProtectionIntegrationTest;