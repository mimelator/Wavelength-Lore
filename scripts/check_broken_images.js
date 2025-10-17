require('dotenv').config({ path: '../.env' }); // Load .env file from the parent directory

const axios = require('axios');
const cheerio = require('cheerio');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

const BASE_URL = 'http://localhost:3001'; // Update this to your server's base URL

const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL, // Ensure this is included
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID
};

if (!process.env.DATABASE_URL || !process.env.PROJECT_ID) {
    console.error('FIREBASE CONFIG ERROR: DATABASE_URL or PROJECT_ID is missing in the .env file.');
    process.exit(1);
}

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

const fetchRoutes = async () => {
    const routes = ['/'];

    try {
        // Fetch all characters
        const charactersRef = ref(database, 'characters');
        const charactersSnapshot = await get(charactersRef);
        if (charactersSnapshot.exists()) {
            const charactersData = charactersSnapshot.val();
            for (const category in charactersData) {
                if (Array.isArray(charactersData[category])) {
                    charactersData[category].forEach(character => {
                        routes.push(`/character/${character.id}`);
                    });
                }
            }
        }

        // Fetch all episodes
        const videosRef = ref(database, 'videos');
        const videosSnapshot = await get(videosRef);
        if (videosSnapshot.exists()) {
            const videosData = videosSnapshot.val();
            for (const season in videosData) {
                if (videosData[season].episodes) {
                    for (const episode in videosData[season].episodes) {
                        routes.push(`/season/${season.replace('season', '')}/episode/${episode.replace('episode', '')}`);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error fetching routes:', error);
    }

    return routes;
};

const checkImages = async (url) => {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const images = $('img');

        console.log(`Checking images on ${url}`);

        const brokenImages = [];

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const src = $(img).attr('src');

            if (src) {
                try {
                    const imgResponse = await axios.get(src, { validateStatus: null });
                    if (imgResponse.status >= 400) {
                        brokenImages.push(src);
                    }
                } catch (error) {
                    brokenImages.push(src);
                }
            }
        }

        if (brokenImages.length > 0) {
            console.log(`Broken images found on ${url}:`, brokenImages);
        } else {
            console.log(`No broken images found on ${url}`);
        }
    } catch (error) {
        console.error(`Error checking ${url}:`, error.message);
    }
};

const main = async () => {
    const routes = await fetchRoutes();
    console.log('Routes to check:', routes);

    for (const route of routes) {
        const url = `${BASE_URL}${route}`;
        await checkImages(url);
    }
};

main();