// Debug Lucky linking issue
const loreHelpers = require('./helpers/lore-helpers');

async function debugLuckyLoreLinking() {
  console.log('🔍 Debugging Lucky Lore Linking...\n');
  
  try {
    // Get lore data
    const lore = loreHelpers.getAllLoreSync();
    console.log('📚 Available lore items:');
    lore.forEach(item => {
      console.log(`  - ${item.name} (${item.id})`);
      if (item.keywords) {
        console.log(`    Keywords: ${item.keywords.join(', ')}`);
      }
    });
    
    console.log('\n🔍 Checking if any lore items contain "Lucky"...');
    const luckyLore = lore.filter(item => 
      item.name.toLowerCase().includes('lucky') || 
      (item.keywords && item.keywords.some(k => k.toLowerCase().includes('lucky')))
    );
    
    if (luckyLore.length > 0) {
      console.log('❌ Found lore items containing "Lucky":');
      luckyLore.forEach(item => {
        console.log(`  - ${item.name} (${item.id})`);
        if (item.keywords) {
          console.log(`    Keywords: ${item.keywords.join(', ')}`);
        }
      });
    } else {
      console.log('✅ No lore items contain "Lucky"');
    }
    
    // Test lore linking directly
    console.log('\n🧪 Testing lore linking on "Lucky the Leprechaun"...');
    const testText = 'Lucky the Leprechaun';
    const result = loreHelpers.linkifyLoreMentionsSync(testText);
    console.log('Input:', testText);
    console.log('Output:', result);
    
    if (result !== testText) {
      console.log('❌ Lore system is incorrectly linking Lucky!');
    } else {
      console.log('✅ Lore system correctly ignores Lucky');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugLuckyLoreLinking();