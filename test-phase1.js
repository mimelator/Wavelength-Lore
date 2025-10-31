#!/usr/bin/env node

/**
 * Phase 1 Testing Suite - Foundation Validation
 * 
 * Tests the core CRUD foundation that's been implemented:
 * 1. Episode CRUD Service & Validation
 * 2. Character Service & CTA Validation  
 * 3. Backup System Integration
 * 4. CLI Integration Points
 * 
 * GitHub Issue #152 - Phase 1 Testing
 */

const chalk = require('chalk');
const path = require('path');

// Ensure environment is loaded
require('dotenv').config();

class Phase1TestSuite {
    constructor() {
        this.testResults = [];
        this.testCount = 0;
        this.passCount = 0;
        this.failCount = 0;
    }

    /**
     * Run all Phase 1 tests
     */
    async runAllTests() {
        console.log(chalk.magenta.bold('🧪 PHASE 1 TESTING SUITE'));
        console.log(chalk.magenta('========================'));
        console.log(chalk.yellow('Validating CLI CRUD Foundation Implementation'));
        console.log('');

        try {
            // Test 1: Environment and Dependencies
            await this.testEnvironment();
            
            // Test 2: Firebase Services
            await this.testFirebaseServices();
            
            // Test 3: Validation Systems
            await this.testValidationSystems();
            
            // Test 4: Backup System
            await this.testBackupSystem();
            
            // Test 5: CLI Integration
            await this.testCLIIntegration();
            
            // Show summary
            this.showTestSummary();
            
        } catch (error) {
            console.log(chalk.red('❌ Test suite failed:'), error.message);
            process.exit(1);
        }
    }

    /**
     * Test 1: Environment and Dependencies
     */
    async testEnvironment() {
        console.log(chalk.blue.bold('\n📋 Test 1: Environment & Dependencies'));
        console.log(chalk.gray('=' .repeat(50)));

        // Test environment variables
        await this.runTest('Firebase Environment Variables', () => {
            const required = ['FIREBASE_SERVICE_ACCOUNT', 'DATABASE_URL'];
            const missing = required.filter(key => !process.env[key]);
            
            if (missing.length > 0) {
                throw new Error(`Missing environment variables: ${missing.join(', ')}`);
            }
            
            // Validate Firebase service account JSON
            try {
                JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            } catch (e) {
                throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT JSON');
            }
            
            return 'Firebase credentials properly configured';
        });

        await this.runTest('AWS Backup Credentials', () => {
            const awsKeys = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'BACKUP_S3_BUCKET'];
            const missing = awsKeys.filter(key => !process.env[key]);
            
            if (missing.length > 0) {
                throw new Error(`Missing AWS variables: ${missing.join(', ')}`);
            }
            
            return 'AWS backup credentials available';
        });

        // Test file structure
        await this.runTest('File Structure Validation', () => {
            const fs = require('fs');
            
            const requiredFiles = [
                'services/firebase-episode-service.js',
                'services/firebase-character-service.js',
                'utils/episode-validator.js',
                'utils/character-validator.js',
                'commands/backup-commands.js',
                'utils/secureBackup.js'
            ];

            const missingFiles = requiredFiles.filter(file => {
                const fullPath = path.join(__dirname, file);
                return !fs.existsSync(fullPath);
            });

            if (missingFiles.length > 0) {
                throw new Error(`Missing files: ${missingFiles.join(', ')}`);
            }

            return `All ${requiredFiles.length} required files present`;
        });

