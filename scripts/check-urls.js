#!/usr/bin/env node

/**
 * Quick Database URL Check
 * Check what URLs are actually in the database
 */

const { initScriptEnv } = require('./utils/env-loader');

// Initialize environment with required variables
initScriptEnv(['DATABASE_URL', 'PROJECT_ID', 'API_KEY']);

const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebaseServiceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});

async function getCustomToken() {
  const customToken = await admin.auth().createCustomToken('url_checker', {
    isScript: true
  });
  return customToken;
}

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

async function checkImageUrls() {
  console.log('🔍 Checking actual database image URLs...\n');
  
  try {
    const database = await initializeFirebaseWithToken();
    
    // Check a sample season
    console.log('📺 Season URLs:');
    const seasonsRef = ref(database, 'videos/season1');
    const seasonSnapshot = await get(seasonsRef);
    if (seasonSnapshot.exists()) {
      const seasonData = seasonSnapshot.val();
      console.log(`Season 1 image: ${seasonData.image || 'not found'}`);
      
      // Check episodes
      if (seasonData.episodes) {
        const episodes = Object.keys(seasonData.episodes).slice(0, 3); // First 3
        for (const episodeKey of episodes) {
          const episode = seasonData.episodes[episodeKey];
          if (episode.image) {
            console.log(`  ${episodeKey} image: ${episode.image}`);
          }
        }
      }
    }
    
    // Check characters
    console.log('\n👥 Character URLs:');
    const charactersRef = ref(database, 'characters');
    const charactersSnapshot = await get(charactersRef);
    if (charactersSnapshot.exists()) {
      const charactersData = charactersSnapshot.val();
      const charKeys = Object.keys(charactersData).slice(0, 2); // First 2
      for (const charKey of charKeys) {
        const char = charactersData[charKey];
        if (char.image) {
          console.log(`  ${charKey} image: ${char.image}`);
        }
      }
    }
    
    console.log('\n🔧 Current CDN_URL from env:');
    console.log(`  CDN_URL: ${process.env.CDN_URL}`);
    
    console.log('\n🔍 Expected local URL structure:');
    console.log(`  Database URL: http://localhost:3001/images/seasons/season1/image.webp`);
    console.log(`  Static file:  static/images/seasons/season1/image.webp`);
    console.log(`  Express serves: /images/seasons/season1/image.webp`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkImageUrls();