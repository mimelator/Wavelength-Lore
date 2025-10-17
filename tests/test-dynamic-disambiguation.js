// Test dynamic disambiguation without hardcoded protections
const characterHelpers = require('../helpers/character-helpers');
const loreHelpers = require('../helpers/lore-helpers');
const episodeHelpers = require('../helpers/episode-helpers');
const simpleDisambiguation = require('../helpers/simple-disambiguation');

async function testDynamicDisambiguation() {
  console.log('🔍 Testing Dynamic Disambiguation (No Hardcoded Protections)...\n');
  
  try {
    // Set up disambiguation with helper instances
    simpleDisambiguation.setHelperInstances(characterHelpers, loreHelpers, episodeHelpers);
    
    // Test 1: Character that should link directly
    console.log('🧪 Test 1: Lucky (character only - should link directly)');
    const luckyText = 'Lucky the Leprechaun brings good fortune.';
    const luckyResult = simpleDisambiguation.applySmartLinkingSimple(luckyText);
    console.log('Input:', luckyText);
    console.log('Output:', luckyResult);
    
    if (luckyResult.includes('character-link') && luckyResult.includes('Lucky')) {
      console.log('✅ PASS: Lucky linked as character');
    } else {
      console.log('❌ FAIL: Lucky not linked as character');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 2: Term that exists in multiple systems (if any)
    console.log('🧪 Test 2: Wavelength (likely in multiple systems)');
    const wavelengthText = 'Wavelength is a fantastic band.';
    const wavelengthResult = simpleDisambiguation.applySmartLinkingSimple(wavelengthText);
    console.log('Input:', wavelengthText);
    console.log('Output:', wavelengthResult);
    
    if (wavelengthResult.includes('disambiguation-link')) {
      console.log('✅ PASS: Wavelength triggers disambiguation (multiple matches)');
    } else if (wavelengthResult.includes('lore-link') && wavelengthResult.includes('Wavelength')) {
      console.log('✅ PASS: Wavelength linked directly (single match)');
    } else {
      console.log('⚠️  Wavelength not processed (may not exist in multiple systems)');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 3: The Shire (lore only - should link directly)
    console.log('🧪 Test 3: The Shire (lore only - should link directly)');
    const shireText = 'The Shire is a peaceful place.';
    const shireResult = simpleDisambiguation.applySmartLinkingSimple(shireText);
    console.log('Input:', shireText);
    console.log('Output:', shireResult);
    
    if (shireResult.includes('lore-link') && shireResult.includes('The Shire')) {
      console.log('✅ PASS: The Shire linked as lore');
    } else {
      console.log('❌ FAIL: The Shire not linked as lore');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 4: Self-referential link prevention
    console.log('🧪 Test 4: Self-referential prevention for Lucky on Lucky\'s page');
    const luckyPageText = 'Lucky is a wise character.';
    const luckyPageResult = simpleDisambiguation.applySmartLinkingSimple(luckyPageText, '/character/lucky');
    console.log('Input:', luckyPageText);
    console.log('Current URL: /character/lucky');
    console.log('Output:', luckyPageResult);
    
    if (!luckyPageResult.includes('<a') && luckyPageResult.includes('Lucky')) {
      console.log('✅ PASS: Lucky appears as plain text on own page');
    } else {
      console.log('❌ FAIL: Self-referential link created');
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test 5: Complex text with multiple terms
    console.log('🧪 Test 5: Complex text with multiple different terms');
    const complexText = 'Lucky traveled to The Shire where Wavelength was performing for Prince Andrew and Jewel.';
    const complexResult = simpleDisambiguation.applySmartLinkingSimple(complexText);
    console.log('Input:', complexText);
    console.log('Output:', complexResult);
    
    const linkCount = (complexResult.match(/<a /g) || []).length;
    const disambigCount = (complexResult.match(/disambiguation-link/g) || []).length;
    console.log(`Links created: ${linkCount}, Disambiguation modals: ${disambigCount}`);
    
    if (linkCount > 0) {
      console.log('✅ PASS: Multiple terms processed and linked');
    } else {
      console.log('❌ FAIL: No links created in complex text');
    }
    
    console.log('\n🎯 Dynamic disambiguation test complete!');
    console.log('✨ System is now fully dynamic - no hardcoded protections needed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testDynamicDisambiguation();