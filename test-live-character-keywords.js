const { getAllCharacters, linkifyCharacterMentions } = require('./helpers/character-helpers');

async function testLiveCharacterKeywords() {
    console.log('🧪 Testing Live Character Keywords...\n');
    
    try {
        // Fetch real characters from database with their new keywords
        const characters = await getAllCharacters();
        console.log('📚 Loaded characters:', characters.map(c => `${c.title} (${c.keywords ? c.keywords.length : 0} keywords)`).join(', '));
        console.log();
        
        // Test text with various character references using the new keywords
        const testText = `The Prince led the band with confidence, while Princess Jewel sang beautifully. 
        Alex taught the children new songs, and The Son played bass guitar rhythms. 
        The Prodigy drummer joined after the battle, replacing Magical Maurice who was The Dwarf's fallen friend.
        The Leprechaun gave Golden Advice while the Ice Beast helped as The Nurse.
        The Wise Elder went fishing while The Merchant's legacy lived on.`;
        
        console.log('📝 Test text:');
        console.log(testText);
        console.log('\n🔗 Processing with character keyword linking...\n');
        
        const result = await linkifyCharacterMentions(testText);
        
        console.log('✨ Linked result:');
        console.log(result);
        console.log('\n🎯 Character links found:');
        
        // Extract and display found links
        const linkMatches = result.match(/<a[^>]*class="character-link"[^>]*>([^<]+)<\/a>/g);
        if (linkMatches) {
            linkMatches.forEach((link, index) => {
                const text = link.match(/>([^<]+)</)[1];
                const href = link.match(/href="([^"]+)"/)[1];
                console.log(`  ${index + 1}. "${text}" → ${href}`);
            });
        } else {
            console.log('  No character links found');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testLiveCharacterKeywords();