const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');
const videosData = require('./videos_data.json');
require('dotenv').config();

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

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

// Function to populate Firebase
async function populateFirebase() {
  try {
    const videosRef = ref(database, 'videos');
    await set(videosRef, videosData);
    console.log('Firebase population complete.');
  } catch (error) {
    console.error('Error populating Firebase:', error);
  }
}

populateFirebase();