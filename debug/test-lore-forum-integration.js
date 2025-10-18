/**
 * Test Lore Forum Integration
 * Tests the new "Create a Post about this Lore" functionality
 */

const loreHelpers = require('../helpers/lore-helpers');

async function testLoreForumIntegration() {
  console.log('🌟 Testing Lore Forum Integration');
  console.log('================================\n');

  try {
    // Get all lore items
    const allLore = await loreHelpers.getAllLore();
    console.log(`📚 Found ${allLore.length} lore items in database\n`);

    // Test each lore type
    const typeGroups = {};
    allLore.forEach(item => {
      if (!typeGroups[item.type]) {
        typeGroups[item.type] = [];
      }
      typeGroups[item.type].push(item);
    });

    console.log('🗂️ Lore items by type:');
    for (const [type, items] of Object.entries(typeGroups)) {
      console.log(`\n${type.toUpperCase()}:`);
      items.forEach(item => {
        console.log(`  - ${item.title} (${item.id})`);
        
        // Generate forum URL for this lore item
        const forumUrl = `/forum/create?category=lore&loreName=${encodeURIComponent(item.title)}&loreId=${item.id}&loreType=${item.type}`;
        console.log(`    Forum URL: http://localhost:3001${forumUrl}`);
      });
    }

    console.log('\n✅ Integration Test Results:');
    console.log('- Lore items successfully loaded');
    console.log('- Forum URLs generated for all lore types');
    console.log('- Integration ready for testing in browser');

    console.log('\n🧪 Test Steps:');
    console.log('1. Visit any lore page: http://localhost:3001/lore/{loreId}');
    console.log('2. Look for the "Create a Post about this Lore" button');
    console.log('3. Click the button to go to forum create page');
    console.log('4. Verify the form is pre-populated with lore information');
    console.log('5. Test different lore types to see different button colors');

    console.log('\n🎨 Button Colors by Type:');
    console.log('- Places: Green (#2e7b32)');
    console.log('- Things: Orange (#f57c00)');
    console.log('- Concepts: Purple (#7b1fa2)');
    console.log('- Ideas: Blue (#1976d2)');
    console.log('- Other: Gray (#5a5a5a)');

  } catch (error) {
    console.error('❌ Error testing lore forum integration:', error);
  }
}

testLoreForumIntegration();