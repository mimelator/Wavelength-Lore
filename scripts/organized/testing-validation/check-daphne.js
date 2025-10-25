#!/usr/bin/env node

require('dotenv').config();
const firebaseUtils = require('../helpers/firebase-utils');

async function checkDaphne() {
  console.log('🔍 Checking daphne-flower in Firebase...\n');
  
  try {
    firebaseUtils.initializeFirebase('check-daphne');
    
    const loreData = await firebaseUtils.fetchFromFirebase('lore');
    const daphne = loreData['daphne-flower'];
    
    console.log('Daphne data:');
    console.log(JSON.stringify(daphne, null, 2));
    
    console.log('\n🖼️  Image field:', daphne?.image);
    console.log('📸 Image gallery:', daphne?.image_gallery);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDaphne();
