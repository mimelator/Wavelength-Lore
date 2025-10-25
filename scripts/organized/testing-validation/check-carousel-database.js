#!/usr/bin/env node

/**
 * Check current carousel images in Firebase database
 * This script shows what carousel images are currently stored in the database
 */

require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../firebaseServiceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});

const db = admin.database();

async function checkCarouselImagesInDatabase() {
  console.log('🔍 Checking carousel images in database...');
  
  try {
    // Get all videos data
    const snapshot = await db.ref('videos').once('value');
    const data = snapshot.val();
    
    if (!data) {
      console.log('❌ No videos data found in database');
      return;
    }
    
    let totalCarouselImages = 0;
    
    // Check each season
    for (const [seasonKey, seasonData] of Object.entries(data)) {
      if (seasonData.episodes) {
        console.log(`\n📺 Season: ${seasonKey}`);
        
        for (const [episodeKey, episodeData] of Object.entries(seasonData.episodes)) {
          if (episodeData.carouselImages && episodeData.carouselImages.length > 0) {
            console.log(`\n  🎬 Episode: ${episodeKey} (${episodeData.title || 'No title'})`);
            console.log(`     Carousel images (${episodeData.carouselImages.length}):`);
            
            episodeData.carouselImages.forEach((image, index) => {
              console.log(`       ${index + 1}. ${image}`);
              totalCarouselImages++;
            });
          }
        }
      }
    }
    
    console.log(`\n📊 Total carousel images found: ${totalCarouselImages}`);
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await checkCarouselImagesInDatabase();
    console.log('\n✅ Database carousel check completed!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Database carousel check failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkCarouselImagesInDatabase };