#!/usr/bin/env node

/**
 * Test script for Asset Extraction Pipeline
 * 
 * Validates that asset extraction workflow works correctly:
 * - Module imports and initialization
 * - Gallery browser workflow
 * - Asset extraction service
 * - Approval workflow components
 * 
 * Usage: node scripts/test-asset-extraction.js
 */

const chalk = require('chalk');
const path = require('path');

console.log(chalk.cyan.bold('\n🧪 ASSET EXTRACTION PIPELINE TEST'));
console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

let testsPassed = 0;
let testsFailed = 0;
const errors = [];

/**
 * Test helper
 */
function test(name, fn) {
    try {
        fn();
        console.log(chalk.green(`✅ ${name}`));
        testsPassed++;
    } catch (error) {
        console.log(chalk.red(`❌ ${name}`));
        console.log(chalk.gray(`   Error: ${error.message}`));
        testsFailed++;
        errors.push({ name, error: error.message });
    }
}

/**
 * Test 1: Asset Extraction Service Import
 */
test('Asset Extraction Service can be imported', () => {
    const AssetExtractionService = require('../services/asset-extraction-service');
    if (typeof AssetExtractionService !== 'function') {
        throw new Error('AssetExtractionService should be a class/function');
    }
});

/**
 * Test 2: Asset Extraction Service Instantiation
 */
test('Asset Extraction Service can be instantiated', () => {
    const AssetExtractionService = require('../services/asset-extraction-service');
    const service = new AssetExtractionService();
    if (!service) {
        throw new Error('Service instance not created');
    }
    if (!service.s3Client) {
        throw new Error('S3 client not initialized');
    }
});

/**
 * Test 3: Episode Commands Import
 */
test('Episode Commands can be imported', () => {
    const EpisodeCommands = require('../commands/episodes-commands');
    if (typeof EpisodeCommands !== 'function') {
        throw new Error('EpisodeCommands should be a class/function');
    }
});

/**
 * Test 4: Episode Commands Instantiation (Mock CLI)
 */
test('Episode Commands can be instantiated', () => {
    const EpisodeCommands = require('../commands/episodes-commands');
    const mockCLI = {
        promptUser: async (question) => {
            return '';
        }
    };
    const commands = new EpisodeCommands(mockCLI);
    if (!commands) {
        throw new Error('EpisodeCommands instance not created');
    }
    if (!commands.handleEpisodeCommands) {
        throw new Error('handleEpisodeCommands method missing');
    }
});

/**
 * Test 5: Required Helper Modules
 */
test('Firebase Admin Utils can be imported', () => {
    const firebaseAdminUtils = require('../helpers/firebase-admin-utils');
    if (!firebaseAdminUtils) {
        throw new Error('firebase-admin-utils module not found');
    }
    if (typeof firebaseAdminUtils.fetchDataAsAdmin !== 'function') {
        throw new Error('fetchDataAsAdmin method missing');
    }
});

/**
 * Test 6: Lore Helpers Module
 */
test('Lore Helpers can be imported', () => {
    const loreHelpers = require('../helpers/lore-helpers');
    if (!loreHelpers) {
        throw new Error('lore-helpers module not found');
    }
});

/**
 * Test 7: Asset Extraction Service Methods
 */
test('Asset Extraction Service has required methods', () => {
    const AssetExtractionService = require('../services/asset-extraction-service');
    const service = new AssetExtractionService();
    
    const requiredMethods = [
        'extractEpisodeAssets',
        'approveAndSaveAssets',
        'createPreviewHTML',
        'bufferToDataUrl'
    ];
    
    for (const method of requiredMethods) {
        if (typeof service[method] !== 'function') {
            throw new Error(`Method ${method} is missing or not a function`);
        }
    }
});

/**
 * Test 8: Episode Commands Extract Method
 */
test('Episode Commands has extractAssets method', () => {
    const EpisodeCommands = require('../commands/episodes-commands');
    const mockCLI = {
        promptUser: async (question) => {
            return '';
        }
    };
    const commands = new EpisodeCommands(mockCLI);
    
    if (typeof commands.extractAssets !== 'function') {
        throw new Error('extractAssets method missing');
    }
    
    if (typeof commands.selectSourceImageAndEpisode !== 'function') {
        throw new Error('selectSourceImageAndEpisode method missing');
    }
});

