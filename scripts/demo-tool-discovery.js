#!/usr/bin/env node

/**
 * WAVELENGTH Tool Discovery Demo
 * Shows how agents can discover tools through memory
 */

import WavelengthVectorStorage from '../lib/vector-storage.js';
import dotenv from 'dotenv';

dotenv.config();

async function demoToolDiscovery() {
  console.log('🔍 WAVELENGTH Tool Discovery Demo\n');

  try {
    const vectorStorage = new WavelengthVectorStorage();
    await vectorStorage.initialize();

    const scenarios = [
      {
        task: 'Fix Docker build issues',
        query: 'Docker tools validation'
      },
      {
        task: 'Test website health',
        query: 'testing health check tools'
      },
      {
        task: 'Check AWS deployment',
        query: 'AWS deployment monitoring'
      },
      {
        task: 'Query Firebase database',
        query: 'Firebase database tools'
      },
      {
        task: 'Find help for problems',
        query: 'help discovery tools'
      }
    ];

    for (const scenario of scenarios) {
      console.log(`🎯 Task: "${scenario.task}"`);
      console.log(`🔍 Query: "${scenario.query}"\n`);
      
      const results = await vectorStorage.searchKnowledge(scenario.query, {
        limit: 3
      });

      if (results.success && results.results.length > 0) {
        console.log(`✅ Found ${results.results.length} relevant tools:\n`);
        
        results.results.forEach((result, index) => {
          const toolName = result.context?.tool_name || 'Unknown';
          const category = result.context?.category || 'general';
          const usage = result.context?.usage_pattern || 'See documentation';
          
          console.log(`${index + 1}. 🛠️  ${toolName} (${category})`);
          console.log(`   📝 ${result.content.split('\n')[0]}`);
          console.log(`   💻 ${usage}`);
          console.log(`   🎯 Similarity: ${result.score.toFixed(3)}`);
          console.log('');
        });
      } else {
        console.log('❌ No tools found for this query\n');
      }
      
      console.log('─'.repeat(60) + '\n');
    }

    console.log('🎉 Tool discovery demo completed!');
    console.log('\n📋 Key Insight: Agents can discover ANY tool by describing their task!');

  } catch (error) {
    console.error('❌ Tool discovery demo failed:', error.message);
  }
}

demoToolDiscovery();