const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');
const serviceAccount = require('./firebaseServiceAccountKey.json');
require('dotenv').config();

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});

// Generate a custom token
async function getCustomToken() {
  const customToken = await admin.auth().createCustomToken('populate_firebase_script', {
    isScript: true
  });
  return customToken;
}

// Initialize Firebase App with the custom token
async function initializeFirebaseWithToken() {
  const customToken = await getCustomToken();
  const firebaseApp = initializeApp({
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID
  });

  const auth = require('firebase/auth');
  const { getAuth, signInWithCustomToken } = auth;
  const firebaseAuth = getAuth(firebaseApp);

  await signInWithCustomToken(firebaseAuth, customToken);
  return getDatabase(firebaseApp);
}

// Populate Firebase
async function populateFirebase() {
  try {
    const database = await initializeFirebaseWithToken();
    const videosRef = ref(database, 'videos');
    const data = require('./videos_data.json');
    await set(videosRef, data);
    console.log('Firebase populated successfully!');
  } catch (error) {
    console.error('Error populating Firebase:', error);
  }
}

populateFirebase();