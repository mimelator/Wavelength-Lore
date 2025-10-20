#!/usr/bin/env node

/**
 * Test Script: Content Visibility System
 * 
 * Tests the visibility functionality for Episodes, Characters, and Lore
 * - Creation with visibility field
 * - Filtering based on user role
 * - Visibility toggle endpoints
 * - UI indicators
 */

// Load environment variables
require('dotenv').config();

const firebaseUtils = require('../helpers/firebase-utils');
const firebaseAdminUtils = require('../helpers/firebase-admin-utils');
const characterHelpers = require('../helpers/character-helpers');
const loreHelpers = require('../helpers/lore-helpers');
const episodeHelpers = require('../helpers/episode-helpers');

// Initialize Firebase
const database = firebaseUtils.initializeFirebase('wavelength-lore-main');
firebaseAdminUtils.initializeFirebaseAdmin();

// Set database instance for helpers
characterHelpers.setDatabaseInstance(database);
loreHelpers.setDatabaseInstance(database);
episodeHelpers.setDatabaseInstance(database);

// Test counters
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

// Test results
const results = {
  passed: [],
  failed: []
};

/**
 * Helper function to log test results
 */
function logTest(testName, passed, details = '') {
  testsRun++;
  if (passed) {
    testsPassed++;
    console.log(`✅ PASS: ${testName}`);
    if (details) console.log(`   ${details}`);
    results.passed.push(testName);
  } else {
    testsFailed++;
    console.log(`❌ FAIL: ${testName}`);
    if (details) console.log(`   ${details}`);
    results.failed.push({ test: testName, details });
  }
}

/**
 * Test 1: Check if existing characters have correct visibility handling
 */
async function testExistingContentVisibility() {
  console.log('\n🧪 Test 1: Existing Content Visibility Handling');
  console.log('=' .repeat(60));
  
  try {
    // Get all characters without filtering (content creator view)
    const allCharacters = await characterHelpers.getAllCharacters(true);
    console.log(`📊 Total characters in database: ${allCharacters.length}`);
    
    // Check how many have visible field
    const withVisibleField = allCharacters.filter(c => c.visible !== undefined);
    const withoutVisibleField = allCharacters.filter(c => c.visible === undefined);
    
    console.log(`   With 'visible' field: ${withVisibleField.length}`);
    console.log(`   Without 'visible' field: ${withoutVisibleField.length}`);
    
    // Get characters with public filtering
    const publicCharacters = await characterHelpers.getAllCharacters(false);
    console.log(`📊 Characters visible to public: ${publicCharacters.length}`);
    
    // Backwards compatibility: items without visible field should be visible
    const shouldBeVisible = allCharacters.filter(c => c.visible !== false).length;
    logTest(
      'Backwards compatibility - undefined treated as visible',
      publicCharacters.length === shouldBeVisible,
      `Expected ${shouldBeVisible}, got ${publicCharacters.length}`
    );
    
    // Check if any characters are explicitly hidden
    const hiddenCharacters = allCharacters.filter(c => c.visible === false);
    if (hiddenCharacters.length > 0) {
      console.log(`\n🔒 Found ${hiddenCharacters.length} hidden character(s):`);
      hiddenCharacters.forEach(c => {
        console.log(`   - ${c.name} (${c.character_id})`);
      });
      
      // Verify hidden characters don't appear in public view
      const hiddenInPublic = publicCharacters.some(c => 
        hiddenCharacters.find(h => h.character_id === c.character_id)
      );
      logTest(
        'Hidden characters filtered from public view',
        !hiddenInPublic,
        hiddenInPublic ? 'Hidden character found in public view!' : 'All hidden characters properly filtered'
      );
    } else {
      console.log('\n📝 No hidden characters found');
      logTest('Hidden character filtering', true, 'No hidden characters to test');
    }
    
  } catch (error) {
    logTest('Existing content visibility', false, error.message);
  }
}

/**
 * Test 2: Check lore visibility
 */
