/**
 * Firebase Admin SDK Utilities for Wavelength Lore
 * 
 * Server-side Firebase Admin SDK for authenticated database operations
 * Used by admin endpoints to access data with full privileges
 */

const admin = require('firebase-admin');
const path = require('path');

// Global Firebase Admin instances
let adminApp;
let adminDatabase;

/**
 * Initialize Firebase Admin SDK
 * @returns {object} Admin database instance
 */
function initializeFirebaseAdmin() {
  try {
    // Check if admin app is already initialized
    if (adminApp) {
      return adminDatabase;
    }

    // Initialize with service account
    const serviceAccountPath = path.join(__dirname, '../firebaseServiceAccountKey.json');
    
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      databaseURL: process.env.DATABASE_URL,
      storageBucket: process.env.STORAGE_BUCKET
    }, 'admin');

    adminDatabase = adminApp.database();
    console.log('Firebase Admin SDK initialized successfully');
    return adminDatabase;
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error.message);
    return null;
  }
}

/**
 * Get the current admin database instance
 * @returns {object|null} Admin database instance or null if not initialized
 */
function getAdminDatabase() {
  if (!adminDatabase) {
    return initializeFirebaseAdmin();
  }
  return adminDatabase;
}

/**
 * Fetch data from Firebase using Admin SDK (bypasses security rules)
 * @param {string} path - Database path to fetch
 * @returns {Promise<any>} Data from Firebase or null on error
 */
async function fetchDataAsAdmin(path) {
  try {
    const db = getAdminDatabase();
    if (!db) {
      throw new Error('Admin database not initialized');
    }

    const ref = db.ref(path);
    const snapshot = await ref.once('value');
    
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.warn(`No data found at admin path: ${path}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching admin data from ${path}:`, error.message);
    return null;
  }
}

/**
 * Write data to Firebase using Admin SDK (bypasses security rules)
 * @param {string} path - Database path to write to
 * @param {any} data - Data to write
 * @returns {Promise<boolean>} Success status
 */
async function writeDataAsAdmin(path, data) {
  try {
    const db = getAdminDatabase();
    if (!db) {
      throw new Error('Admin database not initialized');
    }

    const ref = db.ref(path);
    await ref.set(data);
    console.log(`Successfully wrote admin data to ${path}`);
    return true;
  } catch (error) {
    console.error(`Error writing admin data to ${path}:`, error.message);
    return false;
  }
}

/**
 * Update data in Firebase using Admin SDK (bypasses security rules)
 * @param {string} path - Database path to update
 * @param {object} updates - Updates to apply
 * @returns {Promise<boolean>} Success status
 */
async function updateDataAsAdmin(path, updates) {
  try {
    const db = getAdminDatabase();
    if (!db) {
      throw new Error('Admin database not initialized');
    }

    const ref = db.ref(path);
    await ref.update(updates);
    console.log(`Successfully updated admin data at ${path}`);
    return true;
  } catch (error) {
    console.error(`Error updating admin data at ${path}:`, error.message);
    return false;
  }
}

/**
 * Delete data from Firebase using Admin SDK (bypasses security rules)
 * @param {string} path - Database path to delete
 * @returns {Promise<boolean>} Success status
 */
async function deleteDataAsAdmin(path) {
  try {
    const db = getAdminDatabase();
    if (!db) {
      throw new Error('Admin database not initialized');
    }

    const ref = db.ref(path);
    await ref.remove();
    console.log(`Successfully deleted admin data at ${path}`);
    return true;
  } catch (error) {
    console.error(`Error deleting admin data at ${path}:`, error.message);
    return false;
  }
}

/**
 * Check if Firebase Admin is properly initialized
 * @returns {boolean} True if Firebase Admin is ready
 */
function isFirebaseAdminReady() {
  return !!adminDatabase;
}

module.exports = {
  initializeFirebaseAdmin,
  getAdminDatabase,
  fetchDataAsAdmin,
  writeDataAsAdmin,
  updateDataAsAdmin,
  deleteDataAsAdmin,
  isFirebaseAdminReady
};