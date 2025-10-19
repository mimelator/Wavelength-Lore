#!/usr/bin/env node

/**
 * Fix Database URLs for Local Development
 * Convert full CloudFront URLs to relative paths for CDN flexibility
 */

const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get } = require('firebase/database');
require('dotenv').config();

console.log('🔧 Converting database URLs to relative paths for CDN flexibility...\n');

// Initialize Firebase Admin SDK
const serviceAccount = require('../firebaseServiceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});

async function getCustomToken() {
  const customToken = await admin.auth().createCustomToken('url_fixer', {
    isScript: true
  });
  return customToken;
}

async function initializeFirebaseWithToken() {
  const customToken = await getCustomToken();
  const firebaseApp = initializeApp({
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID
  });

  const auth = require('firebase/auth');
  const { getAuth, signInWithCustomToken } = auth;
  const firebaseAuth = getAuth(firebaseApp);

  await signInWithCustomToken(firebaseAuth, customToken);
  return getDatabase(firebaseApp);
}

// Convert CloudFront URL to relative path
function convertToRelativePath(url) {
  if (!url || typeof url !== 'string') return url;
  
  // Extract the path from CloudFront URLs
  if (url.includes('df5sj8f594cdx.cloudfront.net')) {
    return url.replace('https://df5sj8f594cdx.cloudfront.net', '');
  }
  
  // If already relative, keep as is
  return url;
}

// Recursively convert URLs in an object
function convertImagePaths(obj, stats = { converted: 0, skipped: 0 }) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const updated = JSON.parse(JSON.stringify(obj)); // Deep clone
  
  for (const key in updated) {
    if (key.toLowerCase().includes('image') && typeof updated[key] === 'string') {
      const originalUrl = updated[key];
      const relativePath = convertToRelativePath(originalUrl);
      
      if (originalUrl !== relativePath) {
        updated[key] = relativePath;
        stats.converted++;
        console.log(`    📸 ${key}: ${originalUrl} → ${relativePath}`);
      } else {
        stats.skipped++;
      }
    } else if (typeof updated[key] === 'object' && updated[key] !== null) {
      updated[key] = convertImagePaths(updated[key], stats);
    }
  }
  
  return updated;
}

async function fixDatabaseUrls() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  
  if (!dryRun && !force) {
    console.log('❌ Please specify either --dry-run or --force');
    console.log('   --dry-run: Preview changes without applying them');
    console.log('   --force: Apply changes to the database');
    return;
  }
  
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'APPLYING CHANGES'}\n`);
  
  try {
    const database = await initializeFirebaseWithToken();
    let totalConverted = 0;
    
    // Fix seasons
    console.log('📺 Processing seasons...');
    const seasonsRef = ref(database, 'videos');
    const seasonsSnapshot = await get(seasonsRef);
    
    if (seasonsSnapshot.exists()) {
      const seasonsData = seasonsSnapshot.val();
      
      for (const [seasonName, seasonData] of Object.entries(seasonsData)) {
        console.log(`\n  Processing season: ${seasonName}`);
        const stats = { converted: 0, skipped: 0 };
        const updatedData = convertImagePaths(seasonData, stats);
        
        if (stats.converted > 0) {
          totalConverted += stats.converted;
          
          if (!dryRun) {
            const seasonRef = ref(database, `videos/${seasonName}`);
            await set(seasonRef, updatedData);
            console.log(`    ✅ Updated ${stats.converted} URLs for ${seasonName}`);
          } else {
            console.log(`    📋 Would update ${stats.converted} URLs for ${seasonName}`);
          }
        } else {
          console.log(`    ℹ️  No URLs to convert for ${seasonName}`);
        }
      }
    }
    
    // Fix characters
    console.log('\n👥 Processing characters...');
    const charactersRef = ref(database, 'characters');
    const charactersSnapshot = await get(charactersRef);
    
    if (charactersSnapshot.exists()) {
      const charactersData = charactersSnapshot.val();
      
      for (const [characterId, characterData] of Object.entries(charactersData)) {
        console.log(`\n  Processing character: ${characterId}`);
        const stats = { converted: 0, skipped: 0 };
        const updatedData = convertImagePaths(characterData, stats);
        
        if (stats.converted > 0) {
          totalConverted += stats.converted;
          
          if (!dryRun) {
            const characterRef = ref(database, `characters/${characterId}`);
            await set(characterRef, updatedData);
            console.log(`    ✅ Updated ${stats.converted} URLs for ${characterId}`);
          } else {
            console.log(`    📋 Would update ${stats.converted} URLs for ${characterId}`);
          }
        } else {
          console.log(`    ℹ️  No URLs to convert for ${characterId}`);
        }
      }
    }
    
    // Fix lore
    console.log('\n📚 Processing lore...');
    const loreRef = ref(database, 'lore');
    const loreSnapshot = await get(loreRef);
    
    if (loreSnapshot.exists()) {
      const loreData = loreSnapshot.val();
      
      for (const [loreId, loreItem] of Object.entries(loreData)) {
        console.log(`\n  Processing lore: ${loreId}`);
        const stats = { converted: 0, skipped: 0 };
        const updatedData = convertImagePaths(loreItem, stats);
        
        if (stats.converted > 0) {
          totalConverted += stats.converted;
          
          if (!dryRun) {
            const loreItemRef = ref(database, `lore/${loreId}`);
            await set(loreItemRef, updatedData);
            console.log(`    ✅ Updated ${stats.converted} URLs for ${loreId}`);
          } else {
            console.log(`    📋 Would update ${stats.converted} URLs for ${loreId}`);
          }
        } else {
          console.log(`    ℹ️  No URLs to convert for ${loreId}`);
        }
      }
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`Total URLs ${dryRun ? 'would be converted' : 'converted'}: ${totalConverted}`);
    
    if (dryRun) {
      console.log('\n💡 Run with --force to apply these changes');
    } else if (force) {
      console.log('\n✅ Database URLs converted to relative paths!');
      console.log('🎯 Now your site will work with any CDN_URL setting:');
      console.log('   - Local dev: CDN_URL=http://localhost:3001');
      console.log('   - Production: CDN_URL=https://df5sj8f594cdx.cloudfront.net');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixDatabaseUrls();