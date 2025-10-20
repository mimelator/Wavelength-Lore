// Test script for prompt importer
const PromptImporter = require('../scripts/prompt-importer');
const fs = require('fs').promises;
const path = require('path');

async function runTests() {
  console.log('=== Prompt Importer Test ===\n');

  const importer = new PromptImporter();

  try {
    // Test 1: Find markdown files
    console.log('1️⃣  Test: Find Markdown Files');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const files = await importer.findMarkdownFiles(importer.promptsDir);
    console.log(`   Found ${files.length} markdown files`);
    files.slice(0, 5).forEach(file => {
      console.log(`   - ${path.relative(importer.promptsDir, file)}`);
    });
    if (files.length > 5) {
      console.log(`   ... and ${files.length - 5} more`);
    }
    console.log('   ✅ PASSED\n');

    // Test 2: Create prompt IDs
    console.log('2️⃣  Test: Create Prompt IDs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const testCases = [
      { file: 'andrew.md', subdir: 'characters', expected: 'characters-andrew' },
      { file: 'shire-sanctuary.md', subdir: 'locations', expected: 'locations-shire-sanctuary' },
      { file: 'goblin-king.md', subdir: 'lore', expected: 'lore-goblin-king' }
    ];

    let idTestsPassed = true;
    for (const test of testCases) {
      const id = importer.createPromptId(test.file, test.subdir);
      const passed = id === test.expected;
      console.log(`   ${passed ? '✓' : '✗'} ${test.file} (${test.subdir}) → ${id}${passed ? '' : ` (expected: ${test.expected})`}`);
      if (!passed) idTestsPassed = false;
    }
    console.log(`   ${idTestsPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

    // Test 3: Category detection
    console.log('3️⃣  Test: Category Detection');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const categoryCases = [
      { path: '/content/prompts/characters/andrew.md', expected: 'character' },
      { path: '/content/prompts/wavelength/jewel.md', expected: 'character' },
      { path: '/content/prompts/locations/shire.md', expected: 'location' },
      { path: '/content/prompts/lore/villains/goblin-king.md', expected: 'villain' },
      { path: '/content/prompts/scenes/battle.md', expected: 'scene' },
      { path: '/content/prompts/other.md', expected: 'general' }
    ];

    let categoryTestsPassed = true;
    for (const test of categoryCases) {
      const category = importer.getCategoryFromPath(test.path);
      const passed = category === test.expected;
      console.log(`   ${passed ? '✓' : '✗'} ${path.basename(test.path)} → ${category}${passed ? '' : ` (expected: ${test.expected})`}`);
      if (!passed) categoryTestsPassed = false;
    }
    console.log(`   ${categoryTestsPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

    // Test 4: Character extraction
    console.log('4️⃣  Test: Character Extraction');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const characterCases = [
      { path: '/content/prompts/characters/andrew.md', expected: 'andrew' },
      { path: '/content/prompts/wavelength/jewel.md', expected: 'jewel' },
      { path: '/content/prompts/characters/alexandria.md', expected: 'alex' },
      { path: '/content/prompts/characters/lucky.md', expected: 'lucky' },
      { path: '/content/prompts/locations/shire.md', expected: null }
    ];

    let charTestsPassed = true;
    for (const test of characterCases) {
      const charId = importer.getCharacterFromPath(test.path);
      const passed = charId === test.expected;
      console.log(`   ${passed ? '✓' : '✗'} ${path.basename(test.path)} → ${charId || 'null'}${passed ? '' : ` (expected: ${test.expected})`}`);
      if (!passed) charTestsPassed = false;
    }
    console.log(`   ${charTestsPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

    // Test 5: Lore extraction
    console.log('5️⃣  Test: Lore Extraction');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const loreCases = [
      { path: '/content/prompts/lore/villains/goblin-king.md', expected: ['goblin-king'] },
      { path: '/content/prompts/locations/shire-sanctuary.md', expected: ['the-shire'] },
      { path: '/content/prompts/locations/icefortress.md', expected: ['ice-castle'] },
      { path: '/content/prompts/characters/andrew.md', expected: [] }
    ];

    let loreTestsPassed = true;
    for (const test of loreCases) {
      const loreIds = importer.getLoreFromPath(test.path);
      const passed = JSON.stringify(loreIds) === JSON.stringify(test.expected);
      console.log(`   ${passed ? '✓' : '✗'} ${path.basename(test.path)} → [${loreIds.join(', ')}]${passed ? '' : ` (expected: [${test.expected.join(', ')}])`}`);
      if (!passed) loreTestsPassed = false;
    }
    console.log(`   ${loreTestsPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

    // Test 6: Keyword extraction
    console.log('6️⃣  Test: Keyword Extraction');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const contentSample = `
A hyper-detailed, photorealistic spring forest at golden hour.
The half-elf is playing a glowing guitar with magical energy.
    `.trim();

    const keywords = importer.extractKeywordsFromContent(contentSample, 'test-prompt');
    console.log(`   Extracted keywords: ${keywords.join(', ')}`);

    const expectedKeywords = ['golden hour', 'photorealistic', 'half-elf', 'magical', 'guitar'];
    const foundExpected = expectedKeywords.filter(k => keywords.includes(k));
    console.log(`   ✓ Found ${foundExpected.length}/${expectedKeywords.length} expected keywords`);
    console.log(`   ✅ PASSED\n`);

    // Test 7: Tag extraction
    console.log('7️⃣  Test: Tag Extraction');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const tagContent = `
A photorealistic concert performance with magical glowing instruments.
The band is performing on stage with energy radiating from their instruments.
    `.trim();

    const tags = importer.extractTags(tagContent, '/locations/shire-amphitheater.md');
    console.log(`   Extracted tags: ${tags.join(', ')}`);

    const expectedTags = ['performance', 'magical', 'realistic', 'shire'];
    const foundTags = expectedTags.filter(t => tags.includes(t));
    console.log(`   ✓ Found ${foundTags.length}/${expectedTags.length} expected tags`);
    console.log(`   ✅ PASSED\n`);

    // Test 8: Version extraction
    console.log('8️⃣  Test: Version Extraction');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const versionCases = [
      { content: 'VERSION ONE\nSome content', expected: 1 },
      { content: 'VERSION TWO\nMore content', expected: 2 },
      { content: 'VERSION THREE\nEven more', expected: 3 },
      { content: 'No version here', expected: 1 }
    ];

    let versionTestsPassed = true;
    for (const test of versionCases) {
      const version = importer.extractVersion(test.content);
      const passed = version === test.expected;
      console.log(`   ${passed ? '✓' : '✗'} "${test.content.split('\n')[0]}" → v${version}${passed ? '' : ` (expected: v${test.expected})`}`);
      if (!passed) versionTestsPassed = false;
    }
    console.log(`   ${versionTestsPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

    // Test 9: Title creation
    console.log('9️⃣  Test: Title Creation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const titleCases = [
      { input: 'andrew-golden-hour', expected: 'Andrew Golden Hour' },
      { input: 'shire-sanctuary', expected: 'Shire Sanctuary' },
      { input: 'goblin-king', expected: 'Goblin King' }
    ];

    let titleTestsPassed = true;
    for (const test of titleCases) {
      const title = importer.createTitle(test.input);
      const passed = title === test.expected;
      console.log(`   ${passed ? '✓' : '✗'} "${test.input}" → "${title}"${passed ? '' : ` (expected: "${test.expected}")`}`);
      if (!passed) titleTestsPassed = false;
    }
    console.log(`   ${titleTestsPassed ? '✅ PASSED' : '❌ FAILED'}\n`);

    // Test 10: Parse actual markdown file
    console.log('🔟 Test: Parse Real Markdown File');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (files.length > 0) {
      const testFile = files[0];
      console.log(`   Parsing: ${path.relative(importer.promptsDir, testFile)}`);

      const prompt = await importer.parseMarkdownFile(testFile);

      if (prompt) {
        console.log(`   ✓ ID: ${prompt.id}`);
        console.log(`   ✓ Title: ${prompt.title}`);
        console.log(`   ✓ Category: ${prompt.category}`);
        console.log(`   ✓ Keywords: ${prompt.keywords.length} keywords`);
        console.log(`   ✓ Tags: ${prompt.tags.length} tags`);
        console.log(`   ✓ Characters: ${prompt.linkedCharacters.join(', ') || 'none'}`);
        console.log(`   ✓ Lore: ${prompt.linkedLore.join(', ') || 'none'}`);
        console.log(`   ✓ Version: ${prompt.version}`);
        console.log(`   ✓ Content length: ${prompt.content.length} characters`);
        console.log('   ✅ PASSED');
      } else {
        console.log('   ❌ FAILED: Could not parse file');
      }
    } else {
      console.log('   ⏭️  SKIPPED: No markdown files found');
    }
    console.log('');

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Test Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Markdown files found: ${files.length}`);
    console.log(`ID generation: ${idTestsPassed ? 'PASSED' : 'FAILED'}`);
    console.log(`Category detection: ${categoryTestsPassed ? 'PASSED' : 'FAILED'}`);
    console.log(`Character extraction: ${charTestsPassed ? 'PASSED' : 'FAILED'}`);
    console.log(`Lore extraction: ${loreTestsPassed ? 'PASSED' : 'FAILED'}`);
    console.log(`Version extraction: ${versionTestsPassed ? 'PASSED' : 'FAILED'}`);
    console.log(`Title creation: ${titleTestsPassed ? 'PASSED' : 'FAILED'}`);
    console.log('\n✅ All Tests Complete!\n');

    console.log('💡 To import these prompts to Firebase, run:');
    console.log('   node scripts/prompt-importer.js --dry-run  (preview)');
    console.log('   node scripts/prompt-importer.js             (actual import)\n');

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
