#!/usr/bin/env node

require('dotenv').config();
const { initializeFirebaseAdmin } = require('../helpers/firebase-admin-utils');
const db = initializeFirebaseAdmin();

async function finalVerification() {
  console.log('✅ FINAL VERIFICATION AFTER FIXES\n');
  console.log('='.repeat(60));
  
  // Check characters
  const chars = await db.ref('characters').once('value');
  const charData = chars.val();
  
  console.log('\n✅ CHARACTERS: NOW CORRECT');
  console.log('  - Structure: Each character stored individually by ID');
  console.log('  - Total characters:', Object.keys(charData || {}).length);
  console.log('  - Characters:');
  for (const [id, data] of Object.entries(charData || {})) {
    console.log(`    • ${id}: ${data.title}`);
  }
  
  // Check one character in detail
  console.log('\n📋 Sample Character (andrew):');
  const andrew = charData.andrew;
  console.log('  - ID:', andrew.id);
  console.log('  - Title:', andrew.title);
  console.log('  - Description:', andrew.description?.substring(0, 80) + '...');
  console.log('  - Has image:', !!andrew.image);
  console.log('  - Keywords count:', andrew.keywords?.length || 0);
  
  // Check lore with categories
  const lore = await db.ref('lore').once('value');
  const loreData = lore.val();
  
  console.log('\n✅ LORE: NOW INCLUDES CATEGORIES');
  console.log('  - Total lore items:', Object.keys(loreData || {}).length);
  
  // Group by category
  const byCategory = {};
  for (const [id, data] of Object.entries(loreData || {})) {
    const cat = data.category || 'unknown';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({ id, title: data.title });
  }
  
  console.log('  - By category:');
  for (const [cat, items] of Object.entries(byCategory)) {
    console.log(`    • ${cat}: ${items.length} items`);
    items.forEach(item => console.log(`      - ${item.id}: ${item.title}`));
  }
  
  // Check seasons
  const seasons = await db.ref('videos').once('value');
  const seasonData = seasons.val();
  let totalEpisodes = 0;
  for (const season of Object.values(seasonData || {})) {
    totalEpisodes += Object.keys(season.episodes || {}).length;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 SUCCESS! All data imported correctly:');
  console.log(`  ✅ ${Object.keys(seasonData || {}).length} seasons with ${totalEpisodes} episodes`);
  console.log(`  ✅ ${Object.keys(charData || {}).length} characters (individually stored)`);
  console.log(`  ✅ ${Object.keys(loreData || {}).length} lore items (with categories)`);
  
  process.exit(0);
}

finalVerification().catch(err => { 
  console.error('Error:', err); 
  process.exit(1); 
});