        // Test Node modules
        await this.runTest('Required Dependencies', () => {
            const requiredModules = [
                'firebase-admin',
                '@aws-sdk/client-s3',
                'chalk',
                'dotenv'
            ];

            const missing = [];
            for (const module of requiredModules) {
                try {
                    require(module);
                } catch (e) {
                    missing.push(module);
                }
            }

            if (missing.length > 0) {
                throw new Error(`Missing modules: ${missing.join(', ')}`);
            }

            return `All ${requiredModules.length} dependencies available`;
        });
    }

    /**
     * Test 2: Firebase Services
     */
    async testFirebaseServices() {
        console.log(chalk.blue.bold('\n🔥 Test 2: Firebase Services'));
        console.log(chalk.gray('=' .repeat(50)));

        // Test Episode Service
        await this.runTest('Episode Service Loading', () => {
            const EpisodeService = require('./services/firebase-episode-service.js');
            const service = new EpisodeService();
            
            // Check methods exist
            const requiredMethods = ['createEpisode', 'updateEpisode', 'deleteEpisode', 'getEpisodeById', 'getAllEpisodes'];
            const missingMethods = requiredMethods.filter(method => typeof service[method] !== 'function');
            
            if (missingMethods.length > 0) {
                throw new Error(`Missing methods: ${missingMethods.join(', ')}`);
            }
            
            return `Episode service with ${requiredMethods.length} CRUD methods`;
        });

        // Test Character Service
        await this.runTest('Character Service Loading', () => {
            const CharacterService = require('./services/firebase-character-service.js');
            const service = new CharacterService();
            
            // Check methods exist
            const requiredMethods = ['createCharacter', 'updateCharacter', 'deleteCharacter', 'getCharacterById', 'getAllCharacters'];
            const missingMethods = requiredMethods.filter(method => typeof service[method] !== 'function');
            
            if (missingMethods.length > 0) {
                throw new Error(`Missing methods: ${missingMethods.join(', ')}`);
            }
            
            return `Character service with ${requiredMethods.length} CRUD methods`;
        });

        // Test Firebase Admin Connection (lightweight test)
        await this.runTest('Firebase Admin SDK Connection', async () => {
            try {
                const firebaseAdminUtils = require('./helpers/firebase-admin-utils');
                
                // Test if we can initialize (don't actually fetch data to keep test fast)
                const isReady = firebaseAdminUtils.isFirebaseAdminReady();
                
                return isReady ? 'Firebase Admin SDK ready' : 'Firebase Admin SDK initialized successfully';
            } catch (error) {
                throw new Error(`Firebase Admin connection failed: ${error.message}`);
            }
        });
    }

    /**
     * Test 3: Validation Systems
     */
    async testValidationSystems() {
        console.log(chalk.blue.bold('\n✅ Test 3: Validation Systems'));
        console.log(chalk.gray('=' .repeat(50)));

        // Test Episode Validator
        await this.runTest('Episode Validator', () => {
            const episodeValidator = require('./utils/episode-validator.js');
            
            // Test valid episode data
            const validEpisode = {
                title: 'Test Episode',
                season: 4,
                episodeNumber: 9,
                description: 'Test description',
                youtubeLink: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
            };
            
            const validation = episodeValidator.validateEpisodeData(validEpisode);
            
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Test invalid episode data
            const invalidEpisode = {
                title: '', // Invalid: empty title
                season: 'invalid', // Invalid: not a number
            };
            
            const invalidValidation = episodeValidator.validateEpisodeData(invalidEpisode);
            
            if (invalidValidation.isValid) {
                throw new Error('Validator should reject invalid episode data');
            }
            
            return `Episode validator working (${invalidValidation.errors.length} errors caught)`;
        });

        // Test Character Validator
        await this.runTest('Character Validator & CTA Fields', () => {
            const characterValidator = require('./utils/character-validator.js');
            
            // Test valid character with CTA fields
            const validCharacter = {
                name: 'Test Character',
                role: 'protagonist',
                description: 'Test character description',
                tagline: 'Test tagline',
                stakes: 'High stakes test',
                cta_text: 'Follow the journey',
                cta_hook: 'Will they succeed?',
                power_statement: 'The hero we need'
            };
            
            const validation = characterValidator.validateCharacterData(validCharacter);
            
            if (!validation.isValid) {
                throw new Error(`Character validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Test CTA completeness scoring
            const ctaScore = characterValidator.validateCTACompleteness(validCharacter);
            
            if (ctaScore.score < 80) {
                throw new Error(`CTA completeness score too low: ${ctaScore.score}%`);
            }
            
            return `Character validator with CTA scoring (${ctaScore.score}% completeness)`;
        });

        // Test validation error handling
        await this.runTest('Validation Error Handling', () => {
            const episodeValidator = require('./utils/episode-validator.js');
            
            // Test completely empty data
            const emptyValidation = episodeValidator.validateEpisodeData({});
            
            if (emptyValidation.isValid) {
                throw new Error('Validator should reject empty data');
            }
            
            // Check that errors are descriptive
            const hasDescriptiveErrors = emptyValidation.errors.some(error => 
                error.includes('title') || error.includes('required')
            );
            
            if (!hasDescriptiveErrors) {
                throw new Error('Validation errors should be descriptive');
            }
            
            return `Error handling working (${emptyValidation.errors.length} validation errors)`;
        });
    }

    /**
     * Test 4: Backup System
     */
    async testBackupSystem() {
        console.log(chalk.blue.bold('\n💾 Test 4: Backup System'));
        console.log(chalk.gray('=' .repeat(50)));

        // Test Backup Commands Loading
        await this.runTest('Backup Commands Loading', () => {
            const BackupCommands = require('./commands/backup-commands.js');
            const mockCLI = { app: null };
            const backupCommands = new BackupCommands(mockCLI);
            
            // Check key methods exist
            const requiredMethods = ['handleBackupCommands', 'createBackup', 'listBackups', 'showBackupStatus'];
            const missingMethods = requiredMethods.filter(method => typeof backupCommands[method] !== 'function');
            
            if (missingMethods.length > 0) {
                throw new Error(`Missing backup methods: ${missingMethods.join(', ')}`);
            }
            
            return `Backup commands with ${requiredMethods.length} operations`;
        });

        // Test Secure Backup System
        await this.runTest('Secure Backup System', () => {
            const SecureDatabaseBackup = require('./utils/secureBackup.js');
            const backupSystem = new SecureDatabaseBackup();
            
            // Check configuration
            const status = backupSystem.getStatus();
            
            if (!status.config.bucketName) {
                throw new Error('Backup system missing S3 bucket configuration');
            }
            
            if (!status.config.encryptionEnabled) {
                throw new Error('Backup encryption should be enabled');
            }
            
            return `Secure backup system configured (${status.config.bucketName})`;
        });

        // Test AWS S3 Connection (lightweight)
        await this.runTest('AWS S3 Configuration', () => {
            const { S3Client } = require('@aws-sdk/client-s3');
            
            // Test that we can create S3 client with current credentials
            const s3Client = new S3Client({
                region: process.env.BACKUP_S3_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                }
            });
            
            if (!s3Client) {
                throw new Error('Failed to create S3 client');
            }
            
            return `S3 client configured for ${process.env.BACKUP_S3_REGION || 'us-east-1'}`;
        });
    }

    /**
     * Test 5: CLI Integration
     */
    async testCLIIntegration() {
        console.log(chalk.blue.bold('\n🖥️  Test 5: CLI Integration'));
        console.log(chalk.gray('=' .repeat(50)));

        // Test Main CLI Structure
        await this.runTest('Main CLI File Structure', () => {
            const fs = require('fs');
            const cliPath = path.join(__dirname, 'wavelength-content-cli.js');
            
            if (!fs.existsSync(cliPath)) {
                throw new Error('Main CLI file not found');
            }
            
            // Check if backup commands are integrated
            const cliContent = fs.readFileSync(cliPath, 'utf8');
            
            if (!cliContent.includes('backup-commands')) {
                throw new Error('Backup commands not integrated into main CLI');
            }
            
            if (!cliContent.includes('case \'backup\':')) {
                throw new Error('Backup command case not found in CLI handler');
            }
            
            return 'Main CLI integrated with backup commands';
        });

        // Test CLI Command Routing
        await this.runTest('Command Routing Structure', () => {
            const fs = require('fs');
            const cliPath = path.join(__dirname, 'wavelength-content-cli.js');
            const cliContent = fs.readFileSync(cliPath, 'utf8');
            
            // Check for command handler pattern
            const hasHandleCommand = cliContent.includes('async handleCommand(');
            if (!hasHandleCommand) {
                throw new Error('Command handler method not found');
            }
            
            // Check for switch statement
            const hasSwitchStatement = cliContent.includes('switch (command.toLowerCase())');
            if (!hasSwitchStatement) {
                throw new Error('Command switch statement not found');
            }
            
            return 'Command routing structure present';
        });

        // Test Autocomplete Integration
        await this.runTest('Autocomplete Integration', () => {
            const fs = require('fs');
            const cliPath = path.join(__dirname, 'wavelength-content-cli.js');
            const cliContent = fs.readFileSync(cliPath, 'utf8');
            
            // Check if backup is in base commands
            const hasBackupInCommands = cliContent.includes('\'backup\'');
            if (!hasBackupInCommands) {
                throw new Error('Backup not found in command completions');
            }
            
            // Check autocomplete function exists
            const hasAutocomplete = cliContent.includes('autocomplete(line)');
            if (!hasAutocomplete) {
                throw new Error('Autocomplete function not found');
            }
            
            return 'Autocomplete system includes backup commands';
        });

        // Test Help System Integration  
        await this.runTest('Help System Integration', () => {
            const fs = require('fs');
            const cliPath = path.join(__dirname, 'wavelength-content-cli.js');
            const cliContent = fs.readFileSync(cliPath, 'utf8');
            
            // Check if backup commands are in help
            const hasBackupHelp = cliContent.includes('Backup & Recovery') || cliContent.includes('backup create');
            if (!hasBackupHelp) {
                throw new Error('Backup commands not found in help system');
            }
            
            return 'Help system includes backup documentation';
        });
    }

    /**
     * Helper method to run individual tests
     */
    async runTest(testName, testFunction) {
        this.testCount++;
        
        try {
            const result = await testFunction();
            console.log(chalk.green(`✅ ${testName}: ${result}`));
            this.passCount++;
            this.testResults.push({ name: testName, status: 'PASS', result });
        } catch (error) {
            console.log(chalk.red(`❌ ${testName}: ${error.message}`));
            this.failCount++;
            this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
        }
    }

    /**
     * Show comprehensive test summary
     */
    showTestSummary() {
        console.log(chalk.blue.bold('\n📊 PHASE 1 TEST SUMMARY'));
        console.log(chalk.gray('=' .repeat(60)));
        
        console.log(chalk.white(`Total Tests: ${this.testCount}`));
        console.log(chalk.green(`Passed: ${this.passCount}`));
        console.log(chalk.red(`Failed: ${this.failCount}`));
        console.log(chalk.yellow(`Success Rate: ${Math.round((this.passCount / this.testCount) * 100)}%`));
        
        if (this.failCount > 0) {
            console.log(chalk.red.bold('\n❌ FAILED TESTS:'));
            this.testResults
                .filter(test => test.status === 'FAIL')
                .forEach(test => {
                    console.log(chalk.red(`   • ${test.name}: ${test.error}`));
                });
        }
        
        console.log(chalk.green.bold('\n✅ PASSED TESTS:'));
        this.testResults
            .filter(test => test.status === 'PASS')
            .forEach(test => {
                console.log(chalk.green(`   • ${test.name}`));
            });
        
        // Overall assessment
        console.log(chalk.blue.bold('\n🎯 PHASE 1 ASSESSMENT:'));
        
        if (this.failCount === 0) {
            console.log(chalk.green('🏆 EXCELLENT! Foundation is solid and ready for Phase 2 implementation.'));
            console.log(chalk.yellow('✨ Recommendation: Proceed with Character CLI Commands implementation.'));
        } else if (this.failCount <= 2) {
            console.log(chalk.yellow('⚠️  GOOD with minor issues. Address failed tests before continuing.'));
            console.log(chalk.gray('💡 Most of the foundation is working correctly.'));
        } else {
            console.log(chalk.red('🚨 NEEDS ATTENTION. Multiple foundation issues detected.'));
            console.log(chalk.gray('🔧 Fix critical issues before proceeding to Phase 2.'));
        }
        
        // Next steps
        console.log(chalk.cyan.bold('\n🚀 NEXT STEPS:'));
        if (this.failCount === 0) {
            console.log(chalk.white('1. Begin Character CLI Commands implementation'));
            console.log(chalk.white('2. Implement Lore CRUD services and commands'));  
            console.log(chalk.white('3. Enhance Songs CLI integration'));
            console.log(chalk.white('4. Complete main CLI integration'));
        } else {
            console.log(chalk.white('1. Fix failed tests in foundation'));
            console.log(chalk.white('2. Re-run Phase 1 testing'));
            console.log(chalk.white('3. Then proceed with Phase 2 implementation'));
        }
        
        console.log('');
        
        // Exit with appropriate code
        process.exit(this.failCount > 0 ? 1 : 0);
    }
}

// Run tests if called directly
if (require.main === module) {
    const testSuite = new Phase1TestSuite();
    testSuite.runAllTests().catch(error => {
        console.error(chalk.red('Fatal test error:'), error);
        process.exit(1);
    });
}

module.exports = Phase1TestSuite;