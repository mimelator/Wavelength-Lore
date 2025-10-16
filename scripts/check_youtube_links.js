require('dotenv').config({ path: '.env' }); // Load .env file from the parent directory

const axios = require('axios');
const { getDatabase, ref, get } = require('firebase/database');
const { initializeApp } = require('firebase/app');

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/videos';

if (!YOUTUBE_API_KEY) {
    console.error('YOUTUBE_API_KEY is missing in the .env file.');
    process.exit(1);
}

const fetchYouTubeLinks = async () => {
    const links = [];

    try {
        const videosRef = ref(database, 'videos');
        const videosSnapshot = await get(videosRef);
        if (videosSnapshot.exists()) {
            const videosData = videosSnapshot.val();
            for (const season in videosData) {
                if (videosData[season].episodes) {
                    for (const episode in videosData[season].episodes) {
                        const videoId = videosData[season].episodes[episode].youtubeId;
                        if (videoId) {
                            links.push(videoId);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error fetching YouTube links:', error);
    }

    return links;
};

const checkYouTubeLinks = async (videoIds) => {
    const invalidLinks = [];

    for (const videoId of videoIds) {
        try {
            const response = await axios.get(YOUTUBE_API_URL, {
                params: {
                    id: videoId,
                    key: YOUTUBE_API_KEY,
                    part: 'id'
                }
            });

            if (!response.data.items || response.data.items.length === 0) {
                invalidLinks.push(`https://www.youtube.com/watch?v=${videoId}`);
            }
        } catch (error) {
            console.error(`Error checking video ID ${videoId}:`, error.message);
            invalidLinks.push(`https://www.youtube.com/watch?v=${videoId}`);
        }
    }

    return invalidLinks;
};

const main = async () => {
    const videoIds = await fetchYouTubeLinks();
    console.log('Checking the following YouTube video IDs:', videoIds);

    const invalidLinks = await checkYouTubeLinks(videoIds);

    if (invalidLinks.length > 0) {
        console.log('Invalid or inaccessible YouTube links found:', invalidLinks);
    } else {
        console.log('All YouTube links are valid.');
    }
};

main();