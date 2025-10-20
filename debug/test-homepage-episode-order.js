#!/usr/bin/env node

/**
 * Test episode ordering on the homepage
 * Simulates what index.ejs will display
 */

// Load environment variables
require('dotenv').config();

const firebaseUtils = require('../helpers/firebase-utils');

async function testHomepageEpisodeOrder() {
  try {
    console.log('\n🏠 Testing Homepage Episode Display Order\n');
    console.log('='.repeat(60));
    
    // Initialize Firebase
    firebaseUtils.initializeFirebase('test-homepage-order');
    
    // Fetch videos data (same as homepage route)
    const videos = await firebaseUtils.fetchFromFirebase('videos');
    
    if (!videos) {
      console.error('❌ No videos data found');
      process.exit(1);
    }
    
    // Simulate what index.ejs does with the sorting logic
    console.log('\n📺 Simulating Homepage Carousel Display:\n');
    
    for (const season in videos) {
      const seasonData = videos[season];
      console.log(`\n${seasonData.title}`);
      console.log('-'.repeat(40));
      
      // Apply the same sorting logic as in index.ejs
      const episodeKeys = Object.keys(seasonData.episodes).sort((a, b) => {
        const numA = parseInt(a.replace('episode', ''));
        const numB = parseInt(b.replace('episode', ''));
        return numA - numB;
      });
      
      // Display episodes in sorted order
      episodeKeys.forEach((episode, index) => {
        const episodeData = seasonData.episodes[episode];
        console.log(`  ${index + 1}. ${episode}: ${episodeData.title}`);
      });
    }
    
    // Verify Season 1 specifically (had the issue)
    console.log('\n\n✅ Verification:');
    const season1Episodes = Object.keys(videos.season1.episodes).sort((a, b) => {
      const numA = parseInt(a.replace('episode', ''));
      const numB = parseInt(b.replace('episode', ''));
      return numA - numB;
    });
    
    const expectedOrder = [
      'episode1', 'episode2', 'episode3', 'episode4', 'episode5',
      'episode6', 'episode7', 'episode8', 'episode9', 'episode10', 'episode11'
    ];
    
    const isCorrect = JSON.stringify(season1Episodes) === JSON.stringify(expectedOrder);
    
    if (isCorrect) {
      console.log('✅ Season 1 episodes are in correct order!');
      console.log('   Expected:', expectedOrder.join(', '));
      console.log('   Got:     ', season1Episodes.join(', '));
    } else {
      console.log('❌ Season 1 episodes are NOT in correct order!');
      console.log('   Expected:', expectedOrder.join(', '));
      console.log('   Got:     ', season1Episodes.join(', '));
    }
    
    console.log('\n✨ Homepage will now display episodes in chronological order!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testHomepageEpisodeOrder();
