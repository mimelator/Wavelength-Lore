/**
 * Firebase SDK Fallback Handler
 * 
 * Handles fallback from admin SDK to client SDK when needed
 * Used for production debugging and gradual rollback
 */

const firebaseAdminUtils = require('./firebase-admin-utils');
const firebaseUtils = require('./firebase-utils');

/**
 * Fetch data with automatic fallback
 * @param {string} path - Firebase path
 * @param {boolean} forceClientSDK - Force use of client SDK
 * @returns {Promise<any>} Data from Firebase
 */
async function fetchDataWithFallback(path, forceClientSDK = false) {
  // If forced to use client SDK, or in development mode
  if (forceClientSDK || process.env.NODE_ENV === 'development') {
    console.log(`📱 Using client SDK for ${path}`);
    return await firebaseUtils.fetchFromFirebase(path);
  }

  try {
    // Try admin SDK first (production)
    console.log(`🔑 Trying admin SDK for ${path}`);
    const result = await firebaseAdminUtils.fetchDataAsAdmin(path);
    
    if (result) {
      console.log(`✅ Admin SDK success for ${path}`);
      return result;
    } else {
      console.log(`⚠️ Admin SDK returned null for ${path}, trying client SDK`);
      return await firebaseUtils.fetchFromFirebase(path);
    }
  } catch (error) {
    console.error(`❌ Admin SDK failed for ${path}:`, error.message);
    console.log(`🔄 Falling back to client SDK for ${path}`);
    
    try {
      return await firebaseUtils.fetchFromFirebase(path);
    } catch (clientError) {
      console.error(`❌ Client SDK also failed for ${path}:`, clientError.message);
      throw new Error(`Both Firebase SDKs failed for ${path}`);
    }
  }
}

/**
 * Check which SDK should be used based on environment
 * @returns {object} SDK availability status
 */
function checkSDKAvailability() {
  const adminAvailable = !!process.env.FIREBASE_SERVICE_ACCOUNT;
  const clientReady = firebaseUtils.isFirebaseReady();
  
  return {
    admin: adminAvailable,
    client: clientReady,
    recommended: adminAvailable ? 'admin' : 'client',
    environment: process.env.NODE_ENV || 'development'
  };
}

module.exports = {
  fetchDataWithFallback,
  checkSDKAvailability
};