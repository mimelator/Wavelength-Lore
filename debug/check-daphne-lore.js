#!/usr/bin/env node

require('dotenv').config();
const firebaseAdminUtils = require('../helpers/firebase-admin-utils');
const loreHelpers = require('../helpers/lore-helpers');

// Initialize Firebase Admin
firebaseAdminUtils.initializeFirebaseAdmin();

const admin = require('firebase-admin');
const db = admin.database();

(async () => {
  try {
    console.log('\n🔍 Checking Daphne Lore Object in Firebase\n');
    console.log('='.repeat(60));
    
    // Check raw database
    const loreRef = db.ref('lore');
    const snapshot = await loreRef.once('value');
    const allLore = snapshot.val();
    
    if (!allLore) {
      console.log('❌ No lore found in database');
      process.exit(1);
    }
    
    console.log(`\n📊 Total lore items in database: ${Object.keys(allLore).length}\n`);
    
    // Find Daphne lore
    let foundDaphne = false;
    Object.entries(allLore).forEach(([id, lore]) => {
      if (lore.title && lore.title.toLowerCase().includes('daphne')) {
        foundDaphne = true;
        console.log('✅ FOUND DAPHNE LORE IN DATABASE:');
        console.log('   Lore ID:', id);
        console.log('   Title:', lore.title);
        console.log('   Has "visible" field:', lore.visible !== undefined ? 'YES' : 'NO');
        console.log('   "visible" value:', lore.visible);
        console.log('   Would be filtered for public?', lore.visible === false ? 'YES (hidden)' : 'NO (visible)');
        console.log('\n   Full lore object:');
        console.log(JSON.stringify(lore, null, 2));
      }
    });
    
    if (!foundDaphne) {
      console.log('❌ No lore object with "Daphne" in title found');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n🧪 Testing Helper Function Filtering:\n');
    
    // Initialize helper
    const firebaseUtils = require('../helpers/firebase-utils');
    const database = firebaseUtils.initializeFirebase('wavelength-lore-main');
    loreHelpers.setDatabaseInstance(database);
    await loreHelpers.initializeLoreCache();
    
    // Get lore with and without filtering
    const allLoreFromHelper = loreHelpers.getAllLoreSync(true);
    const publicLoreFromHelper = loreHelpers.getAllLoreSync(false);
    
    console.log(`   All lore (content creator view): ${allLoreFromHelper.length} items`);
    console.log(`   Public lore (filtered): ${publicLoreFromHelper.length} items`);
    
    // Find Daphne in helper results
    const daphneAll = allLoreFromHelper.find(l => l.title && l.title.toLowerCase().includes('daphne'));
    const daphnePublic = publicLoreFromHelper.find(l => l.title && l.title.toLowerCase().includes('daphne'));
    
    if (daphneAll) {
      console.log('\n   ✅ Daphne in content creator view:', daphneAll.title);
      console.log('      visible:', daphneAll.visible);
    }
    
    if (daphnePublic) {
      console.log('   ⚠️  Daphne in public view:', daphnePublic.title);
      console.log('      visible:', daphnePublic.visible);
    } else {
      console.log('   ✅ Daphne NOT in public view (properly hidden)');
    }
    
    console.log('\n' + '='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
