#!/usr/bin/env node
/**
 * Test Unified Visibility System
 * 
 * Tests the new visibility system with different user roles and scenarios
 */

require('dotenv').config();
const chalk = require('chalk');
const visibilityHelpers = require('../helpers/visibility-helpers');

// Mock test data
const testCharacters = [
    {
        id: 'test-character-1',
        name: 'Published Character',
        visibility: 'published',
        published: true,
        visible: true,
        hidden: false
    },
    {
        id: 'test-character-2',
        name: 'Preview Character',
        visibility: 'preview',
        published: false,
        visible: false,
        hidden: true
    },
    {
        id: 'test-character-3',
        name: 'Draft Character',
        visibility: 'draft',
        published: false,
        visible: false,
        hidden: true
    },
    {
        id: 'test-character-4',
        name: 'Legacy Published (old fields)',
        published: true,
        visible: true,
        hidden: false
        // No visibility field - should fallback
    },
    {
        id: 'test-character-5',
        name: 'Legacy Hidden (old fields)',
        published: false,
        visible: false,
        hidden: true
        // No visibility field - should fallback
    },
    {
        id: 'test-character-6',
        name: 'Draft with Preview Enabled',
        visibility: 'draft',
        previewEnabled: true,
        published: false,
        visible: false,
        hidden: true
    }
];

// User roles
const users = {
    public: null, // No user object
    contentCreator: {
        isContentCreator: true
    },
    previewUser: {
        isPreviewUser: true
    },
    betaTester: {
        isBetaTester: true
    },
    previewUserWithEnabled: {
        isPreviewUser: true
    }
};

console.log(chalk.blue.bold('\n🧪 TESTING UNIFIED VISIBILITY SYSTEM'));
console.log(chalk.blue('=' .repeat(60)));
console.log();

// Test 1: Visibility State Detection
console.log(chalk.yellow.bold('Test 1: Visibility State Detection'));
console.log(chalk.gray('─'.repeat(60)));
testCharacters.forEach(char => {
    const visibility = visibilityHelpers.getVisibility(char);
    const status = visibility === 'published' ? chalk.green('✓') : 
                   visibility === 'preview' ? chalk.cyan('⊙') : 
                   chalk.gray('○');
    console.log(`${status} ${char.name.padEnd(40)} → ${visibility}`);
});
console.log();

// Test 2: Public User Access
console.log(chalk.yellow.bold('Test 2: Public User Access (should see only published)'));
console.log(chalk.gray('─'.repeat(60)));
const publicVisible = visibilityHelpers.filterByVisibility(testCharacters, users.public);
console.log(chalk.white(`Expected: 2 characters (published ones)`));
console.log(chalk.white(`Actual: ${publicVisible.length} characters`));
publicVisible.forEach(char => {
    const visibility = visibilityHelpers.getVisibility(char);
    console.log(`  ✓ ${char.name} (${visibility})`);
});
if (publicVisible.length === 2 && publicVisible.every(c => visibilityHelpers.getVisibility(c) === 'published')) {
    console.log(chalk.green('✅ PASS'));
} else {
    console.log(chalk.red('❌ FAIL'));
}
console.log();

// Test 3: Content Creator Access
console.log(chalk.yellow.bold('Test 3: Content Creator Access (should see everything)'));
console.log(chalk.gray('─'.repeat(60)));
const creatorVisible = visibilityHelpers.filterByVisibility(testCharacters, users.contentCreator);
console.log(chalk.white(`Expected: ${testCharacters.length} characters (all)`));
console.log(chalk.white(`Actual: ${creatorVisible.length} characters`));
if (creatorVisible.length === testCharacters.length) {
    console.log(chalk.green('✅ PASS'));
} else {
    console.log(chalk.red('❌ FAIL'));
    console.log(chalk.red(`Missing: ${testCharacters.length - creatorVisible.length} characters`));
}
console.log();

// Test 4: Preview User Access
console.log(chalk.yellow.bold('Test 4: Preview User Access (should see preview + published)'));
console.log(chalk.gray('─'.repeat(60)));
const previewVisible = visibilityHelpers.filterByVisibility(testCharacters, users.previewUser);
console.log(chalk.white(`Expected: 3 characters (published + preview + draft with previewEnabled)`));
console.log(chalk.white(`Actual: ${previewVisible.length} characters`));
previewVisible.forEach(char => {
    const visibility = visibilityHelpers.getVisibility(char);
    console.log(`  ✓ ${char.name} (${visibility})`);
});
const expectedCount = testCharacters.filter(c => {
    const vis = visibilityHelpers.getVisibility(c);
    return vis === 'published' || vis === 'preview' || (vis === 'draft' && c.previewEnabled);
}).length;
if (previewVisible.length === expectedCount) {
    console.log(chalk.green('✅ PASS'));
} else {
    console.log(chalk.red('❌ FAIL'));
}
console.log();

