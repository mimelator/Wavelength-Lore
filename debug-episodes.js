// Debug episode loading
const firebaseUtils = require('./helpers/firebase-utils');
const { getEpisodes } = require('./helpers/episode-helpers');

async function debugEpisodes() {
    console.log('🔍 Debugging Episode Loading...\n');
    
    try {
        // Initialize Firebase
        firebaseUtils.initializeFirebase('debug-episodes');
        
        // Get episodes
        console.log('1. Loading episodes...');
        const episodes = await getEpisodes();
        
        console.log(`   Found ${episodes ? episodes.length : 0} episodes`);
        
        if (episodes && episodes.length > 0) {
            console.log('\n2. Checking episode structure...');
            const firstEpisode = episodes[0];
            console.log(`   First episode:`, firstEpisode);
            
            console.log('\n3. Checking for keywords...');
            const episodesWithKeywords = episodes.filter(ep => ep.keywords && ep.keywords.length > 0);
            console.log(`   Episodes with keywords: ${episodesWithKeywords.length}`);
            
            if (episodesWithKeywords.length > 0) {
                console.log('\n4. Sample episodes with keywords:');
                episodesWithKeywords.slice(0, 3).forEach((ep, index) => {
                    console.log(`   ${index + 1}. "${ep.name}" - Keywords: [${ep.keywords.join(', ')}]`);
                });
            }
            
            console.log('\n5. Testing search terms...');
            const testKeywords = ['luck', 'charm', 'lucky', 'leprechaun'];
            
            for (const keyword of testKeywords) {
                const matchingEpisodes = episodes.filter(ep => 
                    ep.keywords && ep.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))
                );
                console.log(`   "${keyword}" matches ${matchingEpisodes.length} episodes`);
                if (matchingEpisodes.length > 0) {
                    matchingEpisodes.forEach(ep => {
                        console.log(`     - ${ep.name}`);
                    });
                }
            }
        } else {
            console.log('❌ No episodes loaded');
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

debugEpisodes();