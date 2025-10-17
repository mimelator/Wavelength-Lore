// Direct Firebase test for episode data
const firebaseUtils = require('./helpers/firebase-utils');

async function testFirebaseVideos() {
    console.log('🔥 Testing Firebase videos data directly...');
    
    try {
        firebaseUtils.initializeFirebase('test-videos');
        
        console.log('Firebase ready:', firebaseUtils.isFirebaseReady());
        
        const videosData = await firebaseUtils.fetchFromFirebase('videos');
        console.log('Videos data:', videosData ? 'received' : 'null');
        
        if (videosData) {
            console.log('Video data keys:', Object.keys(videosData));
            
            for (const seasonKey of Object.keys(videosData)) {
                console.log(`\nSeason: ${seasonKey}`);
                const season = videosData[seasonKey];
                console.log('Season keys:', Object.keys(season));
                
                if (season.episodes) {
                    console.log('Episodes:', Object.keys(season.episodes));
                    
                    for (const episodeKey of Object.keys(season.episodes)) {
                        const episode = season.episodes[episodeKey];
                        console.log(`  ${episodeKey}:`, {
                            title: episode.title,
                            hasKeywords: !!(episode.keywords),
                            keywords: episode.keywords
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testFirebaseVideos();