// Test 5: Draft with Preview Enabled
console.log(chalk.yellow.bold('Test 5: Draft with Preview Enabled (preview user should see)'));
console.log(chalk.gray('─'.repeat(60)));
const draftWithPreview = testCharacters.find(c => c.previewEnabled === true);
if (draftWithPreview) {
    const publicCanSee = visibilityHelpers.isVisibleToUser(draftWithPreview, users.public);
    const previewCanSee = visibilityHelpers.isVisibleToUser(draftWithPreview, users.previewUser);
    const creatorCanSee = visibilityHelpers.isVisibleToUser(draftWithPreview, users.contentCreator);
    
    console.log(`Character: ${draftWithPreview.name}`);
    console.log(`  Public user: ${publicCanSee ? chalk.red('❌ CAN SEE (BAD)') : chalk.green('✓ Cannot see (GOOD)')}`);
    console.log(`  Preview user: ${previewCanSee ? chalk.green('✓ Can see (GOOD)') : chalk.red('❌ CANNOT SEE (BAD)')}`);
    console.log(`  Content creator: ${creatorCanSee ? chalk.green('✓ Can see (GOOD)') : chalk.red('❌ CANNOT SEE (BAD)')}`);
    
    if (!publicCanSee && previewCanSee && creatorCanSee) {
        console.log(chalk.green('✅ PASS'));
    } else {
        console.log(chalk.red('❌ FAIL'));
    }
} else {
    console.log(chalk.yellow('⚠️  No draft character with previewEnabled found in test data'));
}
console.log();

// Test 6: Backward Compatibility
console.log(chalk.yellow.bold('Test 6: Backward Compatibility (old fields should work)'));
console.log(chalk.gray('─'.repeat(60)));
const legacyPublished = testCharacters.find(c => !c.visibility && c.published === true);
const legacyHidden = testCharacters.find(c => !c.visibility && c.hidden === true);

if (legacyPublished) {
    const visibility = visibilityHelpers.getVisibility(legacyPublished);
    console.log(`${legacyPublished.name}: ${visibility}`);
    if (visibility === 'published') {
        console.log(chalk.green('✅ Legacy published field works'));
    } else {
        console.log(chalk.red('❌ Legacy published field not working'));
    }
}

if (legacyHidden) {
    const visibility = visibilityHelpers.getVisibility(legacyHidden);
    console.log(`${legacyHidden.name}: ${visibility}`);
    if (visibility === 'draft') {
        console.log(chalk.green('✅ Legacy hidden field works'));
    } else {
        console.log(chalk.red('❌ Legacy hidden field not working'));
    }
}
console.log();

// Test 7: Individual Visibility Checks
console.log(chalk.yellow.bold('Test 7: Individual Visibility Checks'));
console.log(chalk.gray('─'.repeat(60)));
testCharacters.slice(0, 3).forEach(char => {
    const vis = visibilityHelpers.getVisibility(char);
    const publicSee = visibilityHelpers.isVisibleToUser(char, users.public);
    const creatorSee = visibilityHelpers.isVisibleToUser(char, users.contentCreator);
    
    console.log(`${char.name} (${vis}):`);
    console.log(`  Public: ${publicSee ? chalk.green('✓') : chalk.red('✗')} | Creator: ${creatorSee ? chalk.green('✓') : chalk.red('✗')}`);
});
console.log();

// Test 8: canPreview Helper
console.log(chalk.yellow.bold('Test 8: canPreview Helper'));
console.log(chalk.gray('─'.repeat(60)));
console.log(`Public user can preview: ${visibilityHelpers.canPreview(users.public) ? chalk.red('❌') : chalk.green('✓ (no)')}`);
console.log(`Content creator can preview: ${visibilityHelpers.canPreview(users.contentCreator) ? chalk.green('✓ (yes)') : chalk.red('❌')}`);
console.log(`Preview user can preview: ${visibilityHelpers.canPreview(users.previewUser) ? chalk.green('✓ (yes)') : chalk.red('❌')}`);
console.log(`Beta tester can preview: ${visibilityHelpers.canPreview(users.betaTester) ? chalk.green('✓ (yes)') : chalk.red('❌')}`);
console.log();

// Summary
console.log(chalk.blue.bold('📊 TEST SUMMARY'));
console.log(chalk.blue('='.repeat(60)));
console.log(chalk.white('✓ Visibility state detection'));
console.log(chalk.white('✓ Public user filtering'));
console.log(chalk.white('✓ Content creator access'));
console.log(chalk.white('✓ Preview user access'));
console.log(chalk.white('✓ Draft with preview enabled'));
console.log(chalk.white('✓ Backward compatibility'));
console.log(chalk.white('✓ Individual visibility checks'));
console.log(chalk.white('✓ canPreview helper'));
console.log();
console.log(chalk.green('✅ All visibility system tests completed!'));
console.log();
console.log(chalk.cyan('💡 Next Steps:'));
console.log(chalk.gray('  1. Test with real Firebase data'));
console.log(chalk.gray('  2. Test character routes on website'));
console.log(chalk.gray('  3. Test dynamic linking in templates'));
console.log(chalk.gray('  4. Verify content creator access works'));
console.log();