/**
 * Test 9: Asset Extraction Service Asset Specs
 */
test('Asset Extraction Service has asset specifications', () => {
    const AssetExtractionService = require('../services/asset-extraction-service');
    const service = new AssetExtractionService();
    
    if (!service.assetSpecs) {
        throw new Error('assetSpecs not defined');
    }
    
    if (!service.assetSpecs.navigationIcons) {
        throw new Error('navigationIcons spec missing');
    }
    
    if (!service.assetSpecs.badges) {
        throw new Error('badges spec missing');
    }
    
    if (!service.assetSpecs.gameAssets) {
        throw new Error('gameAssets spec missing');
    }
});

/**
 * Test 10: Environment Variables Check
 */
test('Required environment variables are documented', () => {
    const requiredEnvVars = [
        'AWS_REGION',
        'ACCESS_KEY_ID',
        'SECRET_ACCESS_KEY',
        'S3_BUCKET_NAME'
    ];
    
    // Just check that these are mentioned in code, not that they're set
    // (since they might not be set in test environment)
    const serviceFile = require('fs').readFileSync(
        path.join(__dirname, '../services/asset-extraction-service.js'),
        'utf8'
    );
    
    for (const envVar of requiredEnvVars) {
        if (!serviceFile.includes(envVar)) {
            throw new Error(`Environment variable ${envVar} not referenced in service`);
        }
    }
});

/**
 * Test 11: Buffer to Data URL Conversion
 */
test('Buffer to Data URL conversion works', () => {
    const AssetExtractionService = require('../services/asset-extraction-service');
    const service = new AssetExtractionService();
    
    const testBuffer = Buffer.from('test image data');
    const dataUrl = service.bufferToDataUrl(testBuffer, 'image/png');
    
    if (!dataUrl.startsWith('data:image/png;base64,')) {
        throw new Error('Data URL format incorrect');
    }
    
    // Verify base64 decoding works
    const base64Part = dataUrl.split(',')[1];
    const decoded = Buffer.from(base64Part, 'base64');
    if (!decoded.equals(testBuffer)) {
        throw new Error('Base64 encoding/decoding mismatch');
    }
});

/**
 * Test 12: Module Path Validation
 */
test('All module paths are correct', () => {
    const episodesCommandsFile = require('fs').readFileSync(
        path.join(__dirname, '../commands/episodes-commands.js'),
        'utf8'
    );
    
    // Check for incorrect paths
    if (episodesCommandsFile.includes('../services/firebase-admin-utils')) {
        throw new Error('Incorrect path: ../services/firebase-admin-utils (should be ../helpers/firebase-admin-utils)');
    }
    
    if (episodesCommandsFile.includes('../utils/lore-helpers')) {
        throw new Error('Incorrect path: ../utils/lore-helpers (should be ../helpers/lore-helpers)');
    }
});

// Summary
console.log(chalk.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
console.log(chalk.cyan.bold('\n📊 TEST SUMMARY\n'));

if (testsFailed === 0) {
    console.log(chalk.green.bold(`✅ All ${testsPassed} tests passed!`));
    console.log(chalk.gray('\nThe asset extraction pipeline is properly configured and ready to use.'));
    console.log(chalk.gray('You can test it with: episodes extract'));
    process.exit(0);
} else {
    console.log(chalk.green(`✅ Passed: ${testsPassed}`));
    console.log(chalk.red(`❌ Failed: ${testsFailed}\n`));
    
    if (errors.length > 0) {
        console.log(chalk.yellow('Failed Tests:'));
        errors.forEach(({ name, error }) => {
            console.log(chalk.red(`  ❌ ${name}`));
            console.log(chalk.gray(`     ${error}`));
        });
    }
    
    console.log(chalk.yellow('\n💡 Fix the errors above and run the test again.'));
    process.exit(1);
}