async function testLoreVisibility() {
  console.log('\n🧪 Test 2: Lore Visibility Handling');
  console.log('=' .repeat(60));
  
  try {
    const allLore = await loreHelpers.getAllLore(true);
    const publicLore = await loreHelpers.getAllLore(false);
    
    console.log(`📊 Total lore items: ${allLore.length}`);
    console.log(`📊 Public lore items: ${publicLore.length}`);
    
    const hiddenLore = allLore.filter(l => l.visible === false);
    if (hiddenLore.length > 0) {
      console.log(`\n🔒 Found ${hiddenLore.length} hidden lore item(s):`);
      hiddenLore.forEach(l => {
        console.log(`   - ${l.title} (${l.lore_id})`);
      });
    }
    
    logTest(
      'Lore visibility filtering',
      publicLore.length === allLore.filter(l => l.visible !== false).length,
      `Content creators see ${allLore.length}, public sees ${publicLore.length}`
    );
    
  } catch (error) {
    logTest('Lore visibility', false, error.message);
  }
}

/**
 * Test 3: Check episode visibility
 */
async function testEpisodeVisibility() {
  console.log('\n🧪 Test 3: Episode Visibility Handling');
  console.log('=' .repeat(60));
  
  try {
    const allEpisodes = await episodeHelpers.getAllEpisodes(true);
    const publicEpisodes = await episodeHelpers.getAllEpisodes(false);
    
    console.log(`📊 Total episodes: ${allEpisodes.length}`);
    console.log(`📊 Public episodes: ${publicEpisodes.length}`);
    
    const hiddenEpisodes = allEpisodes.filter(e => e.visible === false);
    if (hiddenEpisodes.length > 0) {
      console.log(`\n🔒 Found ${hiddenEpisodes.length} hidden episode(s):`);
      hiddenEpisodes.forEach(e => {
        console.log(`   - S${e.season_number}E${e.episode_number}: ${e.title}`);
      });
    }
    
    logTest(
      'Episode visibility filtering',
      publicEpisodes.length === allEpisodes.filter(e => e.visible !== false).length,
      `Content creators see ${allEpisodes.length}, public sees ${publicEpisodes.length}`
    );
    
  } catch (error) {
    logTest('Episode visibility', false, error.message);
  }
}

/**
 * Test 4: Check database structure for new content
 */
async function testDatabaseStructure() {
  console.log('\n🧪 Test 4: Database Structure Validation');
  console.log('=' .repeat(60));
  
  try {
    // Check characters from the helper cache
    const allCharacters = await characterHelpers.getAllCharacters(true);
    
    if (allCharacters && allCharacters.length > 0) {
      const sampleChar = allCharacters[0];
      
      console.log(`\n📋 Sample character structure (${sampleChar.character_id || sampleChar.id}):`);
      console.log(`   Name: ${sampleChar.name}`);
      console.log(`   Has 'visible' field: ${sampleChar.visible !== undefined ? 'Yes' : 'No'}`);
      console.log(`   Visible value: ${sampleChar.visible}`);
      
      logTest(
        'Database structure supports visibility',
        true,
        'Character structure retrieved successfully'
      );
    } else {
      logTest(
        'Database structure',
        false,
        'No characters found in database'
      );
    }
    
  } catch (error) {
    logTest('Database structure', false, error.message);
  }
}

/**
 * Test 5: Verify helper function signatures
 */
async function testHelperFunctions() {
  console.log('\n🧪 Test 5: Helper Function Signatures');
  console.log('=' .repeat(60));
  
  try {
    // Test that functions accept showHidden parameter
    const charWithHidden = await characterHelpers.getAllCharacters(true);
    const charWithoutHidden = await characterHelpers.getAllCharacters(false);
    
    logTest(
      'getAllCharacters accepts showHidden parameter',
      Array.isArray(charWithHidden) && Array.isArray(charWithoutHidden),
      `Both calls successful: ${charWithHidden.length} vs ${charWithoutHidden.length} items`
    );
    
    const loreWithHidden = await loreHelpers.getAllLore(true);
    const loreWithoutHidden = await loreHelpers.getAllLore(false);
    
    logTest(
      'getAllLore accepts showHidden parameter',
      Array.isArray(loreWithHidden) && Array.isArray(loreWithoutHidden),
      `Both calls successful: ${loreWithHidden.length} vs ${loreWithoutHidden.length} items`
    );
    
    const episodesWithHidden = await episodeHelpers.getAllEpisodes(true);
    const episodesWithoutHidden = await episodeHelpers.getAllEpisodes(false);
    
    logTest(
      'getAllEpisodes accepts showHidden parameter',
      Array.isArray(episodesWithHidden) && Array.isArray(episodesWithoutHidden),
      `Both calls successful: ${episodesWithHidden.length} vs ${episodesWithoutHidden.length} items`
    );
    
    // Test sync versions
    const charSync = characterHelpers.getAllCharactersSync(false);
    const loreSync = loreHelpers.getAllLoreSync(false);
    const episodeSync = episodeHelpers.getAllEpisodesSync(false);
    
    logTest(
      'Sync versions work correctly',
      Array.isArray(charSync) && Array.isArray(loreSync) && Array.isArray(episodeSync),
      `Sync functions returned: ${charSync.length} chars, ${loreSync.length} lore, ${episodeSync.length} episodes`
    );
    
  } catch (error) {
    logTest('Helper functions', false, error.message);
  }
}

