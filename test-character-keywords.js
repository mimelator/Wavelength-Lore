#!/usr/bin/env node

/**
 * Test Character Keywords
 * 
 * This script tests the new character keyword functionality
 */

require('dotenv').config();
const characterHelpers = require('./helpers/character-helpers');
const { initializeApp } = require('firebase/app');
const { getDatabase } = require('firebase/database');

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: process.env.AUTH_DOMAIN,
  databaseURL: process.env.DATABASE_URL,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_ID
};

async function testCharacterKeywords() {
  console.log('🎭 Testing Character Keywords\n');

  try {
    // Test without database to use fallback characters with keywords
    console.log('✅ Using fallback characters with keywords\n');

    // Check what characters are loaded
    const characters = characterHelpers.getAllCharactersSync();
    console.log('Loaded characters:');
    characters.forEach(char => {
      console.log(`- ${char.name} (keywords: ${JSON.stringify(char.keywords || [])})`);
    });
    console.log('');

    // Test text with character names and keywords
    const testText = `The Prince led the band, while Alex played the drums. The Wise Elder provided guidance during the battle, and Princess Jewel sang beautifully. The Merchant sold supplies to the Ice Beast in the snowy mountains.`;
    
    console.log('Input text:');
    console.log(testText);
    console.log('');
    
    const result = characterHelpers.linkifyCharacterMentionsSync(testText);
    console.log('Output with character keyword linking:');
    console.log(result);
    console.log('');
    
    console.log('Expected links:');
    console.log('- "Prince" should link to Prince Andrew');
    console.log('- "Alex" should link to Alexandria');
    console.log('- "Wise Elder" should link to Lucky');
    console.log('- "Princess Jewel" should link to Jewel');
    console.log('- "Merchant" should link to Maurice');
    console.log('- "Ice Beast" should link to Yeti');
    console.log('');
    
    console.log('✅ Character keyword test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testCharacterKeywords().catch(console.error);