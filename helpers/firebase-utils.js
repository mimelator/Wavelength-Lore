/**
 * Firebase Utilities for Wavelength Lore
 * 
 * Shared Firebase configuration, initialization, and database management
 * Used by all helper modules to eliminate code duplication
 */

const { initializeApp, getApps } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

// Firebase configuration (shared across all helpers)
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

// Global Firebase instances
let firebaseApp;
let database;

/**
 * Initialize Firebase with a specific app name
 * @param {string} appName - Name for the Firebase app instance
 * @returns {object} Database instance
 */
function initializeFirebase(appName = 'wavelength-lore') {
  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      // Use the first existing app
      firebaseApp = existingApps[0];
    } else {
      // Create new app with provided name
      firebaseApp = initializeApp(firebaseConfig, appName);
    }
    database = getDatabase(firebaseApp);
    return database;
  } catch (error) {
    console.warn(`Firebase initialization failed for ${appName}:`, error.message);
    // Return null, helpers will use fallback data
    return null;
  }
}

/**
 * Set database instance (useful when called from main app)
 * @param {object} dbInstance - Firebase database instance
 */
function setDatabaseInstance(dbInstance) {
  database = dbInstance;
}

/**
 * Get the current database instance
 * @returns {object|null} Database instance or null if not initialized
 */
function getDatabaseInstance() {
  return database;
}

/**
 * Fetch data from Firebase with error handling
 * @param {string} path - Database path to fetch
 * @returns {Promise<any>} Data from Firebase or null on error
 */
async function fetchFromFirebase(path) {
  try {
    if (!database) {
      console.warn('Database not initialized, cannot fetch data');
      return null;
    }

    const dataRef = ref(database, path);
    const snapshot = await get(dataRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.warn(`No data found at path: ${path}`);
      return null;
    }
  } catch (error) {
    console.warn(`Error fetching data from ${path}:`, error.message);
    return null;
  }
}

/**
 * Check if Firebase is properly initialized
 * @returns {boolean} True if Firebase is ready
 */
function isFirebaseReady() {
  return !!database;
}

module.exports = {
  firebaseConfig,
  initializeFirebase,
  setDatabaseInstance,
  getDatabaseInstance,
  fetchFromFirebase,
  isFirebaseReady
};