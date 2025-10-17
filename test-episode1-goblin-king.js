// Test with exact episode 1 text containing Goblin King
const characterHelpers = require('./helpers/character-helpers');
const loreHelpers = require('./helpers/lore-helpers');
const episodeHelpers = require('./helpers/episode-helpers');
const simpleDisambiguation = require('./helpers/simple-disambiguation');

async function testEpisode1GoblinKing() {
  console.log('🔍 Testing Episode 1 Goblin King Text...\n');
  
  try {
    // Set up disambiguation with helper instances
    simpleDisambiguation.setHelperInstances(characterHelpers, loreHelpers, episodeHelpers);
    
    // Use the exact text from episode 1 story that contains "Goblin King"
    const episode1Text = `Eventually, the Goblin King hears about this song and becomes very angry, feeling insulted by the lyrics, and vows to get revenge on Wavelength and the Shire Folk.`;
    
    console.log('📝 Episode 1 story text:');
    console.log(episode1Text);
    
    const result = simpleDisambiguation.applySmartLinkingSimple(episode1Text);
    console.log('\n✨ Result:');
    console.log(result);
    
    // Check for disambiguation link
    if (result.includes('disambiguation-link')) {
      console.log('\n✅ SUCCESS: Disambiguation link created for Goblin King');
      
      // Extract and analyze the conflicts data
      const conflictsMatch = result.match(/data-conflicts="([^"]+)"/);
      if (conflictsMatch) {
        const conflictsJson = conflictsMatch[1].replace(/&quot;/g, '"');
        console.log('\n🔍 Raw conflicts JSON:');
        console.log(conflictsJson);
        
        try {
          const conflicts = JSON.parse(conflictsJson);
          console.log('\n📋 Parsed conflicts:');
          conflicts.forEach((conflict, index) => {
            console.log(`\n  ${index + 1}. ${conflict.description}:`);
            console.log(`     Type: ${conflict.type}`);
            console.log(`     Name: ${conflict.name}`);
            console.log(`     URL: ${conflict.url}`);
            console.log(`     Subtitle: "${conflict.subtitle}"`);
            
            // Check for the specific bug
            if (conflict.type === 'episode') {
              if (conflict.subtitle.includes('undefined')) {
                console.log('     ❌ BUG FOUND: Episode subtitle contains "undefined"');
              } else {
                console.log('     ✅ Episode subtitle looks good');
              }
            }
          });
        } catch (parseError) {
          console.log('❌ Error parsing conflicts JSON:', parseError.message);
        }
      }
    } else if (result.includes('Goblin King') && result.includes('<a')) {
      console.log('\n⚠️  Goblin King was linked directly (no disambiguation)');
    } else {
      console.log('\n❌ Goblin King was not processed at all');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEpisode1GoblinKing();