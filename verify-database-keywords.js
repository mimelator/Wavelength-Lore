const { getAllCharacters } = require('./helpers/character-helpers');

async function verifyDatabaseKeywords() {
    console.log('🔍 Verifying Database Character Keywords...\n');
    
    try {
        // Get characters from database (should use live data if available)
        const characters = await getAllCharacters();
        
        console.log('📊 Character Keywords Summary:');
        console.log('================================');
        
        characters.forEach(char => {
            console.log(`\n🎭 ${char.title} (${char.id})`);
            if (char.keywords && char.keywords.length > 0) {
                console.log(`   Keywords: ${char.keywords.join(', ')}`);
            } else {
                console.log('   ⚠️  No keywords found');
            }
        });
        
        console.log('\n✅ Database keyword verification complete!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verifyDatabaseKeywords();