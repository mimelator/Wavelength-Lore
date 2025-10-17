// Debug Goblin King lore linking
const loreHelpers = require('./helpers/lore-helpers');

async function debugGoblinKingLore() {
  console.log('🔍 Debugging Goblin King Lore...\n');
  
  try {
    const lore = loreHelpers.getAllLoreSync();
    console.log(`📚 Total lore items: ${lore.length}\n`);
    
    // Look for Goblin King lore
    const goblinKingLore = lore.filter(item => 
      item.name.toLowerCase().includes('goblin') && item.name.toLowerCase().includes('king')
    );
    
    console.log('🔍 Lore items containing "Goblin King":');
    if (goblinKingLore.length > 0) {
      goblinKingLore.forEach(item => {
        console.log(`  - Name: "${item.name}" (${item.id})`);
        console.log(`    URL: ${item.url}`);
        console.log(`    Type: ${item.type}`);
        if (item.keywords) {
          console.log(`    Keywords: ${item.keywords.join(', ')}`);
        }
        console.log('');
      });
    } else {
      console.log('  ❌ No lore items found with "Goblin King"');
    }
    
    // Test lore linking directly
    console.log('🧪 Testing lore linking on "Goblin King"...');
    const testText = 'The Goblin King is evil.';
    const result = loreHelpers.linkifyLoreMentionsSync(testText);
    console.log('Input:', testText);
    console.log('Output:', result);
    
    if (result.includes('<a') && result.includes('Goblin King')) {
      console.log('✅ Lore system IS linking Goblin King');
    } else {
      console.log('❌ Lore system is NOT linking Goblin King');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugGoblinKingLore();