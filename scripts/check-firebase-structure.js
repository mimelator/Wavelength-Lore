#!/usr/bin/env node

require('dotenv').config();
const firebaseUtils = require('../helpers/firebase-utils');

async function checkStructure() {
  console.log('🔍 Checking Firebase structure...\n');
  
  try {
    firebaseUtils.initializeFirebase('check-structure');
    
    const charactersData = await firebaseUtils.fetchFromFirebase('characters');
    
    console.log('📊 Characters structure:');
    console.log('Top-level keys:', Object.keys(charactersData || {}));
    console.log('\nFirst few characters:');
    
    const keys = Object.keys(charactersData || {});
    for (let i = 0; i < Math.min(3, keys.length); i++) {
      const key = keys[i];
      const char = charactersData[key];
      console.log(`\n${key}:`, {
        id: char?.id,
        title: char?.title,
        type: Array.isArray(char) ? 'ARRAY' : typeof char
      });
      
      if (Array.isArray(char) && char.length > 0) {
        console.log('  First item in array:', {
          id: char[0]?.id,
          title: char[0]?.title
        });
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStructure();
