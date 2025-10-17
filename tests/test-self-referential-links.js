// Test self-referential link prevention
const characterHelpers = require('../helpers/character-helpers');
const loreHelpers = require('../helpers/lore-helpers');
const episodeHelpers = require('../helpers/episode-helpers');
const simpleDisambiguation = require('../helpers/simple-disambiguation');

async function testSelfReferentialLinks() {
  console.log('🔍 Testing Self-Referential Link Prevention...\n');
  
  try {
    // Set up disambiguation with helper instances
    simpleDisambiguation.setHelperInstances(characterHelpers, loreHelpers, episodeHelpers);
    
    // Test 1: Character page mentioning itself
    console.log('🧪 Test 1: Lucky character page mentioning Lucky');
    const luckyText = 'Lucky the Leprechaun brings good fortune to Wavelength.';
    const luckyCurrentUrl = '/character/lucky';
    
    console.log('Text:', luckyText);
    console.log('Current URL:', luckyCurrentUrl);
    
    const luckyResult = simpleDisambiguation.applySmartLinkingSimple(luckyText, luckyCurrentUrl);
    console.log('Result:', luckyResult);
    
    if (luckyResult.includes('<a href="/character/lucky"')) {
      console.log('❌ FAIL: Created self-referential link to Lucky');
    } else if (luckyResult.includes('Lucky')) {
      console.log('✅ PASS: Lucky appears as plain text (no self-referential link)');
    } else {
      console.log('⚠️  Unexpected: Lucky not found in result');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Same text on a different page (should create link)
    console.log('🧪 Test 2: Different page mentioning Lucky');
    const differentUrl = '/episode/season1/episode1';
    
    console.log('Text:', luckyText);
    console.log('Current URL:', differentUrl);
    
    const differentResult = simpleDisambiguation.applySmartLinkingSimple(luckyText, differentUrl);
    console.log('Result:', differentResult);
    
    if (differentResult.includes('<a href="/character/lucky"')) {
      console.log('✅ PASS: Created link to Lucky (not self-referential)');
    } else {
      console.log('❌ FAIL: Should have created link to Lucky');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Lore page mentioning itself
    console.log('🧪 Test 3: The Shire lore page mentioning The Shire');
    const shireText = 'The Shire is a peaceful realm where Wavelength performs.';
    const shireCurrentUrl = '/lore/the-shire';
    
    console.log('Text:', shireText);
    console.log('Current URL:', shireCurrentUrl);
    
    const shireResult = simpleDisambiguation.applySmartLinkingSimple(shireText, shireCurrentUrl);
    console.log('Result:', shireResult);
    
    if (shireResult.includes('<a href="/lore/the-shire"')) {
      console.log('❌ FAIL: Created self-referential link to The Shire');
    } else if (shireResult.includes('The Shire')) {
      console.log('✅ PASS: The Shire appears as plain text (no self-referential link)');
    } else {
      console.log('⚠️  Unexpected: The Shire not found in result');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 4: Episode page mentioning itself  
    console.log('🧪 Test 4: My Lucky Charm episode mentioning itself');
    const episodeText = 'My Lucky Charm is the first episode of Wavelength.';
    const episodeCurrentUrl = '/season/1/episode/1';
    
    console.log('Text:', episodeText);
    console.log('Current URL:', episodeCurrentUrl);
    
    const episodeResult = simpleDisambiguation.applySmartLinkingSimple(episodeText, episodeCurrentUrl);
    console.log('Result:', episodeResult);
    
    if (episodeResult.includes('<a href="/season/1/episode/1"')) {
      console.log('❌ FAIL: Created self-referential link to episode');
    } else if (episodeResult.includes('My Lucky Charm')) {
      console.log('✅ PASS: Episode title appears as plain text (no self-referential link)');
    } else {
      console.log('⚠️  Unexpected: Episode title not found in result');
    }
    
    console.log('\n🎯 Self-referential link prevention test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testSelfReferentialLinks();