#!/usr/bin/env node

/**
 * Package.json Protection System Test
 * Validates backup, validation, and recovery functionality
 */

const fs = require('fs');
const path = require('path');
const PackageProtector = require('../scripts/unified/package-protector');

class PackageProtectionTest {
    constructor() {
        this.protector = new PackageProtector();
        this.testDir = path.join(process.cwd(), '.test-package-protection');
        this.originalPackage = null;
    }

    async runTests() {
        console.log('🧪 Testing Package.json Protection System\n');
        
        try {
            this.setup();
            await this.testBackup();
            await this.testValidation();
            await this.testCorruptionDetection();
            await this.testRecovery();
            await this.testLocking();
            this.cleanup();
            
            console.log('\n✅ All package protection tests PASSED');
            return true;
        } catch (error) {
            console.error('\n❌ Package protection test FAILED:', error.message);
            this.cleanup();
            return false;
        }
    }

    setup() {
        console.log('📋 Setting up test environment...');
        
        // Backup original package.json
        this.originalPackage = fs.readFileSync('package.json', 'utf8');
        
        // Create test directory
        if (!fs.existsSync(this.testDir)) {
            fs.mkdirSync(this.testDir, { recursive: true });
        }
        
        console.log('✅ Test environment ready');
    }

    async testBackup() {
        console.log('\n🛡️ Testing backup functionality...');
        
        // Create backup
        const backupPath = this.protector.backup();
        
        // Verify backup exists
        if (!fs.existsSync(backupPath)) {
            throw new Error('Backup file not created');
        }
        
        // Verify backup content matches original
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        if (backupContent !== this.originalPackage) {
            throw new Error('Backup content does not match original');
        }
        
        console.log('✅ Backup functionality working');
    }

    async testValidation() {
        console.log('\n🔍 Testing validation functionality...');
        
        // Test valid package.json
        const validResult = this.protector.validate();
        if (!validResult.valid) {
            throw new Error('Valid package.json failed validation');
        }
        
        console.log('✅ Validation functionality working');
    }

    async testCorruptionDetection() {
        console.log('\n🚨 Testing corruption detection...');
        
        // Create corrupted package.json
        const corruptedPackage = {
            dependencies: { "test": "1.0.0" },
            devDependencies: {}
        };
        
        fs.writeFileSync('package.json', JSON.stringify(corruptedPackage, null, 2));
        
        // Test corruption detection
        const corruptResult = this.protector.validate();
        if (corruptResult.valid) {
            throw new Error('Corrupted package.json passed validation');
        }
        
        if (!corruptResult.corruption) {
            throw new Error('Corruption not detected');
        }
        
        console.log('✅ Corruption detection working');
    }

    async testRecovery() {
        console.log('\n🔄 Testing recovery functionality...');
        
        // Test backup recovery
        this.protector.restore();
        
        // Verify recovery worked
        const recoveredResult = this.protector.validate();
        if (!recoveredResult.valid) {
            throw new Error('Recovery failed - package.json still invalid');
        }
        
        const recoveredContent = fs.readFileSync('package.json', 'utf8');
        const recoveredPackage = JSON.parse(recoveredContent);
        
        if (!recoveredPackage.name || !recoveredPackage.version) {
            throw new Error('Recovery incomplete - missing required fields');
        }
        
        console.log('✅ Recovery functionality working');
    }

    async testLocking() {
        console.log('\n🔒 Testing file locking...');
        
        // Test lock acquisition
        this.protector.lock();
        
        // Verify lock file exists
        if (!fs.existsSync('.package.lock')) {
            throw new Error('Lock file not created');
        }
        
        // Test lock conflict detection
        try {
            const secondProtector = new PackageProtector();
            secondProtector.lock();
            throw new Error('Second lock should have failed');
        } catch (error) {
            if (!error.message.includes('locked by')) {
                throw new Error('Lock conflict not properly detected');
            }
        }
        
        // Test unlock
        this.protector.unlock();
        if (fs.existsSync('.package.lock')) {
            throw new Error('Lock file not removed');
        }
        
        console.log('✅ File locking working');
    }

    cleanup() {
        console.log('\n🧹 Cleaning up test environment...');
        
        // Restore original package.json
        if (this.originalPackage) {
            fs.writeFileSync('package.json', this.originalPackage);
        }
        
        // Remove test files
        if (fs.existsSync('.package.lock')) {
            fs.unlinkSync('.package.lock');
        }
        
        // Clean test backups
        if (fs.existsSync('.package-backups')) {
            const backups = fs.readdirSync('.package-backups');
            backups.forEach(backup => {
                fs.unlinkSync(path.join('.package-backups', backup));
            });
        }
        
        console.log('✅ Cleanup complete');
    }
}

// Run tests if called directly
if (require.main === module) {
    const test = new PackageProtectionTest();
    test.runTests()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('❌ Test runner error:', error.message);
            process.exit(1);
        });
}

module.exports = PackageProtectionTest;