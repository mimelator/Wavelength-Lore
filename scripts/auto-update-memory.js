#!/usr/bin/env node

/**
 * WAVELENGTH Auto-Update Memory System
 * Low-maintenance solution for regular memory updates
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function autoUpdateMemory() {
  console.log('🔄 WAVELENGTH Auto-Update Memory System\n');

  try {
    const lastUpdateFile = './temp/last-memory-update.json';
    const now = new Date();
    
    // Check if update is needed
    let lastUpdate = null;
    if (existsSync(lastUpdateFile)) {
      const data = JSON.parse(readFileSync(lastUpdateFile, 'utf8'));
      lastUpdate = new Date(data.timestamp);
    }

    // Update if more than 24 hours or no previous update
    const shouldUpdate = !lastUpdate || (now - lastUpdate) > 24 * 60 * 60 * 1000;
    
    if (!shouldUpdate) {
      console.log('✅ Memory system is up to date (last updated:', lastUpdate.toISOString(), ')');
      return;
    }

    console.log('🚀 Starting memory system update...\n');

    // 1. Update GitHub history (incremental)
    console.log('1️⃣ Updating GitHub history...');
    try {
      execSync('node scripts/ingest-github-history.js', { stdio: 'inherit' });
      console.log('✅ GitHub history updated');
    } catch (error) {
      console.log('⚠️ GitHub history update failed (continuing...)');
    }

    // 2. Update tool documentation (quick)
    console.log('\n2️⃣ Updating tool documentation...');
    try {
      execSync('node scripts/ingest-tool-documentation.js', { stdio: 'inherit' });
      console.log('✅ Tool documentation updated');
    } catch (error) {
      console.log('⚠️ Tool documentation update failed (continuing...)');
    }

    // 3. Update comprehensive knowledge (weekly only)
    const isWeeklyUpdate = !lastUpdate || (now - lastUpdate) > 7 * 24 * 60 * 60 * 1000;
    if (isWeeklyUpdate) {
      console.log('\n3️⃣ Weekly comprehensive knowledge update...');
      try {
        execSync('node scripts/ingest-comprehensive-knowledge.js', { stdio: 'inherit' });
        console.log('✅ Comprehensive knowledge updated');
      } catch (error) {
        console.log('⚠️ Comprehensive knowledge update failed (continuing...)');
      }
    } else {
      console.log('\n3️⃣ Skipping comprehensive update (weekly only)');
    }

    // Save update timestamp
    const updateData = {
      timestamp: now.toISOString(),
      type: isWeeklyUpdate ? 'full' : 'incremental',
      success: true
    };
    
    // Ensure temp directory exists
    execSync('mkdir -p temp', { stdio: 'ignore' });
    writeFileSync(lastUpdateFile, JSON.stringify(updateData, null, 2));

    console.log('\n🎉 Memory system auto-update completed!');
    console.log(`📊 Update type: ${updateData.type}`);
    console.log(`⏰ Next update: ${new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()}`);

  } catch (error) {
    console.error('❌ Auto-update failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  autoUpdateMemory();
}

export default autoUpdateMemory;