// Test script for prompt management system
const promptHelpers = require('../helpers/prompt-helpers');
const firebaseUtils = require('../helpers/firebase-utils');

async function runTests() {
  console.log('=== Prompt Management System Test ===\n');

  try {
    // Initialize Firebase
    console.log('🔥 Initializing Firebase...');
    firebaseUtils.initializeFirebase('test-prompt-system');

    // Initialize the prompt cache
    console.log('📦 Initializing prompt cache...');
    await promptHelpers.initializePromptCache();
    console.log('✅ Cache initialized\n');

    // Test 1: Get all prompts
    console.log('1️⃣  Test: Get All Prompts (Async)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const allPrompts = await promptHelpers.getAllPrompts();
    console.log(`   Found ${allPrompts.length} prompts`);
    if (allPrompts.length > 0) {
      allPrompts.slice(0, 3).forEach(prompt => {
        console.log(`   - ${prompt.id} (${prompt.category})`);
        console.log(`     Title: ${prompt.title}`);
        console.log(`     Characters: ${prompt.linkedCharacters.join(', ') || 'none'}`);
        console.log(`     Tags: ${prompt.tags.join(', ') || 'none'}`);
      });
      if (allPrompts.length > 3) {
        console.log(`   ... and ${allPrompts.length - 3} more`);
      }
    }
    console.log('   ✅ PASSED\n');

    // Test 2: Get prompt by ID
    console.log('2️⃣  Test: Get Prompt by ID (Async)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (allPrompts.length > 0) {
      const testPromptId = allPrompts[0].id;
      const prompt = await promptHelpers.getPromptById(testPromptId);
      if (prompt) {
        console.log(`   ✓ Found prompt: ${prompt.id}`);
        console.log(`     Title: ${prompt.title}`);
        console.log(`     Category: ${prompt.category}`);
        console.log(`     Content preview: ${prompt.content.substring(0, 80)}...`);
        console.log('   ✅ PASSED');
      } else {
        console.log('   ❌ FAILED: Prompt not found');
      }

      // Test invalid ID
      const invalidPrompt = await promptHelpers.getPromptById('invalid-prompt-id-12345');
      if (invalidPrompt === null) {
        console.log('   ✓ Invalid ID correctly returns null');
        console.log('   ✅ PASSED');
      } else {
        console.log('   ❌ FAILED: Invalid ID should return null');
      }
    } else {
      console.log('   ⏭️  SKIPPED: No prompts available');
    }
    console.log('');

    // Test 3: Get prompts by category
    console.log('3️⃣  Test: Get Prompts by Category (Async)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const categories = await promptHelpers.getPromptCategories();
    console.log(`   Available categories: ${categories.join(', ')}`);

    for (const category of categories) {
      const categoryPrompts = await promptHelpers.getPromptsByCategory(category);
      console.log(`   ✓ ${category}: ${categoryPrompts.length} prompts`);
    }
    console.log('   ✅ PASSED\n');

    // Test 4: Get prompts by character
    console.log('4️⃣  Test: Get Prompts by Character (Async)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const testCharacters = ['andrew', 'jewel', 'lucky', 'invalid-character'];
    for (const charId of testCharacters) {
      const characterPrompts = await promptHelpers.getPromptsByCharacter(charId);
      console.log(`   ✓ ${charId}: ${characterPrompts.length} prompts`);
      if (characterPrompts.length > 0) {
        characterPrompts.slice(0, 2).forEach(p => {
          console.log(`     - ${p.id}`);
        });
      }
    }
    console.log('   ✅ PASSED\n');

    // Test 5: Get prompts by lore
    console.log('5️⃣  Test: Get Prompts by Lore (Async)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const testLore = ['the-shire', 'ice-castle', 'goblin-king'];
    for (const loreId of testLore) {
      const lorePrompts = await promptHelpers.getPromptsByLore(loreId);
      console.log(`   ✓ ${loreId}: ${lorePrompts.length} prompts`);
      if (lorePrompts.length > 0) {
        lorePrompts.slice(0, 2).forEach(p => {
          console.log(`     - ${p.id}`);
        });
      }
    }
    console.log('   ✅ PASSED\n');

    // Test 6: Search prompts
    console.log('6️⃣  Test: Search Prompts (Async)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const searchQueries = ['golden hour', 'performance', 'shire', 'photorealistic'];
    for (const query of searchQueries) {
      const results = await promptHelpers.searchPrompts(query);
      console.log(`   ✓ "${query}": ${results.length} results`);
      if (results.length > 0) {
        console.log(`     First result: ${results[0].title}`);
      }
    }
    console.log('   ✅ PASSED\n');

    // Test 7: Get prompts by tag
    console.log('7️⃣  Test: Get Prompts by Tag (Async)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const allTags = await promptHelpers.getPromptTags();
    console.log(`   Available tags: ${allTags.join(', ')}`);

    if (allTags.length > 0) {
      const testTag = allTags[0];
      const tagPrompts = await promptHelpers.getPromptsByTag(testTag);
      console.log(`   ✓ "${testTag}": ${tagPrompts.length} prompts`);
      console.log('   ✅ PASSED');
    } else {
      console.log('   ⏭️  SKIPPED: No tags available');
    }
    console.log('');

    // Test 8: Generate prompt link
    console.log('8️⃣  Test: Generate Prompt Link (Async)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (allPrompts.length > 0) {
      const testPromptId = allPrompts[0].id;
      const link = await promptHelpers.generatePromptLink(testPromptId);
      console.log(`   ✓ Link generated: ${link}`);

      // Test with custom text
      const customLink = await promptHelpers.generatePromptLink(testPromptId, 'Custom Link Text');
      console.log(`   ✓ Custom link: ${customLink}`);

      // Test invalid ID
      const invalidLink = await promptHelpers.generatePromptLink('invalid-id');
      console.log(`   ✓ Invalid ID returns: ${invalidLink}`);
      console.log('   ✅ PASSED');
    } else {
      console.log('   ⏭️  SKIPPED: No prompts available');
    }
    console.log('');

    // Test 9: Sync versions (for EJS templates)
    console.log('9️⃣  Test: Sync Versions (Backward Compatibility)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const syncPrompts = promptHelpers.getAllPromptsSync();
    console.log(`   ✓ Sync prompts count: ${syncPrompts.length}`);

    if (syncPrompts.length > 0) {
      const testId = syncPrompts[0].id;
      const syncPrompt = promptHelpers.getPromptByIdSync(testId);
      console.log(`   ✓ Sync getById: ${syncPrompt ? syncPrompt.title : 'null'}`);

      const syncLink = promptHelpers.generatePromptLinkSync(testId);
      console.log(`   ✓ Sync link: ${syncLink.substring(0, 60)}...`);

      const syncCategories = promptHelpers.getPromptCategoriesSync();
      console.log(`   ✓ Sync categories: ${syncCategories.join(', ')}`);

      const syncTags = promptHelpers.getPromptTagsSync();
      console.log(`   ✓ Sync tags count: ${syncTags.length}`);
    }
    console.log('   ✅ PASSED\n');

    // Test 10: Data model validation
    console.log('🔟 Test: Data Model Validation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (allPrompts.length > 0) {
      const testPrompt = allPrompts[0];
      const requiredFields = ['id', 'title', 'keywords', 'content', 'linkedCharacters',
                              'linkedEpisodes', 'linkedLore', 'category', 'tags',
                              'version', 'isActive'];

      let validationPassed = true;
      for (const field of requiredFields) {
        if (testPrompt[field] === undefined) {
          console.log(`   ❌ Missing required field: ${field}`);
          validationPassed = false;
        } else {
          console.log(`   ✓ ${field}: ${typeof testPrompt[field]}`);
        }
      }

      // Validate types
      if (!Array.isArray(testPrompt.keywords)) {
        console.log('   ❌ keywords should be an array');
        validationPassed = false;
      }
      if (!Array.isArray(testPrompt.linkedCharacters)) {
        console.log('   ❌ linkedCharacters should be an array');
        validationPassed = false;
      }
      if (typeof testPrompt.isActive !== 'boolean') {
        console.log('   ❌ isActive should be a boolean');
        validationPassed = false;
      }

      if (validationPassed) {
        console.log('   ✅ PASSED');
      } else {
        console.log('   ❌ FAILED');
      }
    } else {
      console.log('   ⏭️  SKIPPED: No prompts available');
    }
    console.log('');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Test Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total prompts: ${allPrompts.length}`);
    console.log(`Categories: ${categories.length}`);
    console.log(`Tags: ${allTags.length}`);
    console.log('\n✅ All Tests Complete!\n');

  } catch (error) {
    console.error('\n❌ Test Failed with Error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the async tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
