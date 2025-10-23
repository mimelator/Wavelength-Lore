/**
 * Generate Firebase Session Token
 * 
 * This script generates a Firebase session token that can be used for testing.
 * It uses the Firebase Admin SDK to create a custom token, then signs in with that
 * token to get an ID token that can be used as a session token.
 */

const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken } = require('firebase/auth');
require('dotenv').config();

// Initialize Firebase Admin SDK from service account in .env
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});

async function generateSessionToken() {
  try {
    // Create a test user ID or use an existing user
    const userId = 'test_user_' + Date.now();
    
    console.log(`🔑 Generating token for user ID: ${userId}`);
    
    // Generate a custom token using Firebase Admin SDK
    const customToken = await admin.auth().createCustomToken(userId, {
      isTestUser: true,
      role: 'tester'
    });
    
    console.log(`✅ Custom token generated`);
    
    // Initialize the Firebase app
    const firebaseApp = initializeApp({
      apiKey: process.env.API_KEY,
      authDomain: process.env.AUTH_DOMAIN,
      databaseURL: process.env.DATABASE_URL,
      projectId: process.env.PROJECT_ID,
      storageBucket: process.env.STORAGE_BUCKET,
      messagingSenderId: process.env.MESSAGING_SENDER_ID,
      appId: process.env.APP_ID
    });
    
    // Sign in with the custom token to get an ID token
    const auth = getAuth(firebaseApp);
    const userCredential = await signInWithCustomToken(auth, customToken);
    
    // Get the ID token which will be used as the session token
    const idToken = await userCredential.user.getIdToken();
    
    console.log(`\n📋 Your Firebase session token (for SESSION_COOKIE in .env.test):`);
    console.log(`\n${idToken}\n`);
    console.log(`Add this to your .env.test file as:`);
    console.log(`SESSION_COOKIE=${idToken}`);
    
  } catch (error) {
    console.error('❌ Error generating session token:', error);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the function
generateSessionToken();