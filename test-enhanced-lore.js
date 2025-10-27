// Test enhanced lore data loading
const { initializeLoreCache, getLoreByIdSync, getAllLoreSync } = require('./helpers/lore-helpers');

async function testLore() {
    console.log('🔍 Testing enhanced lore data loading...');
    
    // Initialize the cache first
    await initializeLoreCache();
    
    // Get all lore to see what's available
    const allLore = getAllLoreSync();
    console.log('📚 Available lore entries:');
    allLore.forEach(item => console.log(`  - ${item.id}: ${item.title}`));
    
    // Try to get ice blue diamond
    const lore = getLoreByIdSync('ice-blue-diamond');
    
    if (lore) {
        console.log('\n✅ Found Ice Blue Diamond lore:');
        console.log('  ID:', lore.id);
        console.log('  Title:', lore.title);
        console.log('  Enhanced Title?:', !!lore.enhanced_title);
        console.log('  Tagline?:', !!lore.tagline);
        console.log('  Enhanced Description?:', !!lore.enhanced_description);
        console.log('  CTA Hook?:', !!lore.cta_hook);
        console.log('  Power Statement?:', !!lore.power_statement);
        
        if (lore.enhanced_title) {
            console.log('  Enhanced Title Value:', lore.enhanced_title.substring(0, 100) + '...');
        }
        
        console.log('\n🎯 All available fields:');
        console.log(Object.keys(lore));
    } else {
        console.log('❌ No lore found for ice-blue-diamond');
    }
}

testLore().catch(console.error);