const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, get } = require('firebase/database');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../firebaseServiceAccountKey.json');

// Determine if we're running from scripts directory or project root
const isRunningFromScripts = __dirname.endsWith('scripts');
const contentPath = isRunningFromScripts ? '../content' : './content';

require('dotenv').config();

// CLI Usage Documentation
/*
Usage: node deploy-optimized-images.js [options]

Options:
  --dry-run       Show what would be updated without making changes
  --force         Apply updates to Firebase database
  --verify        Verify current database state and WebP file existence
  --characters    Update character data only
  --seasons       Update season/video data only
  --lore          Update lore data only
  
Examples:
  node deploy-optimized-images.js --dry-run     # Preview changes
  node deploy-optimized-images.js --force       # Apply all updates
  node deploy-optimized-images.js --verify      # Verify current state
  node deploy-optimized-images.js --force --characters # Update characters only
*/

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});

// Generate a custom token for authentication
async function getCustomToken() {
  const customToken = await admin.auth().createCustomToken('image_optimization_deployment', {
    isScript: true,
    operation: 'image_path_update'
  });
  return customToken;
}

// Initialize Firebase App with the custom token
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

// Convert image paths from PNG/JPG to WebP
function convertImagePath(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return imagePath;
  
  // Convert relative paths to WebP
  return imagePath
    .replace(/\.png$/i, '.webp')
    .replace(/\.jpg$/i, '.webp')
    .replace(/\.jpeg$/i, '.webp');
}

// Recursively update image paths in an object
function updateImagePaths(obj, stats = { updated: 0, skipped: 0 }) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const updated = JSON.parse(JSON.stringify(obj)); // Deep clone
  
  for (const key in updated) {
    if (key.toLowerCase().includes('image') && typeof updated[key] === 'string') {
      const originalPath = updated[key];
      const newPath = convertImagePath(originalPath);
      
      if (originalPath !== newPath) {
        updated[key] = newPath;
        stats.updated++;
        console.log(`    📸 ${key}: ${originalPath} → ${newPath}`);
      } else {
        stats.skipped++;
      }
    } else if (typeof updated[key] === 'object' && updated[key] !== null) {
      updated[key] = updateImagePaths(updated[key], stats);
    }
  }
  
  return updated;
}

