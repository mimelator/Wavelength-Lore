#!/usr/bin/env node

/**
 * WAVELENGTH Forum Tools Discovery
 * Uses memory system to find all forum-related tools
 */

import WavelengthVectorStorage from '../lib/vector-storage.js';
import dotenv from 'dotenv';

dotenv.config();

async function discoverForumTools() {
  console.log('🔍 Discovering WAVELENGTH Forum Tools...\n');

  try {
    const vectorStorage = new WavelengthVectorStorage();
    await vectorStorage.initialize();

    const forumQueries = [
      'forum tools',
      'forum management',
      'forum posts',
      'forum moderation',
      'forum database',
      'forum attachments',
      'forum delete',
      'forum validation'
    ];

    const allResults = new Map();

    for (const query of forumQueries) {
      console.log(`🔍 Searching: "${query}"`);
      
      const results = await vectorStorage.searchKnowledge(query, { limit: 5 });
      
      if (results.success && results.results.length > 0) {
        console.log(`✅ Found ${results.results.length} results\n`);
        
        results.results.forEach((result, index) => {
          const key = result.id;
          if (!allResults.has(key)) {
            allResults.set(key, {
              ...result,
              queries: [query]
            });
          } else {
            allResults.get(key).queries.push(query);
          }
        });
      }
      
      console.log('─'.repeat(50));
    }

    // Display unique forum tools
    console.log('\n🎯 DISCOVERED FORUM TOOLS:\n');
    
    const sortedResults = Array.from(allResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    sortedResults.forEach((result, index) => {
      const title = result.content.split('\n')[0].substring(0, 80);
      const filePath = result.context?.file_path || 'Unknown source';
      
      console.log(`${index + 1}. 📝 ${title}...`);
      console.log(`   📁 ${filePath}`);
      console.log(`   🎯 Relevance: ${result.score.toFixed(3)}`);
      console.log(`   🔍 Found in: ${result.queries.join(', ')}`);
      console.log('');
    });

    console.log('🎉 Forum tools discovery completed!');

  } catch (error) {
    console.error('❌ Forum tools discovery failed:', error.message);
  }
}

discoverForumTools();