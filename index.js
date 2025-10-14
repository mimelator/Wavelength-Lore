require('dotenv').config();
const express = require('express');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');
const path = require('path');

const app = express();
const port = 3001;

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

/*
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('API_KEY:', process.env.API_KEY);
console.log('Firebase Config:', firebaseConfig);

console.log('Environment Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('API_KEY:', process.env.API_KEY);
*/

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

(async () => {
  try {
    console.log('Attempting Firebase operation...');
    const videosRef = ref(database, 'videos'); // Use ref(database, path)
    const snapshot = await get(videosRef); // Use get() to fetch data
    if (snapshot.exists()) {
      console.log('Firebase data:', snapshot.val());
    } else {
      console.log('No data available');
    }
  } catch (error) {
    console.error('Firebase error:', error);
  }
})();

// Generate a custom version number
const version = `v${Date.now()}`;

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'static')));

// Render the index.ejs file with gallery data
app.get('/', async (req, res) => {
  try {
    const videosRef = ref(database, 'videos');
    const snapshot = await get(videosRef);

    if (snapshot.exists()) {
      const videos = snapshot.val();
      console.debug('Firebase query results:', videos); // Debug message
      res.render('index', {
        title: 'Welcome to Wavelength Lore',
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`,
        videos: videos
      });
    } else {
      console.debug('Firebase query returned no results.'); // Debug message
      res.render('index', {
        title: 'Welcome to Wavelength Lore',
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`,
        videos: {}
      });
    }
  } catch (error) {
    console.error('Error fetching videos from Firebase:', error);
    res.status(500).send('Error fetching videos');
  }
});

// Route to render an episode page
app.get('/season/:seasonNumber/episode/:episodeNumber', async (req, res) => {
  const { seasonNumber, episodeNumber } = req.params;

  try {
    const episodeRef = ref(database, `videos/season${seasonNumber}/episodes/episode${episodeNumber}`);
    const snapshot = await get(episodeRef);

    if (snapshot.exists()) {
      const episode = snapshot.val();

      // Fetch previous and next episodes
      const prevEpisodeRef = ref(database, `videos/season${seasonNumber}/episodes/episode${parseInt(episodeNumber) - 1}`);
      const nextEpisodeRef = ref(database, `videos/season${seasonNumber}/episodes/episode${parseInt(episodeNumber) + 1}`);

      // Fetch previous and next seasons' first episodes
      const prevSeasonRef = ref(database, `videos/season${parseInt(seasonNumber) - 1}/episodes/episode1`);
      const nextSeasonRef = ref(database, `videos/season${parseInt(seasonNumber) + 1}/episodes/episode1`);

      const [prevSnapshot, nextSnapshot, prevSeasonSnapshot, nextSeasonSnapshot] = await Promise.all([get(prevEpisodeRef), get(nextEpisodeRef), get(prevSeasonRef), get(nextSeasonRef)]);

      const previousEpisode = prevSnapshot.exists() ? { 
        id: parseInt(episodeNumber) - 1, 
        title: prevSnapshot.val().title, 
        image: prevSnapshot.val().image 
      } : null;

      const nextEpisode = nextSnapshot.exists() ? { 
        id: parseInt(episodeNumber) + 1, 
        title: nextSnapshot.val().title, 
        image: nextSnapshot.val().image 
      } : null;

      const isFirstEpisode = parseInt(episodeNumber) === 1;
      const isLastEpisode = !nextSnapshot.exists();

      const previousSeasonFirstEpisode = isFirstEpisode && prevSeasonSnapshot.exists() ? {
        id: 1,
        season: parseInt(seasonNumber) - 1,
        title: prevSeasonSnapshot.val().title,
        image: prevSeasonSnapshot.val().image
      } : null;

      const nextSeasonFirstEpisode = isLastEpisode && nextSeasonSnapshot.exists() ? {
        id: 1,
        season: parseInt(seasonNumber) + 1,
        title: nextSeasonSnapshot.val().title,
        image: nextSeasonSnapshot.val().image
      } : null;

      let previousLink = null;
      let nextLink = null;

      if (previousEpisode) {
        previousLink = {
          url: `/season/${seasonNumber}/episode/${previousEpisode.id}`,
          title: previousEpisode.title,
          image: previousEpisode.image
        };
      } else if (isFirstEpisode && previousSeasonFirstEpisode) {
        previousLink = {
          url: `/season/${previousSeasonFirstEpisode.season}/episode/${previousSeasonFirstEpisode.id}`,
          title: previousSeasonFirstEpisode.title,
          image: previousSeasonFirstEpisode.image
        };
      }

      if (nextEpisode) {
        nextLink = {
          url: `/season/${seasonNumber}/episode/${nextEpisode.id}`,
          title: nextEpisode.title,
          image: nextEpisode.image
        };
      } else if (isLastEpisode && nextSeasonFirstEpisode) {
        nextLink = {
          url: `/season/${nextSeasonFirstEpisode.season}/episode/${nextSeasonFirstEpisode.id}`,
          title: nextSeasonFirstEpisode.title,
          image: nextSeasonFirstEpisode.image
        };
      }

      if (episode.carouselImages) {
        // Shuffle the carouselImages array
        episode.carouselImages = episode.carouselImages.sort(() => Math.random() - 0.5);
      }

      res.render('episode', {
        title: episode.title,
        image: episode.image,
        carouselImages: episode.carouselImages || [], // Default to an empty array if null
        summary: episode.story || 'coming soon', // Default to 'coming soon' if null
        lyrics: episode.lyrics || 'coming soon', // Default to 'coming soon' if null
        audioUrl: episode.audio,
        cdnUrl: process.env.CDN_URL,
        version: `v${Date.now()}`,
        youtubeLink: episode.youtubeLink || '#',
        previousLink,
        nextLink
      });
    } else {
      res.status(404).send('Episode not found');
    }
  } catch (error) {
    console.error('Error fetching episode data:', error);
    res.status(500).send('Error fetching episode data');
  }
});

// Route for About page
app.get('/about', (req, res) => {
  res.render('about', { title: 'About - Coming Soon', cdnUrl: process.env.CDN_URL, version: `v${Date.now()}` });
});

// Route for Contact page
app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact - Coming Soon', cdnUrl: process.env.CDN_URL, version: `v${Date.now()}` });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});