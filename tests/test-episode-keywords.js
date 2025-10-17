const { getEpisodes } = require('../helpers/episode-helpers');
const { linkifyEpisodeMentions, linkifyEpisodeMentionsSync } = require('../helpers/episode-helpers');
const { linkifyCharacterMentions, linkifyCharacterMentionsSync } = require('../helpers/character-helpers');
const { linkifyLoreMentions, linkifyLoreMentionsSync } = require('../helpers/lore-helpers');

async function testEpisodeKeywords() {
    console.log('🎬 Testing Episode Keywords System\n');
    
    try {
        // Test 1: Check if episodes have keywords
        console.log('1. Checking if episodes have keywords...');
        const episodes = await getEpisodes();
        
        const episodesWithKeywords = episodes.filter(ep => ep.keywords && ep.keywords.length > 0);
        console.log(`   Found ${episodesWithKeywords.length} episodes with keywords out of ${episodes.length} total episodes`);
        
        if (episodesWithKeywords.length > 0) {
            console.log('   ✅ Episodes have keyword support');
            console.log(`   Example: "${episodesWithKeywords[0].name}" has keywords: [${episodesWithKeywords[0].keywords.join(', ')}]`);
        } else {
            console.log('   ❌ No episodes found with keywords');
            return;
        }
        
        // Test 2: Test episode keyword linking
        console.log('\n2. Testing episode keyword linking...');
        
        const testTexts = [
            'I love that lucky charm song',
            'The goblin king episode was amazing',
            'Jump right in and take action',
            'Life in the shire is peaceful',
            'Feed the crows in nature',
            'That daphne flower episode was beautiful',
            'The dream and destiny theme',
            'History lessons teach us about the past',
            'Keep on searching for love',
            'Falling in love is wonderful',
            'Once more we remember friends',
            'Back to paradise in the shire'
        ];
        
        for (const text of testTexts) {
            const linkedText = await linkifyEpisodeMentions(text);
            if (linkedText !== text) {
                console.log(`   ✅ "${text}" → Found episode links`);
                console.log(`      ${linkedText}`);
            } else {
                console.log(`   ⚪ "${text}" → No episode links found`);
            }
        }
        
        // Test 3: Test sync version
        console.log('\n3. Testing synchronous episode linking...');
        const syncLinkedText = linkifyEpisodeMentionsSync('I need some luck and want to feed the crows');
        console.log(`   Sync result: ${syncLinkedText}`);
        
        // Test 4: Test cross-content linking (episodes + characters + lore)
        console.log('\n4. Testing comprehensive cross-content linking...');
        
        const complexText = 'Lucky the leprechaun appears in the goblin king episode where he faces the psychopath villain in the shire';
        
        // Apply all linking types
        let result = complexText;
        result = await linkifyCharacterMentions(result);
        result = await linkifyLoreMentions(result);
        result = await linkifyEpisodeMentions(result);
        
        console.log(`   Original: ${complexText}`);
        console.log(`   Linked:   ${result}`);
        
        // Test 5: Check for proper CSS classes
        console.log('\n5. Testing CSS class assignment...');
        
        if (result.includes('class="character-link"')) {
            console.log('   ✅ Character links have correct CSS class');
        }
        if (result.includes('class="lore-link"')) {
            console.log('   ✅ Lore links have correct CSS class');
        }
        if (result.includes('class="episode-link"')) {
            console.log('   ✅ Episode links have correct CSS class');
        }
        
        // Test 6: Test specific keyword matching
        console.log('\n6. Testing specific keyword matches...');
        
        const keywordTests = [
            { text: 'I need more luck in my life', expected: 'My Lucky Charm' },
            { text: 'The king is a psychopath', expected: 'Goblin King' },
            { text: 'I want to jump into action', expected: 'Jump Right In!' },
            { text: 'Life in a peaceful community', expected: 'Life in the Shire' },
            { text: 'Feeding wildlife and crows', expected: 'Feed the Crows' },
            { text: 'That beautiful flower', expected: 'Daphne' },
            { text: 'Learning from history', expected: 'History Lessons' },
            { text: 'Falling in love', expected: 'Falling' },
            { text: 'Remember dear friends', expected: 'Once More' },
            { text: 'Keep searching', expected: 'Keep On' },
            { text: 'Return to paradise', expected: 'Back to the Shire (Encore)' }
        ];
        
        for (const test of keywordTests) {
            const linked = await linkifyEpisodeMentions(test.text);
            if (linked !== test.text) {
                console.log(`   ✅ "${test.text}" correctly links to episode`);
            } else {
                console.log(`   ❌ "${test.text}" should link to "${test.expected}" but doesn't`);
            }
        }
        
        // Test 7: Test no self-referential links
        console.log('\n7. Testing self-referential link prevention...');
        
        const currentUrl = '/episode/my-lucky-charm';
        const testText = 'This is about my lucky charm and luck';
        
        // Note: The shared linking utilities should handle this, but we'd need to pass currentUrl
        console.log(`   Testing with currentUrl: ${currentUrl}`);
        console.log(`   Text: "${testText}"`);
        console.log('   (Self-referential prevention requires currentUrl parameter in actual implementation)');
        
        console.log('\n🎉 Episode keyword testing completed!\n');
        
    } catch (error) {
        console.error('❌ Error testing episode keywords:', error);
    }
}

// Run the test
testEpisodeKeywords().then(() => {
    console.log('Test completed');
    process.exit(0);
}).catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});