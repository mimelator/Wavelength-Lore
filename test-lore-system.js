// Test script for lore reference system
const loreHelpers = require('./helpers/lore-helpers');

async function runLoreTests() {
  console.log('=== Lore Reference System Test ===\n');

  // Initialize the lore cache first
  await loreHelpers.initializeLoreCache();

  console.log('1. All Lore (Async):');
  const allLore = await loreHelpers.getAllLore();
  allLore.forEach(loreItem => {
    console.log(`   - ${loreItem.name} (${loreItem.id}) [${loreItem.type}]: ${loreItem.url}`);
  });

  console.log('\n2. Lore Link Generation (Async):');
  const shireLink = await loreHelpers.generateLoreLink('the-shire');
  const castleLink = await loreHelpers.generateLoreLink('ice-castle', 'the frozen fortress');
  const invalidLink = await loreHelpers.generateLoreLink('invalid', 'Unknown Place');
  
  console.log('   The Shire:', shireLink);
  console.log('   Ice Castle (custom):', castleLink);
  console.log('   Invalid ID:', invalidLink);

  console.log('\n3. Text Processing (Async):');
  const testText = 'The Shire is a peaceful place where Wavelength first performed. The Ice Castle holds ancient Music Magic that few understand.';
  console.log('   Original:', testText);
  const processedText = await loreHelpers.linkifyLoreMentions(testText);
  console.log('   Processed:', processedText);

  console.log('\n4. Lore Lookup (Async):');
  const shireData = await loreHelpers.getLoreById('the-shire');
  const invalidLore = await loreHelpers.getLoreById('invalid');
  console.log('   Find "the-shire":', shireData);
  console.log('   Find "invalid":', invalidLore);

  console.log('\n5. Lore by Type (Async):');
  const places = await loreHelpers.getLoreByType('place');
  const concepts = await loreHelpers.getLoreByType('concept');
  console.log('   Places:', places.map(p => p.name));
  console.log('   Concepts:', concepts.map(c => c.name));

  console.log('\n6. Sync Versions (Backward Compatibility):');
  console.log('   Sync Lore Count:', loreHelpers.getAllLoreSync().length);
  console.log('   Sync Shire Link:', loreHelpers.generateLoreLinkSync('the-shire'));
  
  const syncProcessed = loreHelpers.linkifyLoreMentionsSync('Wavelength uses Music Magic in their performances.');
  console.log('   Sync Processed:', syncProcessed);

  console.log('\n7. Combined Character + Lore Processing:');
  const characterHelpers = require('./helpers/character-helpers');
  await characterHelpers.initializeCharacterCache();
  
  const combinedText = 'Prince Andrew learned Music Magic in The Shire and later visited the Ice Castle with Jewel.';
  const charProcessed = characterHelpers.linkifyCharacterMentionsSync(combinedText);
  const fullProcessed = loreHelpers.linkifyLoreMentionsSync(charProcessed);
  console.log('   Original:', combinedText);
  console.log('   With Characters + Lore:', fullProcessed);

  console.log('\n=== Lore Test Complete ===');
}

// Run the async tests
runLoreTests().catch(console.error);