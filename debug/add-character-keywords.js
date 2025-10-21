/**
 * Script to add character keywords to episodes in Firebase
 * This will update episodes to include character name keywords for badge display
 */

require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = require('../wavelength-lore-firebase-adminsdk.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});

const db = admin.database();

// Episodes that need character keywords added
// Based on analysis of episode content, summaries, and lyrics
const episodeUpdates = [
  // Season 1
  {
    season: 1,
    episode: 5,
    title: "Falling",
    addKeywords: ['daphne'],
    reason: 'Daphne is mentioned in the story'
  },
  {
    season: 1,
    episode: 6,
    title: "Once More",
    addKeywords: ['jewel'],
    reason: 'About remembering Princess Jewel'
  },
  
  // Season 2
  {
    season: 2,
    episode: 3,
    title: "Countdown",
    addKeywords: ['lucky'],
    reason: 'Lucky appears in the story'
  },
  
  // Season 4
  {
    season: 4,
    episode: 5,
    title: "The Shire Fortress",
    addKeywords: ['lucky'],
    reason: 'Lucky helps fortify the shire'
  },
  {
    season: 4,
    episode: 7,
    title: "Song Of Mourning",
    addKeywords: ['eloquence'],
    reason: 'Eloquence is mourning Maurice'
  },
  {
    season: 4,
    episode: 8,
    title: "The Shire Dream",
    addKeywords: ['daphne'],
    reason: 'Daphne is featured in the finale'
  }
];

async function updateEpisodeKeywords() {
  try {
    console.log('🔄 Starting episode keyword updates...\n');
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const update of episodeUpdates) {
      const path = `videos/season${update.season}/episodes/episode${update.episode}/keywords`;
      
      try {
        // Fetch current keywords
        const snapshot = await db.ref(path).once('value');
        const currentKeywords = snapshot.val() || [];
        
        // Add new keywords (avoid duplicates)
        const newKeywords = [...new Set([...currentKeywords, ...update.addKeywords])];
        
        // Only update if there are actual changes
        if (newKeywords.length > currentKeywords.length) {
          await db.ref(path).set(newKeywords);
          
          console.log(`✅ S${update.season}E${update.episode} - ${update.title}`);
          console.log(`   Before: [${currentKeywords.join(', ')}]`);
          console.log(`   After:  [${newKeywords.join(', ')}]`);
          console.log(`   Reason: ${update.reason}\n`);
          
          updatedCount++;
        } else {
          console.log(`⏭️  S${update.season}E${update.episode} - ${update.title} (already has these keywords)\n`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating S${update.season}E${update.episode}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 UPDATE SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`✅ Episodes updated: ${updatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total processed: ${episodeUpdates.length}\n`);
    
    console.log('🎉 Character badges should now appear on more episode pages!');
    console.log('💡 Run: node debug/check-episode-characters.js to verify\n');
    
    await admin.app().delete();
    process.exit(0);
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the update
updateEpisodeKeywords();
