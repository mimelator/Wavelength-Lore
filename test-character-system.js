// Test script for character reference system
const characterHelpers = require('./helpers/character-helpers');

async function runTests() {
  console.log('=== Character Reference System Test ===\n');

  // Initialize the character cache first
  await characterHelpers.initializeCharacterCache();

  console.log('1. All Characters (Async):');
  const allCharacters = await characterHelpers.getAllCharacters();
  allCharacters.forEach(char => {
    console.log(`   - ${char.name} (${char.id}): ${char.url}`);
  });

  console.log('\n2. Character Link Generation (Async):');
  const andrewLink = await characterHelpers.generateCharacterLink('andrew');
  const alexLink = await characterHelpers.generateCharacterLink('alex', 'the talented daughter');
  const invalidLink = await characterHelpers.generateCharacterLink('invalid', 'Unknown Character');
  
  console.log('   Prince Andrew:', andrewLink);
  console.log('   Alexandria (custom):', alexLink);
  console.log('   Invalid ID:', invalidLink);

  console.log('\n3. Text Processing (Async):');
  const testText = 'Prince Andrew and Jewel formed Wavelength with their children Alexandria and Eloquence. Maurice was their drummer before Daphne joined.';
  console.log('   Original:', testText);
  const processedText = await characterHelpers.linkifyCharacterMentions(testText);
  console.log('   Processed:', processedText);

  console.log('\n4. Character Lookup (Async):');
  const alexChar = await characterHelpers.getCharacterById('alex');
  const invalidChar = await characterHelpers.getCharacterById('invalid');
  console.log('   Find "alex":', alexChar);
  console.log('   Find "invalid":', invalidChar);

  console.log('\n5. Sync Versions (Backward Compatibility):');
  console.log('   Sync Characters Count:', characterHelpers.getAllCharactersSync().length);
  console.log('   Sync Andrew Link:', characterHelpers.generateCharacterLinkSync('andrew'));
  
  const syncProcessed = characterHelpers.linkifyCharacterMentionsSync('Lucky and Yeti are great friends.');
  console.log('   Sync Processed:', syncProcessed);

  console.log('\n=== Test Complete ===');
}

// Run the async tests
runTests().catch(console.error);