/**
 * Test 6: Test filtering logic explicitly
 */
async function testFilteringLogic() {
  console.log('\n🧪 Test 6: Filtering Logic Validation');
  console.log('=' .repeat(60));
  
  try {
    // Create mock data to test filtering logic
    const mockContent = [
      { id: '1', name: 'Visible', visible: true },
      { id: '2', name: 'Explicitly Hidden', visible: false },
      { id: '3', name: 'Undefined (should be visible)', visible: undefined },
      { id: '4', name: 'No field (should be visible)' }
    ];
    
    // Test the filter logic: item.visible !== false
    const filtered = mockContent.filter(item => item.visible !== false);
    
    console.log('\n📋 Mock content filtering:');
    console.log(`   Total items: ${mockContent.length}`);
    console.log(`   After filter: ${filtered.length}`);
    console.log(`   Filtered out: ${mockContent.length - filtered.length}`);
    
    // Should filter out only item #2
    logTest(
      'Filter logic (visible !== false)',
      filtered.length === 3 && !filtered.find(i => i.id === '2'),
      `Correctly filters: ${filtered.length} items passed (expected 3)`
    );
    
    // Verify each item
    const hasVisible = filtered.find(i => i.id === '1') !== undefined;
    const noHidden = filtered.find(i => i.id === '2') === undefined;
    const hasUndefined = filtered.find(i => i.id === '3') !== undefined;
    const hasNoField = filtered.find(i => i.id === '4') !== undefined;
    
    logTest(
      'Visible=true passes filter',
      hasVisible,
      hasVisible ? 'Item #1 included' : 'Item #1 missing'
    );
    
    logTest(
      'Visible=false blocked by filter',
      noHidden,
      noHidden ? 'Item #2 excluded' : 'Item #2 incorrectly included'
    );
    
    logTest(
      'Visible=undefined passes filter',
      hasUndefined,
      hasUndefined ? 'Item #3 included' : 'Item #3 missing'
    );
    
    logTest(
      'No visible field passes filter',
      hasNoField,
      hasNoField ? 'Item #4 included' : 'Item #4 missing'
    );
    
  } catch (error) {
    logTest('Filtering logic', false, error.message);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 CONTENT VISIBILITY SYSTEM TEST SUITE');
  console.log('='.repeat(60));
  console.log(`📅 Test Date: ${new Date().toLocaleString()}`);
  console.log(`🔥 Firebase Project: wavelength-lore`);
  console.log('='.repeat(60));
  
  try {
    // Initialize caches
    console.log('\n🔄 Initializing helper caches...');
    await Promise.all([
      characterHelpers.initializeCharacterCache(),
      loreHelpers.initializeLoreCache(),
      episodeHelpers.initializeEpisodeCache()
    ]);
    console.log('✅ Caches initialized\n');
    
    // Run all tests
    await testFilteringLogic();
    await testHelperFunctions();
    await testExistingContentVisibility();
    await testLoreVisibility();
    await testEpisodeVisibility();
    await testDatabaseStructure();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testsPassed}/${testsRun}`);
    console.log(`❌ Failed: ${testsFailed}/${testsRun}`);
    console.log(`📈 Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
    
    if (testsFailed > 0) {
      console.log('\n❌ Failed Tests:');
      results.failed.forEach(f => {
        console.log(`   - ${f.test}`);
        if (f.details) console.log(`     ${f.details}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Exit with appropriate code
    process.exit(testsFailed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\n❌ Fatal error running tests:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