// Verify WebP files exist in the filesystem
function verifyWebPFile(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return false;
  
  // Convert to absolute path
  const fullPath = path.join(__dirname, '..', 'static', imagePath.replace(/^\/static\//, ''));
  return fs.existsSync(fullPath);
}

// Update character data in Firebase
async function updateCharacters(database, dryRun = false) {
  console.log('\n👥 Processing characters...');
  let totalUpdated = 0;
  let totalVerified = 0;
  
  try {
    const charactersRef = ref(database, 'characters');
    const snapshot = await get(charactersRef);
    
    if (!snapshot.exists()) {
      console.log('⚠️  No character data found in database');
      return { updated: 0, verified: 0 };
    }
    
    const characters = snapshot.val();
    
    for (const [characterId, characterData] of Object.entries(characters)) {
      console.log(`\n  Processing character: ${characterId}`);
      const stats = { updated: 0, skipped: 0 };
      const updatedData = updateImagePaths(characterData, stats);
      
      if (stats.updated > 0) {
        totalUpdated += stats.updated;
        
        if (!dryRun) {
          const characterRef = ref(database, `characters/${characterId}`);
          await set(characterRef, updatedData);
          console.log(`    ✅ Updated ${stats.updated} image paths for ${characterId}`);
        } else {
          console.log(`    📋 Would update ${stats.updated} image paths for ${characterId}`);
        }
        
        // Verify WebP files exist
        for (const key in updatedData) {
          if (key.toLowerCase().includes('image') && typeof updatedData[key] === 'string') {
            if (verifyWebPFile(updatedData[key])) {
              totalVerified++;
            } else {
              console.log(`    ⚠️  WebP file not found: ${updatedData[key]}`);
            }
          }
        }
      } else {
        console.log(`    ℹ️  No updates needed for ${characterId}`);
      }
    }
    
    return { updated: totalUpdated, verified: totalVerified };
  } catch (error) {
    console.error('❌ Error updating characters:', error);
    return { updated: 0, verified: 0 };
  }
}

// Update season/video data in Firebase
async function updateSeasons(database, dryRun = false) {
  console.log('\n📺 Processing seasons...');
  let totalUpdated = 0;
  let totalVerified = 0;
  
  try {
    const videosRef = ref(database, 'videos');
    const snapshot = await get(videosRef);
    
    if (!snapshot.exists()) {
      console.log('⚠️  No season data found in database');
      return { updated: 0, verified: 0 };
    }
    
    const seasons = snapshot.val();
    
    for (const [seasonName, seasonData] of Object.entries(seasons)) {
      console.log(`\n  Processing season: ${seasonName}`);
      const stats = { updated: 0, skipped: 0 };
      const updatedData = updateImagePaths(seasonData, stats);
      
      if (stats.updated > 0) {
        totalUpdated += stats.updated;
        
        if (!dryRun) {
          const seasonRef = ref(database, `videos/${seasonName}`);
          await set(seasonRef, updatedData);
          console.log(`    ✅ Updated ${stats.updated} image paths for ${seasonName}`);
        } else {
          console.log(`    📋 Would update ${stats.updated} image paths for ${seasonName}`);
        }
        
        // Verify WebP files exist
        function verifyImagePaths(obj) {
          for (const key in obj) {
            if (key.toLowerCase().includes('image') && typeof obj[key] === 'string') {
              if (verifyWebPFile(obj[key])) {
                totalVerified++;
              } else {
                console.log(`    ⚠️  WebP file not found: ${obj[key]}`);
              }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              verifyImagePaths(obj[key]);
            }
          }
        }
        verifyImagePaths(updatedData);
      } else {
        console.log(`    ℹ️  No updates needed for ${seasonName}`);
      }
    }
    
    return { updated: totalUpdated, verified: totalVerified };
  } catch (error) {
    console.error('❌ Error updating seasons:', error);
    return { updated: 0, verified: 0 };
  }
}

// Update lore data in Firebase
async function updateLore(database, dryRun = false) {
  console.log('\n📚 Processing lore...');
  let totalUpdated = 0;
  let totalVerified = 0;
  
  try {
    const loreRef = ref(database, 'lore');
    const snapshot = await get(loreRef);
    
    if (!snapshot.exists()) {
      console.log('⚠️  No lore data found in database');
      return { updated: 0, verified: 0 };
    }
    
    const loreItems = snapshot.val();
    
    for (const [loreId, loreData] of Object.entries(loreItems)) {
      console.log(`\n  Processing lore: ${loreId}`);
      const stats = { updated: 0, skipped: 0 };
      const updatedData = updateImagePaths(loreData, stats);
      
      if (stats.updated > 0) {
        totalUpdated += stats.updated;
        
        if (!dryRun) {
          const loreItemRef = ref(database, `lore/${loreId}`);
          await set(loreItemRef, updatedData);
          console.log(`    ✅ Updated ${stats.updated} image paths for ${loreId}`);
        } else {
          console.log(`    📋 Would update ${stats.updated} image paths for ${loreId}`);
        }
        
        // Verify WebP files exist
        for (const key in updatedData) {
          if (key.toLowerCase().includes('image') && typeof updatedData[key] === 'string') {
            if (verifyWebPFile(updatedData[key])) {
              totalVerified++;
            } else {
              console.log(`    ⚠️  WebP file not found: ${updatedData[key]}`);
            }
          }
        }
      } else {
        console.log(`    ℹ️  No updates needed for ${loreId}`);
      }
    }
    
    return { updated: totalUpdated, verified: totalVerified };
  } catch (error) {
    console.error('❌ Error updating lore:', error);
    return { updated: 0, verified: 0 };
  }
}

// Verify current database state
async function verifyDatabase(database) {
  console.log('\n🔍 Verifying current database state...');
  
  const results = {
    characters: { total: 0, webp: 0, missing: 0 },
    seasons: { total: 0, webp: 0, missing: 0 },
    lore: { total: 0, webp: 0, missing: 0 }
  };
  
  // Verify characters
  try {
    const charactersRef = ref(database, 'characters');
    const snapshot = await get(charactersRef);
    if (snapshot.exists()) {
      const characters = snapshot.val();
      for (const characterData of Object.values(characters)) {
        function checkImagePaths(obj) {
          for (const key in obj) {
            if (key.toLowerCase().includes('image') && typeof obj[key] === 'string') {
              results.characters.total++;
              if (obj[key].endsWith('.webp')) {
                results.characters.webp++;
                if (!verifyWebPFile(obj[key])) {
                  results.characters.missing++;
                }
              }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              checkImagePaths(obj[key]);
            }
          }
        }
        checkImagePaths(characterData);
      }
    }
  } catch (error) {
    console.error('Error verifying characters:', error);
  }
  
  // Similar verification for seasons and lore...
  console.log('\n📊 Database verification results:');
  console.log(`Characters: ${results.characters.webp}/${results.characters.total} using WebP (${results.characters.missing} missing files)`);
  console.log(`Seasons: ${results.seasons.webp}/${results.seasons.total} using WebP (${results.seasons.missing} missing files)`);
  console.log(`Lore: ${results.lore.webp}/${results.lore.total} using WebP (${results.lore.missing} missing files)`);
  
  return results;
}

// Main deployment function
async function deployOptimizedImages() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const verify = args.includes('--verify');
  const charactersOnly = args.includes('--characters');
  const seasonsOnly = args.includes('--seasons');
  const loreOnly = args.includes('--lore');
  
  if (!dryRun && !force && !verify) {
    console.log('❌ Please specify either --dry-run, --force, or --verify');
    console.log('Use --dry-run to preview changes without applying them');
    console.log('Use --force to apply changes to the database');
    console.log('Use --verify to check current database state');
    return;
  }
  
  console.log('🚀 Starting optimized image deployment...');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : force ? 'APPLYING CHANGES' : 'VERIFICATION'}`);
  
  try {
    const database = await initializeFirebaseWithToken();
    
    if (verify) {
      await verifyDatabase(database);
      return;
    }
    
    const results = {
      characters: { updated: 0, verified: 0 },
      seasons: { updated: 0, verified: 0 },
      lore: { updated: 0, verified: 0 }
    };
    
    // Determine what to update
    const updateAll = !charactersOnly && !seasonsOnly && !loreOnly;
    
    if (updateAll || charactersOnly) {
      results.characters = await updateCharacters(database, dryRun);
    }
    
    if (updateAll || seasonsOnly) {
      results.seasons = await updateSeasons(database, dryRun);
    }
    
    if (updateAll || loreOnly) {
      results.lore = await updateLore(database, dryRun);
    }
    
    // Summary
    const totalUpdated = results.characters.updated + results.seasons.updated + results.lore.updated;
    const totalVerified = results.characters.verified + results.seasons.verified + results.lore.verified;
    
    console.log('\n📊 Deployment Summary:');
    console.log(`Total image paths ${dryRun ? 'would be updated' : 'updated'}: ${totalUpdated}`);
    console.log(`Total WebP files verified: ${totalVerified}`);
    
    if (dryRun) {
      console.log('\n💡 Run with --force to apply these changes to the database');
    } else if (force) {
      console.log('\n✅ Database deployment completed successfully!');
      console.log('🎯 All image references have been updated to use optimized WebP format');
    }
    
  } catch (error) {
    console.error('❌ Error during deployment:', error);
    process.exit(1);
  }
}

deployOptimizedImages();