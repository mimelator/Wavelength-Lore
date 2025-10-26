#!/usr/bin/env node

/**
 * WAVELENGTH Memory System Demo - Search for deployment :latest
 */

import WavelengthVectorStorage from '../lib/vector-storage.js';
import dotenv from 'dotenv';

dotenv.config();

async function demoMemorySearch() {
  console.log('🔍 WAVELENGTH Memory Search Demo\n');

  try {
    const vectorStorage = new WavelengthVectorStorage();
    await vectorStorage.initialize();

    console.log('🎯 Searching for: "deployments with :latest"\n');
    
    const results = await vectorStorage.searchKnowledge('deployments with :latest docker tag latest version', {
      limit: 5
    });

    if (results.success && results.results.length > 0) {
      console.log(`✅ Found ${results.results.length} relevant entries:\n`);
      
      results.results.forEach((result, index) => {
        console.log(`${index + 1}. 📝 ${result.content.substring(0, 100)}...`);
        console.log(`   🎯 Similarity: ${result.score.toFixed(3)}`);
        console.log(`   🏷️  Tags: ${result.tags?.join(', ') || 'none'}`);
        console.log(`   📅 Date: ${result.timestamp || 'unknown'}`);
        console.log('');
      });
    } else {
      console.log('❌ No results found for deployment :latest queries');
    }

  } catch (error) {
    console.error('❌ Search failed:', error.message);
  }
}

demoMemorySearch();