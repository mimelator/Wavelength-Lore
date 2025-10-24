/**
 * Gallery Service - Firebase Bookmarks
 * 
 * Manages content image bookmarks in Firebase WITHOUT duplicating to S3
 * Uses Firebase Admin SDK for server-side writes
 */

const { getAdminDatabase } = require('../../helpers/firebase-admin-utils');

/**
 * Save a content image bookmark to Firebase (no S3 duplication)
 * @param {string} userId - User ID
 * @param {string} imageUrl - Original URL of the image
 * @param {string} title - Image title
 * @param {string} relativePath - Path in S3 (null for content images)
 * @param {string} fileName - Original filename
 * @param {string} sourceUrl - Where the image was found
 * @param {Array<string>} tags - Tags for the image
 * @param {Array<string>} userGroups - User's group memberships
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
async function saveImageToFirebase(userId, imageUrl, title, relativePath, fileName, sourceUrl, tags = [], userGroups = []) {
  try {
    console.log(`💾 Saving image reference to Firebase for user ${userId}`);
    console.log(`🔗 URL: ${imageUrl}`);
    console.log(`📝 Title: ${title}`);
    
    const db = getAdminDatabase();
    if (!db) {
      throw new Error('Firebase Admin not initialized');
    }
    
    const galleryRef = db.ref(`users/${userId}/gallery/bookmarks`);
    const newBookmarkRef = galleryRef.push();
    
    const bookmarkData = {
      url: imageUrl,
      title: title || fileName,
      fileName: fileName,
      sourceUrl: sourceUrl || '',
      relativePath: relativePath,
      tags: tags || [],
      userGroups: userGroups || [],
      savedAt: Date.now(),
      type: relativePath ? 'uploaded' : 'content'
    };
    
    await newBookmarkRef.set(bookmarkData);
    
    const bookmarkId = newBookmarkRef.key;
    console.log(`✅ Saved bookmark with ID: ${bookmarkId}`);
    
    return {
      success: true,
      id: bookmarkId
    };
  } catch (error) {
    console.error('❌ Error saving image reference to Firebase:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get user's bookmarked content images from Firebase
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of bookmarks
 */
async function getUserBookmarks(userId) {
  try {
    const db = getAdminDatabase();
    if (!db) {
      throw new Error('Firebase Admin not initialized');
    }
    
    const bookmarksRef = db.ref(`users/${userId}/gallery/bookmarks`);
    const snapshot = await bookmarksRef.once('value');
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const bookmarks = [];
    snapshot.forEach((childSnapshot) => {
      bookmarks.push({
        bookmarkId: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    return bookmarks;
  } catch (error) {
    console.error('Error getting bookmarks from Firebase:', error);
    return [];
  }
}

/**
 * Delete a bookmarked content image from Firebase
 * @param {string} userId - User ID
 * @param {string} bookmarkId - Bookmark ID to delete
 * @returns {Promise<boolean>} Success status
 */
async function deleteBookmark(userId, bookmarkId) {
  try {
    const db = getAdminDatabase();
    if (!db) {
      throw new Error('Firebase Admin not initialized');
    }
    
    const bookmarkRef = db.ref(`users/${userId}/gallery/bookmarks/${bookmarkId}`);
    await bookmarkRef.remove();
    return true;
  } catch (error) {
    console.error('Error deleting bookmark from Firebase:', error);
    return false;
  }
}

module.exports = {
  saveImageToFirebase,
  getUserBookmarks,
  deleteBookmark
};
