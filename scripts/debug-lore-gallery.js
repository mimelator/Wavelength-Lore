#!/usr/bin/env node

/**
 * Debug Lore Gallery
 * 
 * This script helps debug what data the lore gallery is receiving
 */

require('dotenv').config();
const loreHelpers = require('../helpers/lore-helpers');
const firebaseUtils = require('../helpers/firebase-utils');

async function debugLoreGallery() {
  console.log('🔍 Debugging Lore Gallery Data...\n');
  
  try {
    // Initialize Firebase
    if (!firebaseUtils.isFirebaseReady()) {
      firebaseUtils.initializeFirebase('debug-lore-gallery');
    }
    
    // Get all lore data
    const allLore = await loreHelpers.getAllLore();
    
    console.log(`📊 Total lore items: ${allLore.length}\n`);
    
    // Show each lore item with its image path
    allLore.forEach((lore, index) => {
      console.log(`${index + 1}. ${lore.title || lore.name}`);
      console.log(`   ID: ${lore.id}`);
      console.log(`   Type: ${lore.type}`);
      console.log(`   Image: ${lore.image || 'No image'}`);
      console.log(`   URL: ${lore.url}`);
      console.log('');
    });
    
    // Test CDN_URL environment variable
    console.log('🔧 Environment Variables:');
    console.log(`   CDN_URL: ${process.env.CDN_URL}`);
    console.log('');
    
    // Test image URL construction (simulate what the template does)
    console.log('🎨 Simulated Image URLs:');
    allLore.slice(0, 3).forEach(lore => {
      if (lore.image) {
        const finalUrl = process.env.CDN_URL + lore.image;
        console.log(`   ${lore.title}: ${finalUrl}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error debugging lore gallery:', error);
  }
  
  process.exit(0);
}

debugLoreGallery();