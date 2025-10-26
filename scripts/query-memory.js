#!/usr/bin/env node

/**
 * 🧠 WAVELENGTH MEMORY QUERY TOOL
 * Direct access to WAVELENGTH knowledge base for AI agents
 */

import WavelengthVectorStorage from '../lib/vector-storage.js';
import dotenv from 'dotenv';

dotenv.config();

async function queryMemory() {
  const query = process.argv[2];
  const type = process.argv[3]; // optional filter
  const limit = parseInt(process.argv[4]) || 5;

  if (!query) {
    console.log('Usage: node scripts/query-memory.js "your query" [type] [limit]');
    console.log('Example: node scripts/query-memory.js "Docker build tools"');
    console.log('Example: node scripts/query-memory.js "server startup" build_issue 3');
    process.exit(1);
  }

  console.log(`🧠 Querying WAVELENGTH Memory: "${query}"\n`);

  try {
    const vectorStorage = new WavelengthVectorStorage();
    const initResult = await vectorStorage.initialize();
    
    if (!initResult.success) {
      console.error('❌ Memory system not available:', initResult.error);
      console.log('💡 Run: node scripts/initialize-memory-system.js');
      process.exit(1);
    }

    const searchOptions = { limit };
    if (type) searchOptions.type = type;

    const searchResult = await vectorStorage.searchKnowledge(query, searchOptions);

    if (searchResult.success && searchResult.results.length > 0) {
      console.log(`✅ Found ${searchResult.results.length} relevant entries:\n`);
      
      searchResult.results.forEach((result, index) => {
        console.log(`${index + 1}. 📋 ${result.type ? result.type.toUpperCase() : 'UNKNOWN'}`);
        console.log(`   🎯 Score: ${result.score ? result.score.toFixed(3) : 'N/A'}`);
        console.log(`   📝 Content: ${result.content || 'No content'}`);
        if (result.tags && result.tags.length > 0) {
          console.log(`   🏷️  Tags: ${result.tags.join(', ')}`);
        }
        if (result.context) {
          console.log(`   🔍 Context: ${JSON.stringify(result.context, null, 2)}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No relevant knowledge found');
      console.log('💡 Try different keywords or run GitHub ingestion to populate more data');
    }

  } catch (error) {
    console.error('❌ Memory query failed:', error.message);
    process.exit(1);
  }
}

queryMemory();