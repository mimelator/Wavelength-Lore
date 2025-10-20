#!/usr/bin/env node

/**
 * Comprehensive Visibility System Diagnostic
 * 
 * This script checks all aspects of the visibility system to identify issues
 */

require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://wavelength-lore-default-rtdb.firebaseio.com'
  });
}

const db = admin.database();

console.log('\n' + '='.repeat(70));
console.log('🔍 VISIBILITY SYSTEM DIAGNOSTIC');
console.log('='.repeat(70));
console.log(`📅 Date: ${new Date().toLocaleString()}\n`);

async function checkDatabase() {
  console.log('📊 STEP 1: Checking Firebase Database\n');
  console.log('-'.repeat(70));
  
  try {
    // Check Lore
    const loreSnapshot = await db.ref('lore').once('value');
    const allLore = loreSnapshot.val();
    
    console.log('📚 LORE ITEMS:');
    if (allLore) {
      const loreArray = Object.entries(allLore);
      console.log(`   Total lore items: ${loreArray.length}`);
      
      const hiddenLore = loreArray.filter(([id, data]) => data.visible === false);
      const visibleLore = loreArray.filter(([id, data]) => data.visible === true);
      const undefinedLore = loreArray.filter(([id, data]) => data.visible === undefined);
      
      console.log(`   ✅ Explicitly visible (visible=true): ${visibleLore.length}`);
      console.log(`   🔒 Explicitly hidden (visible=false): ${hiddenLore.length}`);
      console.log(`   ⚪ Undefined (no field): ${undefinedLore.length} (treated as visible)\n`);
      
      if (hiddenLore.length > 0) {
        console.log('   🔒 Hidden lore items:');
        hiddenLore.forEach(([id, data]) => {
          console.log(`      - ${id}: "${data.title}"`);
        });
        console.log('');
      }
    } else {
      console.log('   ❌ No lore found in database\n');
    }
    
    // Check Characters
    const charSnapshot = await db.ref('characters').once('value');
    const allChars = charSnapshot.val();
    
    console.log('👤 CHARACTERS:');
    if (allChars) {
      const charArray = Object.entries(allChars);
      console.log(`   Total characters: ${charArray.length}`);
      
      const hiddenChars = charArray.filter(([id, data]) => data.visible === false);
      const visibleChars = charArray.filter(([id, data]) => data.visible === true);
      const undefinedChars = charArray.filter(([id, data]) => data.visible === undefined);
      
      console.log(`   ✅ Explicitly visible (visible=true): ${visibleChars.length}`);
      console.log(`   🔒 Explicitly hidden (visible=false): ${hiddenChars.length}`);
      console.log(`   ⚪ Undefined (no field): ${undefinedChars.length} (treated as visible)\n`);
      
      if (hiddenChars.length > 0) {
        console.log('   🔒 Hidden characters:');
        hiddenChars.forEach(([id, data]) => {
          console.log(`      - ${id}: "${data.title || data.name}"`);
        });
        console.log('');
      }
    } else {
      console.log('   ❌ No characters found in database\n');
    }
    
    // Check Episodes
    const videosSnapshot = await db.ref('videos').once('value');
    const allVideos = videosSnapshot.val();
    
    console.log('📺 EPISODES:');
    if (allVideos) {
      let totalEpisodes = 0;
      let hiddenEpisodes = [];
      let visibleEpisodes = [];
      let undefinedEpisodes = [];
      
      Object.entries(allVideos).forEach(([seasonKey, seasonData]) => {
        if (seasonData.episodes) {
          Object.entries(seasonData.episodes).forEach(([epKey, epData]) => {
            totalEpisodes++;
            if (epData.visible === false) {
              hiddenEpisodes.push({ season: seasonKey, episode: epKey, title: epData.title });
            } else if (epData.visible === true) {
              visibleEpisodes.push({ season: seasonKey, episode: epKey, title: epData.title });
            } else {
              undefinedEpisodes.push({ season: seasonKey, episode: epKey, title: epData.title });
            }
          });
        }
      });
      
      console.log(`   Total episodes: ${totalEpisodes}`);
      console.log(`   ✅ Explicitly visible (visible=true): ${visibleEpisodes.length}`);
      console.log(`   🔒 Explicitly hidden (visible=false): ${hiddenEpisodes.length}`);
      console.log(`   ⚪ Undefined (no field): ${undefinedEpisodes.length} (treated as visible)\n`);
      
      if (hiddenEpisodes.length > 0) {
        console.log('   🔒 Hidden episodes:');
        hiddenEpisodes.forEach(ep => {
          console.log(`      - ${ep.season}/${ep.episode}: "${ep.title}"`);
        });
        console.log('');
      }
    } else {
      console.log('   ❌ No episodes found in database\n');
    }
    
    return {
      lore: allLore,
      characters: allChars,
      episodes: allVideos
    };
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    return null;
  }
}

