#!/usr/bin/env node

/**
 * Clean Global Image Cache
 * Removes outdated entries with invalid URLs
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const admin = require('firebase-admin');
const { initializeFirebaseAdmin, getAdminDatabase } = require('../helpers/firebase-admin-utils');

async function cleanGlobalCache() {
  try {
    console.log('🧹 Cleaning outdated Global Image Cache entries...');
    
    initializeFirebaseAdmin();
    const db = getAdminDatabase();
    const globalCacheRef = db.ref('globalImageCache/enhancedImages');
    
    const snapshot = await globalCacheRef.once('value');
    if (!snapshot.exists()) {
      console.log('📭 No entries to clean');
      return;
    }
    
    const enhancedData = snapshot.val();
    console.log('🔍 Found', Object.keys(enhancedData).length, 'entries to check');
    
    let cleanedCount = 0;
    for (const [contentHash, imageData] of Object.entries(enhancedData)) {
      if (imageData.enhancedImageUrl && (
          imageData.enhancedImageUrl.includes('upscaled/vendor-test') ||
          imageData.enhancedImageUrl.includes('upscaled/admin-cache-demo') ||
          imageData.enhancedImageUrl.includes('upscaled/test-user')
      )) {
        console.log('🗑️  Removing outdated entry:', contentHash, '->', imageData.enhancedImageUrl);
        await globalCacheRef.child(contentHash).remove();
        cleanedCount++;
      }
    }
    
    console.log(`✅ Global Cache cleanup complete - removed ${cleanedCount} outdated entries`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

if (require.main === module) {
  cleanGlobalCache().catch(console.error);
}