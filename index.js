require('dotenv').config();
const express = require('express');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');
const path = require('path');

const app = express();
const port = 8080;

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

console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// Generate a custom version number
const version = `v${Date.now()}`;

// Set EJS as the view engine
app.set('view engine', 'ejs');
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


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});