async function checkHelperFunctions() {
  console.log('\n' + '-'.repeat(70));
  console.log('📊 STEP 2: Testing Helper Functions\n');
  console.log('-'.repeat(70));
  
  try {
    const firebaseUtils = require('../helpers/firebase-utils');
    const characterHelpers = require('../helpers/character-helpers');
    const loreHelpers = require('../helpers/lore-helpers');
    const episodeHelpers = require('../helpers/episode-helpers');
    
    // Initialize
    const database = firebaseUtils.initializeFirebase('wavelength-lore-main');
    characterHelpers.setDatabaseInstance(database);
    loreHelpers.setDatabaseInstance(database);
    episodeHelpers.setDatabaseInstance(database);
    
    await Promise.all([
      characterHelpers.initializeCharacterCache(),
      loreHelpers.initializeLoreCache(),
      episodeHelpers.initializeEpisodeCache()
    ]);
    
    console.log('✅ Helper caches initialized\n');
    
    // Test lore filtering
    console.log('📚 Testing Lore Helper Filtering:');
    const allLoreWithHidden = await loreHelpers.getAllLore(true);
    const allLoreFiltered = await loreHelpers.getAllLore(false);
    
    console.log(`   getAllLore(true) - Show hidden: ${allLoreWithHidden.length} items`);
    console.log(`   getAllLore(false) - Hide hidden: ${allLoreFiltered.length} items`);
    console.log(`   Difference: ${allLoreWithHidden.length - allLoreFiltered.length} hidden items`);
    
    const hiddenLoreItems = allLoreWithHidden.filter(l => l.visible === false);
    if (hiddenLoreItems.length > 0) {
      console.log(`   ✅ Filter working: ${hiddenLoreItems.length} hidden items detected`);
      hiddenLoreItems.forEach(l => {
        console.log(`      - ${l.id || l.lore_id}: "${l.title}"`);
      });
    } else {
      console.log(`   ⚠️  No hidden lore items found`);
    }
    console.log('');
    
    // Test character filtering
    console.log('👤 Testing Character Helper Filtering:');
    const allCharsWithHidden = await characterHelpers.getAllCharacters(true);
    const allCharsFiltered = await characterHelpers.getAllCharacters(false);
    
    console.log(`   getAllCharacters(true) - Show hidden: ${allCharsWithHidden.length} items`);
    console.log(`   getAllCharacters(false) - Hide hidden: ${allCharsFiltered.length} items`);
    console.log(`   Difference: ${allCharsWithHidden.length - allCharsFiltered.length} hidden items`);
    
    const hiddenChars = allCharsWithHidden.filter(c => c.visible === false);
    if (hiddenChars.length > 0) {
      console.log(`   ✅ Filter working: ${hiddenChars.length} hidden items detected`);
    } else {
      console.log(`   ⚠️  No hidden characters found`);
    }
    console.log('');
    
    // Test episode filtering
    console.log('📺 Testing Episode Helper Filtering:');
    const allEpsWithHidden = await episodeHelpers.getAllEpisodes(true);
    const allEpsFiltered = await episodeHelpers.getAllEpisodes(false);
    
    console.log(`   getAllEpisodes(true) - Show hidden: ${allEpsWithHidden.length} items`);
    console.log(`   getAllEpisodes(false) - Hide hidden: ${allEpsFiltered.length} items`);
    console.log(`   Difference: ${allEpsWithHidden.length - allEpsFiltered.length} hidden items`);
    
    const hiddenEps = allEpsWithHidden.filter(e => e.visible === false);
    if (hiddenEps.length > 0) {
      console.log(`   ✅ Filter working: ${hiddenEps.length} hidden items detected`);
    } else {
      console.log(`   ⚠️  No hidden episodes found`);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Error testing helpers:', error.message);
  }
}

async function checkAPIEndpoints() {
  console.log('\n' + '-'.repeat(70));
  console.log('📊 STEP 3: Checking API Endpoints\n');
  console.log('-'.repeat(70));
  
  const fs = require('fs');
  const path = require('path');
  
  const contentApiPath = path.join(__dirname, '../routes/contentApi.js');
  const contentRoutesPath = path.join(__dirname, '../routes/content.js');
  
  try {
    console.log('🔍 Checking routes/contentApi.js:');
    const contentApiContent = fs.readFileSync(contentApiPath, 'utf8');
    
    const hasLoreVisibility = contentApiContent.includes("router.put('/api/content/lore/:loreId/visibility'");
    const hasCharVisibility = contentApiContent.includes("router.put('/api/content/character/:characterId/visibility'");
    const hasEpVisibility = contentApiContent.includes("router.put('/api/content/episode/:seasonNumber/:episodeNumber/visibility'");
    
    console.log(`   ${hasLoreVisibility ? '✅' : '❌'} Lore visibility endpoint exists`);
    console.log(`   ${hasCharVisibility ? '✅' : '❌'} Character visibility endpoint exists`);
    console.log(`   ${hasEpVisibility ? '✅' : '❌'} Episode visibility endpoint exists\n`);
    
    console.log('🔍 Checking routes/content.js:');
    const contentRoutesContent = fs.readFileSync(contentRoutesPath, 'utf8');
    
    // Check gallery routes use filtering
    const loreGalleryHasFilter = contentRoutesContent.includes('getAllLore(showHidden)') || 
                                  contentRoutesContent.includes('getAllLore(res.locals.isContentCreator');
    const charGalleryHasFilter = contentRoutesContent.includes('getAllCharacters(showHidden)') || 
                                  contentRoutesContent.includes('getAllCharacters(res.locals.isContentCreator');
    
    console.log(`   ${loreGalleryHasFilter ? '✅' : '❌'} Lore gallery uses filtered getAllLore()`);
    console.log(`   ${charGalleryHasFilter ? '✅' : '❌'} Character gallery uses filtered getAllCharacters()`);
    
    // Check detail pages have visibility checks
    const loreDetailHasCheck = contentRoutesContent.includes('loreItem.visible === false && !res.locals.isContentCreator');
    const charDetailHasCheck = contentRoutesContent.includes('character.visible === false && !res.locals.isContentCreator');
    const epDetailHasCheck = contentRoutesContent.includes('episode.visible === false && !res.locals.isContentCreator');
    
    console.log(`   ${loreDetailHasCheck ? '✅' : '❌'} Lore detail page checks visibility`);
    console.log(`   ${charDetailHasCheck ? '✅' : '❌'} Character detail page checks visibility`);
    console.log(`   ${epDetailHasCheck ? '✅' : '❌'} Episode detail page checks visibility\n`);
    
  } catch (error) {
    console.error('❌ Error checking API files:', error.message);
  }
}

function checkUIFiles() {
  console.log('\n' + '-'.repeat(70));
  console.log('📊 STEP 4: Checking UI Templates\n');
  console.log('-'.repeat(70));
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    console.log('🔍 Checking view templates:\n');
    
    // Check character gallery
    const charGalleryPath = path.join(__dirname, '../views/character-gallery.ejs');
    const charGalleryContent = fs.readFileSync(charGalleryPath, 'utf8');
    const charHasIndicator = charGalleryContent.includes('visibility-indicator');
    console.log(`   ${charHasIndicator ? '✅' : '❌'} Character gallery has visibility indicators`);
    
    // Check lore gallery
    const loreGalleryPath = path.join(__dirname, '../views/lore-gallery.ejs');
    const loreGalleryContent = fs.readFileSync(loreGalleryPath, 'utf8');
    const loreHasIndicator = loreGalleryContent.includes('visibility-indicator');
    console.log(`   ${loreHasIndicator ? '✅' : '❌'} Lore gallery has visibility indicators`);
    
    // Check index page
    const indexPath = path.join(__dirname, '../views/index.ejs');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const indexHasIndicator = indexContent.includes('episode-visibility-indicator');
    console.log(`   ${indexHasIndicator ? '✅' : '❌'} Index page (episodes) has visibility indicators`);
    
    // Check edit page
    const editPath = path.join(__dirname, '../views/edit-content.ejs');
    const editContent = fs.readFileSync(editPath, 'utf8');
    const editHasToggle = editContent.includes('toggleVisibility');
    const editHasBadge = editContent.includes('visibilityBadge');
    console.log(`   ${editHasToggle ? '✅' : '❌'} Edit page has visibility toggle function`);
    console.log(`   ${editHasBadge ? '✅' : '❌'} Edit page has visibility badge`);
    
    // Check create page
    const createPath = path.join(__dirname, '../views/create-content.ejs');
    const createContent = fs.readFileSync(createPath, 'utf8');
    const createHasCheckbox = createContent.includes('Make visible immediately');
    console.log(`   ${createHasCheckbox ? '✅' : '❌'} Create page has visibility checkbox\n`);
    
  } catch (error) {
    console.error('❌ Error checking UI files:', error.message);
  }
}

async function runDiagnostic() {
  try {
    const dbData = await checkDatabase();
    await checkHelperFunctions();
    checkAPIEndpoints();
    checkUIFiles();
    
    console.log('\n' + '='.repeat(70));
    console.log('📋 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(70));
    
    console.log('\n✅ Diagnostic complete! Review the results above.\n');
    console.log('Common issues to look for:');
    console.log('  • Helper functions not being called with showHidden parameter');
    console.log('  • Gallery routes fetching data directly instead of using helpers');
    console.log('  • Detail pages missing visibility checks');
    console.log('  • UI templates not passing visible field to render\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

runDiagnostic();
