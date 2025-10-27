#!/usr/bin/env node

console.log('🔍 WAVELENGTH CTA TROUBLESHOOTING - FIREBASE DATA CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const https = require('https');

/**
 * Fetch character data directly from Firebase to debug CTA fields
 */
async function checkFirebaseCharacterData() {
  try {
    console.log('🔥 Checking Firebase character data directly...');
    
    // Test Andrew character specifically
    const andrewData = await fetchFirebaseData('characters/andrew');
    
    console.log('\n🎭 ANDREW CHARACTER DATA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (andrewData) {
      console.log('✅ Character data found');
      console.log('📋 Basic Info:');
      console.log(`  • Title: ${andrewData.title || 'MISSING'}`);
      console.log(`  • Description: ${andrewData.description ? 'PRESENT' : 'MISSING'}`);
      
      console.log('\n🎯 CTA FIELDS CHECK:');
      console.log(`  • Tagline: ${andrewData.tagline ? '✅ PRESENT' : '❌ MISSING'}`);
      if (andrewData.tagline) {
        console.log(`    📝 Value: "${andrewData.tagline}"`);
      }
      
      console.log(`  • Stakes: ${andrewData.stakes ? '✅ PRESENT' : '❌ MISSING'}`);
      if (andrewData.stakes) {
        console.log(`    📝 Length: ${andrewData.stakes.length} characters`);
        console.log(`    📝 Preview: "${andrewData.stakes.substring(0, 100)}..."`);
      }
      
      console.log(`  • CTA Text: ${andrewData.cta_text ? '✅ PRESENT' : '❌ MISSING'}`);
      if (andrewData.cta_text) {
        console.log(`    📝 Value: "${andrewData.cta_text}"`);
      }
      
      console.log('\n📊 FULL CHARACTER OBJECT KEYS:');
      console.log('  Available fields:', Object.keys(andrewData).join(', '));
      
    } else {
      console.log('❌ No character data found');
    }
    
    // Test multiple characters
    console.log('\n🎭 TESTING MULTIPLE CHARACTERS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const testCharacters = ['alex', 'andrew', 'daphne'];
    
    for (const charId of testCharacters) {
      const charData = await fetchFirebaseData(`characters/${charId}`);
      
      if (charData) {
        const hasCTAFields = !!(charData.tagline && charData.stakes && charData.cta_text);
        console.log(`  ${charId.toUpperCase()}: ${hasCTAFields ? '✅ All CTA fields present' : '❌ Missing CTA fields'}`);
        
        if (!hasCTAFields) {
          console.log(`    Missing: ${!charData.tagline ? 'tagline ' : ''}${!charData.stakes ? 'stakes ' : ''}${!charData.cta_text ? 'cta_text' : ''}`);
        }
      } else {
        console.log(`  ${charId.toUpperCase()}: ❌ Character not found`);
      }
    }
    
  } catch (error) {
    console.error('❌ Firebase check failed:', error.message);
  }
}

/**
 * Fetch data from Firebase Realtime Database
 */
function fetchFirebaseData(path) {
  return new Promise((resolve, reject) => {
    const url = `https://wavelength-lore-default-rtdb.firebaseio.com/${path}.json`;
    console.log(`🔍 Fetching: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', reject);
  });
}

// Run the check
checkFirebaseCharacterData().catch(error => {
  console.error('❌ Character data check failed:', error);
  process.exit(1);
});