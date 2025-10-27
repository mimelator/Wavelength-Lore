require('dotenv').config();
const { initializeFirebaseAdmin, fetchDataAsAdmin } = require('./helpers/firebase-admin-utils');

async function checkFirebaseEpisodes() {
    try {
        await initializeFirebaseAdmin();
        
        console.log('🔍 Checking Firebase videos collection...');
        const videosData = await fetchDataAsAdmin('videos');
        
        if (!videosData) {
            console.log('❌ No videos collection found');
            return;
        }
        
        let totalEpisodes = 0;
        console.log('\n📺 Firebase Videos Structure:');
        
        Object.entries(videosData).forEach(([seasonKey, seasonData]) => {
            console.log(`\n🎭 Season: ${seasonKey}`);
            if (seasonData.episodes) {
                const episodes = Object.keys(seasonData.episodes);
                totalEpisodes += episodes.length;
                console.log(`   📺 Episodes: ${episodes.length}`);
                episodes.slice(0, 3).forEach(ep => {
                    console.log(`      - ${ep}`);
                });
                if (episodes.length > 3) {
                    console.log(`      ... and ${episodes.length - 3} more`);
                }
            } else {
                console.log('   ❌ No episodes found');
            }
        });
        
        console.log(`\n🎯 TOTAL EPISODES IN FIREBASE: ${totalEpisodes}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkFirebaseEpisodes();