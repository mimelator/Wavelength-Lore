// Debug character linking directly
const characterHelpers = require('../helpers/character-helpers');

async function debugCharacterLinking() {
  console.log('🔍 Debugging Character Linking...\n');
  
  try {
    // Get character data
    const characters = characterHelpers.getAllCharactersSync();
    console.log('📚 Available characters:');
    characters.forEach(char => {
      console.log(`  - ${char.title} (${char.id})`);
      if (char.keywords) {
        console.log(`    Keywords: ${char.keywords.join(', ')}`);
      }
    });
    
    // Test character linking directly on Lucky
    console.log('\n🧪 Testing character linking on "Lucky the Leprechaun"...');
    const testText = 'Lucky the Leprechaun';
    const result = characterHelpers.linkifyCharacterMentionsSync(testText);
    console.log('Input:', testText);
    console.log('Output:', result);
    
    if (result.includes('class="character-link"') && result.includes('Lucky')) {
      console.log('✅ Character system correctly links Lucky with character-link class');
    } else if (result !== testText) {
      console.log('❌ Character system linking issue');
    } else {
      console.log('⚠️  Character system did not link Lucky');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugCharacterLinking();