// Quick test to check episode loading with keywords
const { linkifyEpisodeMentions } = require('../helpers/episode-helpers');

async function quickTest() {
    console.log('Testing episode linking...');
    
    const testText = 'I need some luck and charm in my life';
    console.log('Original text:', testText);
    
    try {
        const result = await linkifyEpisodeMentions(testText);
        console.log('Linked text:', result);
        
        if (result !== testText) {
            console.log('✅ Episode linking is working!');
        } else {
            console.log('❌ No episode links were created');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

quickTest();