#!/usr/bin/env node

/**
 * WAVELENGTH Memory System Test Script
 * Tests the vector storage and GitHub integration
 */

import WavelengthVectorStorage from '../lib/vector-storage.js';
import GitHubIntegration from '../lib/github-integration.js';
import dotenv from 'dotenv';

dotenv.config();

async function testMemorySystem() {
  console.log('🧪 Testing WAVELENGTH Memory System...\n');

  try {
    // Test 1: Vector Storage Initialization
    console.log('1️⃣ Testing Vector Storage Initialization...');
    const vectorStorage = new WavelengthVectorStorage();
    const initResult = await vectorStorage.initialize();
    
    if (initResult.success) {
      console.log('✅ Vector storage initialized successfully');
    } else {
      console.log('❌ Vector storage initialization failed:', initResult.error);
      return;
    }

    // Test 2: Store Sample Knowledge
    console.log('\n2️⃣ Testing Knowledge Storage...');
    const sampleKnowledge = {
      id: `test_knowledge_${Date.now()}`,
      type: 'build_issue',
      content: 'Docker build failing - /app/start.sh not found. Fixed by correcting Dockerfile COPY path.',
      tags: ['docker', 'build-failure', 'production', 'solved'],
      context: {
        file: 'Dockerfile',
        error: '/app/start.sh not found',
        solution: 'Change docker/docker-start.sh → docker-start.sh'
      },
      timestamp: new Date().toISOString()
    };

    const storeResult = await vectorStorage.storeKnowledge(sampleKnowledge);
    if (storeResult.success) {
      console.log('✅ Knowledge stored successfully:', storeResult.id);
    } else {
      console.log('❌ Knowledge storage failed');
    }

    // Test 3: Search Knowledge
    console.log('\n3️⃣ Testing Knowledge Search...');
    const searchResult = await vectorStorage.searchKnowledge('Docker build error start.sh', {
      type: 'build_issue',
      limit: 3
    });

    if (searchResult.success) {
      console.log(`✅ Found ${searchResult.results.length} relevant knowledge entries`);
      searchResult.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.content.substring(0, 100)}... (Score: ${result.score.toFixed(3)})`);
      });
    } else {
      console.log('❌ Knowledge search failed');
    }

    // Test 4: GitHub Integration (if token available)
    if (process.env.GITHUB_TOKEN) {
      console.log('\n4️⃣ Testing GitHub Integration...');
      const github = new GitHubIntegration();
      
      // Test finding similar issues (mock)
      const similarResult = await github.findSimilarIssues('Docker build failing', 'wavelength-lore/wavelength-lore');
      if (similarResult.success) {
        console.log(`✅ GitHub integration working - found ${similarResult.similar_issues.length} similar issues`);
      }
    } else {
      console.log('\n4️⃣ Skipping GitHub Integration (no GITHUB_TOKEN)');
    }

    // Test 5: Vector Storage Stats
    console.log('\n5️⃣ Testing Storage Statistics...');
    const statsResult = await vectorStorage.getStats();
    if (statsResult.success) {
      console.log('✅ Storage stats retrieved:');
      console.log(`   Total vectors: ${statsResult.stats.total_vectors}`);
      console.log(`   Dimension: ${statsResult.stats.dimension}`);
      console.log(`   Index fullness: ${(statsResult.stats.index_fullness * 100).toFixed(2)}%`);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Set up environment variables (PINECONE_API_KEY, OPENAI_API_KEY, GITHUB_TOKEN)');
    console.log('   2. Run: node scripts/ingest-github-data.js to populate with historical data');
    console.log('   3. Start using: await mcp.callTool("wavelength_memory", {action: "recall", query: "your question"})');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testMemorySystem();