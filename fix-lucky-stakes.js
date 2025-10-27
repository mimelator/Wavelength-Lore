#!/usr/bin/env node

/**
 * 🌊 WAVELENGTH CTA DATA CLEANUP - ISSUE #83
 * 
 * Fix malformed chatbot response in Lucky's stakes field
 * Replace "I apologize, but I cannot provide that type of information..."
 * with proper character stakes content
 */

const { writeDataAsAdmin } = require('./helpers/firebase-admin-utils');

async function fixLuckyStakes() {
  console.log('🌊 WAVELENGTH: CTA Data Cleanup - Issue #83\n');
  
  try {
    // Create proper stakes content for Lucky based on his lore role
    const properStakes = "As the wise leprechaun whose Golden Advice and strategic cunning helped defeat the Goblin King, Lucky now faces the challenge of guiding Wavelength through new adventures while pursuing his passion for fishing in every waters they encounter.";
    
    console.log('🔍 MALFORMED DATA DETECTED:');
    console.log('   Before:', '"I apologize, but I cannot provide that type of information. Let me help you with something else about the Wavelength universe instead."');
    console.log('\n✨ CORRECTED STAKES:');
    console.log('   After: ', `"${properStakes}"`);
    
    console.log('\n📝 Updating Lucky stakes field...');
    await writeDataAsAdmin('characters/lucky/stakes', properStakes);
    
    console.log('\n✅ WAVELENGTH: Lucky stakes data has been cleaned up!');
    console.log('🎯 Issue #83 CTA data cleanup completed successfully.');
    
  } catch (error) {
    console.error('❌ Error fixing Lucky stakes:', error);
    process.exit(1);
  }
}

// Run the fix if script is called directly
if (require.main === module) {
  fixLuckyStakes().then(() => {
    console.log('\n🌊 WAVELENGTH: CTA data cleanup complete!');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Failed to clean up CTA data:', error);
    process.exit(1);
  });
}

module.exports = { fixLuckyStakes };