// Test Goblin King disambiguation modal data
const characterHelpers = require('../helpers/character-helpers');
const loreHelpers = require('../helpers/lore-helpers');
const episodeHelpers = require('../helpers/episode-helpers');
const simpleDisambiguation = require('../helpers/simple-disambiguation');

async function testGoblinKingDisambiguation() {
  console.log('🔍 Testing Goblin King Disambiguation...\n');
  
  try {
    // Set up disambiguation with helper instances
    simpleDisambiguation.setHelperInstances(characterHelpers, loreHelpers, episodeHelpers);
    
    // Test text that mentions Goblin King (should trigger disambiguation)
    const testText = 'The Goblin King is a powerful villain in the Wavelength universe.';
    console.log('📝 Test text:', testText);
    
    const result = simpleDisambiguation.applySmartLinkingSimple(testText);
    console.log('\n✨ Result:');
    console.log(result);
    
    // Check if disambiguation link was created
    if (result.includes('disambiguation-link')) {
      console.log('\n✅ Disambiguation link created for Goblin King');
      
      // Extract the conflicts data from the result
      const conflictsMatch = result.match(/data-conflicts="([^"]+)"/);
      if (conflictsMatch) {
        const conflictsJson = conflictsMatch[1].replace(/&quot;/g, '"');
        const conflicts = JSON.parse(conflictsJson);
        
        console.log('\n🔍 Analyzing conflicts data:');
        conflicts.forEach((conflict, index) => {
          console.log(`\n  ${index + 1}. ${conflict.description}:`);
          console.log(`     Name: ${conflict.name}`);
          console.log(`     URL: ${conflict.url}`);
          console.log(`     Subtitle: ${conflict.subtitle}`);
          
          if (conflict.type === 'episode' && conflict.subtitle.includes('undefined')) {
            console.log('     ❌ BUG: Episode subtitle contains "undefined"');
          } else if (conflict.type === 'episode') {
            console.log('     ✅ Episode subtitle looks correct');
          }
        });
      } else {
        console.log('❌ Could not extract conflicts data from result');
      }
    } else {
      console.log('❌ No disambiguation link created (unexpected)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testGoblinKingDisambiguation();